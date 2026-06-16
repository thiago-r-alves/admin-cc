import { ObjectId } from 'mongodb';
import { ClientModel } from '../../models/Client';
import { ClosureGroupModel } from '../../models/ClosureGroup';
import { CacambaModel } from '../../models/Cacamba';
import { OrderModel } from '../../models/Order';
import { UserModel } from '../../models/User';
import { mapPriority } from '../../utils/order';
import { emitOrderCompleted, emitOrdersUpdated, notifyDrivers } from '../../shared/realtime';
import { buildOrderClientSnapshot, isOrderType, ORDER_CLIENT_SNAPSHOT_FIELDS } from './helpers';
import {
  buildClosureGroupClientMatch,
  getNextClosureGroupSequence,
} from '../closures/helpers';

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
  } = payload;

  if (!clientId) return { status: 400, body: { message: 'clientId é obrigatório' } };
  if (!type) return { status: 400, body: { message: 'type é obrigatório' } };
  if (!isOrderType(type)) return { status: 400, body: { message: 'type deve ser entrega ou retirada' } };

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
  });

  const populated = await OrderModel.findById(order._id)
    .populate('motorista')
    .populate('cacambas')
    .lean();

  emitOrdersUpdated();

  return { status: 201, body: populated };
};

export const listOrders = () =>
  OrderModel.find()
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
    .sort({ priority: -1, createdAt: 1 });

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
      (cacamba.paymentStatus === 'nota_fiscal_pendente' || cacamba.paymentStatus === 'paga'),
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
  const { type, motorista } = payload;
  const normalizedMotorista = String(motorista || '').trim();

  if (!isOrderType(type)) {
    return { status: 400, body: { message: 'type deve ser entrega ou retirada' } };
  }

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
    { type, motorista: normalizedMotorista, updatedAt: Date.now() },
    { new: true },
  )
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

  const fields = [...ORDER_CLIENT_SNAPSHOT_FIELDS, 'type', 'status', 'motorista'];
  for (const field of fields) {
    if (payload[field] !== undefined) updates[field] = payload[field];
  }
  if (payload.priority !== undefined) updates.priority = mapPriority(payload.priority);

  const updated = await OrderModel.findByIdAndUpdate(id, updates, { new: true });
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
