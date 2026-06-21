import { ObjectId } from 'mongodb';
import { ClientModel } from '../../models/Client';
import { ClosureGroupModel } from '../../models/ClosureGroup';
import { CacambaModel } from '../../models/Cacamba';
import { OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { mapPriority } from '../../utils/order';
import { emitOrderCompleted, emitOrdersUpdated, notifyDrivers } from '../../shared/realtime';
import { buildOrderClientSnapshot, isOrderType, ORDER_CLIENT_SNAPSHOT_FIELDS } from './helpers';
import { enrichWithdrawalCacambasWithDeliveryMetadata } from '../cacambas/enrichment';
import {
  buildClosureGroupClientMatch,
  getNextClosureGroupSequence,
} from '../closures/helpers';

const parseCacambaPrice = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateCacambaPriceForType = (type: unknown, value: unknown) => {
  if (type === 'retirada') {
    const parsed = parseCacambaPrice(value);
    if (parsed === null || parsed <= 0) {
      return {
        ok: false as const,
        body: { message: 'Valor da caçamba é obrigatório para pedidos de retirada.' },
      };
    }
    return { ok: true as const, value: parsed };
  }

  if (value !== undefined && value !== null && String(value).trim() !== '') {
    return {
      ok: false as const,
      body: { message: 'Valor da caçamba é permitido apenas para pedidos de retirada.' },
    };
  }

  return { ok: true as const, value: undefined };
};

const normalizeSnapshotValue = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCepValue = (value: unknown) => normalizeSnapshotValue(value).replace(/\D/g, '');

const sameAddressSnapshot = (order: any, payload: Record<string, unknown>) =>
  normalizeSnapshotValue(order?.address) === normalizeSnapshotValue(payload.address) &&
  normalizeSnapshotValue(order?.addressNumber) === normalizeSnapshotValue(payload.addressNumber) &&
  normalizeSnapshotValue(order?.neighborhood) === normalizeSnapshotValue(payload.neighborhood) &&
  normalizeSnapshotValue(order?.city) === normalizeSnapshotValue(payload.city) &&
  normalizeCepValue(order?.cep) === normalizeCepValue(payload.cep);

const getPlannedWithdrawalIds = (value: unknown) => {
  if (value === undefined || value === null) return { ok: true as const, ids: [] as ObjectId[] };
  if (!Array.isArray(value)) {
    return {
      ok: false as const,
      status: 400,
      body: { message: 'plannedWithdrawalCacambaIds deve ser uma lista de caçambas.' },
    };
  }

  const seen = new Set<string>();
  const ids: ObjectId[] = [];
  for (const item of value) {
    const id = String(item || '').trim();
    if (!ObjectId.isValid(id)) {
      return {
        ok: false as const,
        status: 400,
        body: { message: 'plannedWithdrawalCacambaIds contém uma caçamba inválida.' },
      };
    }
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(new ObjectId(id));
  }

  return { ok: true as const, ids };
};

const validatePlannedWithdrawals = async (
  type: unknown,
  clientId: unknown,
  payload: Record<string, unknown>,
) => {
  const parsed = getPlannedWithdrawalIds(payload.plannedWithdrawalCacambaIds);
  if (!parsed.ok) return parsed;

  if (parsed.ids.length === 0) return { ok: true as const, ids: [] as ObjectId[] };

  if (type !== 'retirada') {
    return {
      ok: false as const,
      status: 400,
      body: { message: 'Caçambas planejadas são permitidas apenas para pedidos de retirada.' },
    };
  }

  const alreadyPlanned = await OrderModel.findOne({
    type: 'retirada',
    status: { $in: ['pendente', 'em_andamento'] },
    plannedWithdrawalCacambaIds: { $in: parsed.ids },
  })
    .select('orderNumber')
    .lean();
  if (alreadyPlanned) {
    const suffix = alreadyPlanned.orderNumber ? ` no pedido #${alreadyPlanned.orderNumber}` : '';
    return {
      ok: false as const,
      status: 409,
      body: { message: `Uma ou mais caçambas já estão planejadas para retirada${suffix}.` },
    };
  }

  const plannedCacambas = await CacambaModel.find({ _id: { $in: parsed.ids } })
    .populate('orderId', 'clientId clientName orderNumber address addressNumber neighborhood city cep')
    .lean();
  if (plannedCacambas.length !== parsed.ids.length) {
    return {
      ok: false as const,
      status: 404,
      body: { message: 'Uma ou mais caçambas planejadas não foram encontradas.' },
    };
  }

  for (const plannedCacamba of plannedCacambas) {
    if (plannedCacamba.tipo !== 'entrega') {
      return {
        ok: false as const,
        status: 400,
        body: { message: 'Apenas caçambas entregues podem ser planejadas para retirada.' },
      };
    }

    const deliveryOrder = plannedCacamba.orderId as any;
    if (String(deliveryOrder?.clientId || '') !== String(clientId || '')) {
      return {
        ok: false as const,
        status: 400,
        body: { message: 'Todas as caçambas planejadas devem pertencer ao cliente do pedido.' },
      };
    }

    if (!sameAddressSnapshot(deliveryOrder, payload)) {
      return {
        ok: false as const,
        status: 400,
        body: { message: 'Todas as caçambas planejadas devem pertencer ao endereço do pedido.' },
      };
    }

    const latestMovement = await CacambaModel.findOne({ numero: plannedCacamba.numero })
      .sort({ createdAt: -1, _id: -1 })
      .select('_id tipo')
      .lean();
    if (!latestMovement || String(latestMovement._id) !== String(plannedCacamba._id)) {
      return {
        ok: false as const,
        status: 400,
        body: { message: `A caçamba ${plannedCacamba.numero} já não está disponível para retirada.` },
      };
    }
  }

  return { ok: true as const, ids: parsed.ids };
};

export const createOrder = async (payload: Record<string, unknown>) => {
  const {
    clientId,
    clientName,
    cnpjCpf,
    city,
    cep,
    contactName,
    contactNumber,
    neighborhood,
    address,
    addressNumber,
    type,
    priority,
    motorista,
    placa,
    cacambaPrice,
  } = payload;

  if (!clientId) return { status: 400, body: { message: 'clientId é obrigatório' } };
  if (!type) return { status: 400, body: { message: 'type é obrigatório' } };
  if (!isOrderType(type)) return { status: 400, body: { message: 'type deve ser entrega ou retirada' } };
  const priceValidation = validateCacambaPriceForType(type, cacambaPrice);
  if (!priceValidation.ok) return { status: 400, body: priceValidation.body };
  const plannedWithdrawalValidation = await validatePlannedWithdrawals(type, clientId, payload);
  if (!plannedWithdrawalValidation.ok) {
    return { status: plannedWithdrawalValidation.status, body: plannedWithdrawalValidation.body };
  }

  const last = await OrderModel.findOne({ orderNumber: { $ne: null } })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();
  const nextOrderNumber = (last?.orderNumber ?? 0) + 1;

  const order = await OrderModel.create({
    clientId,
    clientName,
    cnpjCpf: cnpjCpf || '',
    city: city || '',
    cep: cep || '',
    contactName,
    contactNumber,
    neighborhood,
    address,
    addressNumber,
    type,
    priority: mapPriority(priority),
    motorista: motorista || null,
    orderNumber: nextOrderNumber,
    placa: placa || '',
    ...(type === 'retirada' ? { cacambaPrice: priceValidation.value } : {}),
    ...(plannedWithdrawalValidation.ids.length
      ? { plannedWithdrawalCacambaIds: plannedWithdrawalValidation.ids }
      : {}),
  });

  const populated = await OrderModel.findById(order._id)
    .select('+cacambaPrice')
    .populate('motorista')
    .populate('cacambas')
    .lean();

  emitOrdersUpdated();

  return { status: 201, body: populated };
};

export const listOrders = async () => {
  const orders = await OrderModel.find()
    .select('+cacambaPrice')
    .populate([
      {
        path: 'motorista',
        select: 'username',
      },
      {
        path: 'cacambas',
        select: 'numero tipo paymentStatus contentType price imageUrl createdAt local horaServicoDigitos',
      },
    ])
    .sort({ priority: -1, createdAt: 1 })
    .lean();

  return enrichWithdrawalCacambasWithDeliveryMetadata(orders as any[]);
};

export const changeOrderClient = async (id: string, targetClientId: string) => {
  const normalizedClientId = String(targetClientId || '').trim();
  if (!normalizedClientId) {
    return { status: 400, body: { message: 'clientId é obrigatório.' } };
  }

  const order = await OrderModel.findById(id).populate({
    path: 'cacambas',
    select: '_id paymentStatus closureGroupId tipo',
  });
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado.' } };
  }

  if (String(order.clientId) === normalizedClientId) {
    return { status: 400, body: { message: 'O pedido já está vinculado a este cliente.' } };
  }

  const targetClient = await ClientModel.findById(normalizedClientId).lean();
  if (!targetClient) {
    return { status: 404, body: { message: 'Cliente de destino não encontrado.' } };
  }

  const snapshot = buildOrderClientSnapshot(targetClient);
  const orderCacambas = ((order.cacambas || []) as any[])
    .filter(Boolean)
    .map((cacamba) => ({
      _id: String(cacamba._id),
      paymentStatus: String(cacamba.paymentStatus || 'pendente'),
      closureGroupId: cacamba.closureGroupId ? String(cacamba.closureGroupId) : '',
      tipo: String(cacamba.tipo || ''),
    }));

  const groupedCacambas = orderCacambas.filter(
    (cacamba) =>
      cacamba.tipo === 'retirada' &&
      cacamba.closureGroupId &&
      (cacamba.paymentStatus === 'nota_fiscal_pendente' ||
        cacamba.paymentStatus === 'pix_pendente' ||
        cacamba.paymentStatus === 'paga'),
  );

  const groupedIds = new Set(groupedCacambas.map((cacamba) => cacamba._id));
  const closureGroupIds = Array.from(new Set(groupedCacambas.map((cacamba) => cacamba.closureGroupId)));
  const closureGroups = closureGroupIds.length
    ? await ClosureGroupModel.find({ _id: { $in: closureGroupIds } })
    : [];
  const closureGroupMap = new Map(closureGroups.map((group) => [String(group._id), group]));

  for (const cacamba of groupedCacambas) {
    const group = closureGroupMap.get(cacamba.closureGroupId);
    if (!group) {
      return { status: 409, body: { message: 'Grupo de fechamento relacionado não foi encontrado.' } };
    }
    const groupIds = new Set((group.cacambaIds || []).map((item) => String(item)));
    if (!groupIds.has(cacamba._id)) {
      return {
        status: 409,
        body: { message: 'Há caçambas vinculadas a um grupo de fechamento incompatível.' },
      };
    }
  }

  Object.assign(order, snapshot);
  await order.save();

  let migratedCacambas = 0;
  let createdClosureGroups = 0;
  let updatedClosureGroups = 0;
  let deletedClosureGroups = 0;

  for (const sourceGroupId of closureGroupIds) {
    const sourceGroup = closureGroupMap.get(sourceGroupId);
    if (!sourceGroup) continue;

    const sourceIds = (sourceGroup.cacambaIds || []).map((item) => String(item));
    const movingIds = sourceIds.filter((item) => groupedIds.has(item));
    if (!movingIds.length) continue;

    const nextSequence = await getNextClosureGroupSequence(normalizedClientId);
    const newGroup = await ClosureGroupModel.create({
      clientId: normalizedClientId,
      clientSequenceNumber: nextSequence,
      startDate: sourceGroup.startDate,
      endDate: sourceGroup.endDate,
      cacambaIds: movingIds.map((item) => new ObjectId(item)),
      status: sourceGroup.status,
      invoiceNumber: sourceGroup.invoiceNumber || '',
      createdBy: sourceGroup.createdBy,
    });
    createdClosureGroups += 1;

    await CacambaModel.updateMany(
      { _id: { $in: movingIds } },
      { $set: { closureGroupId: newGroup._id } },
    );
    migratedCacambas += movingIds.length;

    const remainingIds = sourceIds.filter((item) => !groupedIds.has(item));
    if (remainingIds.length === 0) {
      await ClosureGroupModel.deleteOne({ _id: sourceGroup._id });
      deletedClosureGroups += 1;
    } else {
      sourceGroup.cacambaIds = remainingIds.map((item) => new ObjectId(item)) as any;
      await sourceGroup.save();
      updatedClosureGroups += 1;
    }
  }

  const updatedOrder = await OrderModel.findById(order._id)
    .populate('motorista')
    .populate('cacambas')
    .lean();

  emitOrdersUpdated();

  return {
    status: 200,
    body: {
      order: updatedOrder,
      migration: {
        migratedCacambas,
        createdClosureGroups,
        updatedClosureGroups,
        deletedClosureGroups,
      },
    },
  };
};

export const correctPendingOrder = async (id: string, payload: Record<string, unknown>) => {
  const { type, motorista, cacambaPrice } = payload;
  const normalizedMotorista = String(motorista || '').trim();

  if (!isOrderType(type)) {
    return { status: 400, body: { message: 'type deve ser entrega ou retirada' } };
  }
  const priceValidation = validateCacambaPriceForType(type, cacambaPrice);
  if (!priceValidation.ok) return { status: 400, body: priceValidation.body };

  if (!normalizedMotorista) {
    return { status: 400, body: { message: 'motorista é obrigatório' } };
  }

  const driver = await UserModel.findOne({ _id: normalizedMotorista, role: 'motorista' }).select('_id');
  if (!driver) {
    return { status: 404, body: { message: 'Motorista não encontrado.' } };
  }

  const order = await OrderModel.findById(id).select('status cacambas');
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado' } };
  }

  if (order.status !== 'pendente') {
    return { status: 409, body: { message: 'Apenas pedidos pendentes podem ser corrigidos.' } };
  }

  if ((order.cacambas || []).length > 0) {
    return {
      status: 409,
      body: { message: 'Não é possível corrigir um pedido que já possui caçambas cadastradas.' },
    };
  }

  const updated = await OrderModel.findByIdAndUpdate(
    id,
    {
      type,
      motorista: normalizedMotorista,
      updatedAt: Date.now(),
      ...(type === 'retirada' ? { cacambaPrice: priceValidation.value } : { $unset: { cacambaPrice: '' } }),
    },
    { new: true },
  )
    .select('+cacambaPrice')
    .populate('motorista')
    .populate('cacambas')
    .lean();

  emitOrdersUpdated();

  return { status: 200, body: updated };
};

export const updateOrder = async (id: string, payload: Record<string, unknown>) => {
  const updates: Record<string, unknown> = {};

  if (payload.type !== undefined && !isOrderType(payload.type)) {
    return { status: 400, body: { message: 'type deve ser entrega ou retirada' } };
  }

  const needsPriceValidation = payload.type !== undefined || payload.cacambaPrice !== undefined;
  if (needsPriceValidation) {
    const existingOrder = await OrderModel.findById(id).select('+cacambaPrice type').lean();
    if (!existingOrder) return { status: 404, body: { message: 'Pedido não encontrado' } };
    const typeForValidation = payload.type !== undefined ? payload.type : existingOrder.type;
    const priceForValidation =
      payload.cacambaPrice !== undefined ? payload.cacambaPrice : existingOrder.cacambaPrice;
    const priceValidation = validateCacambaPriceForType(typeForValidation, priceForValidation);
    if (!priceValidation.ok) return { status: 400, body: priceValidation.body };
    if (typeForValidation === 'retirada') updates.cacambaPrice = priceValidation.value;
  }

  const fields = [...ORDER_CLIENT_SNAPSHOT_FIELDS, 'type', 'status', 'motorista'];
  for (const field of fields) {
    if (payload[field] !== undefined) updates[field] = payload[field];
  }
  if (payload.type === 'entrega') {
    updates.$unset = { cacambaPrice: '' };
  }
  if (payload.priority !== undefined) updates.priority = mapPriority(payload.priority);

  const updated = await OrderModel.findByIdAndUpdate(id, updates, { new: true }).select('+cacambaPrice');
  if (!updated) return { status: 404, body: { message: 'Pedido não encontrado' } };

  if (updated.status === 'concluido') {
    emitOrderCompleted({
      orderId: updated._id,
      orderNumber: updated.orderNumber,
      clientName: updated.clientName,
      address: updated.address,
      addressNumber: updated.addressNumber,
      neighborhood: updated.neighborhood,
      city: updated.city || '',
      cep: updated.cep || '',
    });
  }

  return { status: 200, body: updated };
};

export const deleteOrder = async (id: string) => {
  const deletedOrder = await OrderModel.findByIdAndDelete(id);
  if (!deletedOrder) {
    return { status: 404, body: { message: 'Pedido não encontrado.' } };
  }

  notifyDrivers();
  return { status: 200, body: { message: 'Pedido excluído com sucesso!' } };
};
