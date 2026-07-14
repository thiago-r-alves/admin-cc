import { CacambaModel } from '../../models/Cacamba';
import { OrderModel } from '../../models/Order';
import { IUser, UserModel } from '../../models/User';
import { uploadBufferToGridFS } from '../../gridfs';
import { compressImage } from '../../utils/image';
import { emitOrdersUpdated } from '../../shared/realtime';
import { isValidCacambaContentType } from '../cacambas/helpers';
import { listAvailableCacambasForClient, validateCacambaAvailability } from '../cacambas/availability';

type CompleteOrderProofPayload = {
  proof?: { type?: unknown; signatureDataUrl?: unknown; note?: unknown };
  reuseProof?: unknown;
};

const MAX_SIGNATURE_BYTES = 1_500_000;
const REUSABLE_DELIVERY_PROOF_WINDOW_MS = 2 * 60 * 60 * 1000;

const parseSignatureDataUrl = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^data:image\/png;base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
  return buffer.length > 0 && buffer.length <= MAX_SIGNATURE_BYTES ? buffer : null;
};

const buildDeliveryProofUpdate = async (orderId: string, driverId: string, payload: CompleteOrderProofPayload) => {
  const proof = payload.proof;
  if (!proof || (proof.type !== 'signed' && proof.type !== 'no_responsible')) {
    return { ok: false as const, status: 400, body: { message: 'Comprovante da locação é obrigatório para concluir o pedido.' } };
  }

  const driver = await UserModel.findById(driverId).select('username').lean();
  const common = { capturedAt: new Date(), capturedBy: driverId, driverNameSnapshot: driver?.username || '' };
  if (proof.type === 'no_responsible') {
    return { ok: true as const, value: { type: 'no_responsible' as const, note: String(proof.note || '').trim(), ...common } };
  }

  const signature = parseSignatureDataUrl(proof.signatureDataUrl);
  if (!signature) {
    return { ok: false as const, status: 400, body: { message: 'Assinatura pelo recebimento da locação é obrigatória para concluir o pedido.' } };
  }
  const fileId = await uploadBufferToGridFS(signature, `delivery-proof-${orderId}-${Date.now()}.png`, 'image/png');
  return { ok: true as const, value: { type: 'signed' as const, signatureImageUrl: `/files/${fileId}`, ...common } };
};

const normalizeProofMatchValue = (value: unknown) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const getReusableDeliveryProofRange = (now = new Date()) => {
  const end = now;
  const start = new Date(end.getTime() - REUSABLE_DELIVERY_PROOF_WINDOW_MS);
  return { start, end };
};

const findReusableDeliveryProof = async (order: any, driverId: string, now = new Date()) => {
  const { start, end } = getReusableDeliveryProofRange(now);
  const candidates = await OrderModel.find({
    _id: { $ne: order._id },
    clientId: order.clientId,
    motorista: driverId,
    type: { $in: ['entrega', 'retirada'] },
    status: 'concluido',
    'deliveryProof.capturedAt': { $gte: start, $lte: end },
    'deliveryProof.isReused': { $ne: true },
  })
    .select('orderNumber address addressNumber neighborhood city cep deliveryProof')
    .sort({ 'deliveryProof.capturedAt': 1, _id: 1 })
    .lean();
  const fields = ['address', 'addressNumber', 'neighborhood', 'city', 'cep'] as const;
  return candidates.find((candidate: any) =>
    fields.every((field) => normalizeProofMatchValue(candidate[field]) === normalizeProofMatchValue(order[field])),
  ) as any | undefined;
};

const buildReusedDeliveryProof = (sourceOrder: any, reusedAt = new Date()) => ({
  type: sourceOrder.deliveryProof.type,
  signatureImageUrl: sourceOrder.deliveryProof.signatureImageUrl || '',
  note: sourceOrder.deliveryProof.note || '',
  capturedAt: sourceOrder.deliveryProof.capturedAt,
  capturedBy: sourceOrder.deliveryProof.capturedBy,
  driverNameSnapshot: sourceOrder.deliveryProof.driverNameSnapshot || '',
  isReused: true,
  reusedFromOrderId: sourceOrder._id,
  reusedFromOrderNumber: sourceOrder.orderNumber,
  reusedAt,
});

const hideDriverCacambaPrice = (cacamba: any) => {
  const plain = typeof cacamba?.toObject === 'function' ? cacamba.toObject() : { ...(cacamba || {}) };
  delete plain.price;
  return plain;
};

const findLatestDeliveryPriceForWithdrawal = async (numero: string, clientId: unknown) => {
  const deliveries = await CacambaModel.find({ numero, tipo: 'entrega' })
    .sort({ createdAt: -1, _id: -1 })
    .populate('orderId', 'clientId')
    .select('price orderId')
    .lean();

  const delivery = deliveries.find((item: any) => String(item?.orderId?.clientId || '') === String(clientId || ''));
  const price = delivery?.price;
  return typeof price === 'number' && Number.isFinite(price) ? price : undefined;
};

export const createDriver = async (payload: { username?: string; password?: string }) => {
  const existingUser = await UserModel.findOne({ username: payload.username });
  if (existingUser) {
    return { status: 409, body: { message: 'Usuário já existe.' } };
  }

  const newDriver = new UserModel({
    username: payload.username,
    password: payload.password,
    role: 'motorista',
  });
  await newDriver.save();

  return {
    status: 201,
    body: {
      message: 'Motorista cadastrado com sucesso!',
      driver: { id: newDriver._id, username: newDriver.username },
    },
  };
};

export const listDrivers = () => UserModel.find({ role: 'motorista' }).select('-password');

export const updateDriver = async (id: string, payload: { username?: string; password?: string }) => {
  const updates: Partial<IUser> = {};
  if (payload.username) updates.username = payload.username;
  if (payload.password) updates.password = payload.password;

  const updatedDriver = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select('-password');
  if (!updatedDriver) {
    return { status: 404, body: { message: 'Motorista não encontrado.' } };
  }

  return {
    status: 200,
    body: {
      message: 'Motorista atualizado com sucesso!',
      driver: { id: updatedDriver._id, username: updatedDriver.username },
    },
  };
};

export const deleteDriver = async (id: string) => {
  const deletedDriver = await UserModel.findByIdAndDelete(id);
  if (!deletedDriver) {
    return { status: 404, body: { message: 'Motorista não encontrado.' } };
  }
  return { status: 200, body: { message: 'Motorista excluído com sucesso!' } };
};

export const listDriverOrders = (driverId: string) =>
  OrderModel.find({ motorista: driverId })
    .populate({
      path: 'cacambas',
      select: 'numero tipo paymentStatus contentType imageUrl createdAt local horaServicoDigitos',
    })
    .sort({ priority: -1, createdAt: 1 });

export const createDriverOrderCacamba = async (
  orderId: string,
  driverId: string,
  body: Record<string, unknown>,
  file?: Express.Multer.File,
) => {
  const { numero, local, contentType } = body;
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId }).select('+cacambaPrice');
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }

  const normalizedNumero = String(numero ?? '');
  if (!/^\d{3}$/.test(normalizedNumero)) {
    return { status: 400, body: { message: 'Número da caçamba deve conter exatamente 3 dígitos.' } };
  }

  const exists = await CacambaModel.findOne({ orderId: order._id, numero: normalizedNumero });
  if (exists) {
    return { status: 400, body: { message: 'Número de caçamba já registrado neste pedido.' } };
  }

  const finalTipo: 'entrega' | 'retirada' = order.type === 'retirada' ? 'retirada' : 'entrega';
  const normalizedContentType = typeof contentType === 'string' ? contentType.trim() : '';

  if (finalTipo === 'retirada') {
    if (!normalizedContentType) {
      return { status: 400, body: { message: 'Tipo de conteúdo é obrigatório para retiradas.' } };
    }
    if (!isValidCacambaContentType(normalizedContentType)) {
      return { status: 400, body: { message: 'Tipo de conteúdo inválido para retirada.' } };
    }
  }

  const availability = await validateCacambaAvailability(normalizedNumero, {
    type: finalTipo,
    clientId: order.clientId,
    clientName: order.clientName,
    orderNumber: order.orderNumber,
  });
  if (!availability.valid) {
    return { status: 400, body: { message: availability.message } };
  }

  if (!file) {
    return { status: 400, body: { message: 'Imagem é obrigatória.' } };
  }

  const inheritedPrice =
    finalTipo === 'entrega'
      ? order.cacambaPrice
      : await findLatestDeliveryPriceForWithdrawal(normalizedNumero, order.clientId);

  const { buffer: outBuf, contentType: imageContentType, filename } = await compressImage(
    file.buffer,
    file.originalname,
    { maxWidth: 1280, maxHeight: 1280, quality: 75, format: 'webp' },
  );
  const fileId = await uploadBufferToGridFS(outBuf, filename, imageContentType);
  const imageUrl = `/files/${fileId.toString()}`;

  const cacamba = await CacambaModel.create({
    numero: normalizedNumero,
    tipo: finalTipo,
    ...(finalTipo === 'retirada' ? { contentType: normalizedContentType } : {}),
    ...(typeof inheritedPrice === 'number' && Number.isFinite(inheritedPrice) ? { price: inheritedPrice } : {}),
    local,
    orderId: order._id,
    imageUrl,
  });

  await OrderModel.findByIdAndUpdate(orderId, {
    $push: { cacambas: cacamba._id },
    updatedAt: Date.now(),
  });

  return {
    status: 201,
    body: { message: 'Caçamba registrada com sucesso!', cacamba: hideDriverCacambaPrice(cacamba) },
  };
};

export const getDriverOrderCacambas = async (orderId: string, driverId: string) => {
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId });
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }

  const cacambas = await CacambaModel.find({ orderId }).select('-price').sort({ createdAt: 1 });
  return { status: 200, body: cacambas };
};

export const getAvailableCacambasForWithdrawal = async (orderId: string, driverId: string) => {
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId }).select(
    'type clientId plannedWithdrawalCacambaIds',
  );
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }
  if (order.type !== 'retirada') {
    return { status: 400, body: { message: 'A lista de caçambas disponíveis só existe para pedidos de retirada.' } };
  }

  const cacambas = await listAvailableCacambasForClient(order.clientId, order.plannedWithdrawalCacambaIds || []);
  return { status: 200, body: { cacambas } };
};

export const completeDriverOrder = async (orderId: string, driverId: string, payload: CompleteOrderProofPayload = {}) => {
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId });
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }

  let deliveryProofValue: Record<string, unknown>;
  if (payload.reuseProof === true) {
    const reusableSource = await findReusableDeliveryProof(order, driverId);
    if (!reusableSource) {
      return {
        status: 428,
        body: { message: 'Novo comprovante necessário.', requiresProof: true },
      };
    }
    deliveryProofValue = buildReusedDeliveryProof(reusableSource);
  } else {
    const deliveryProof = await buildDeliveryProofUpdate(orderId, driverId, payload);
    if (!deliveryProof.ok) return { status: deliveryProof.status, body: deliveryProof.body };
    deliveryProofValue = { ...deliveryProof.value, isReused: false };
  }

  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderId,
    { status: 'concluido', updatedAt: Date.now(), deliveryProof: deliveryProofValue },
    { new: true },
  );
  emitOrdersUpdated();

  return {
    status: 200,
    body: { message: 'Pedido concluído com sucesso!', order: updatedOrder },
  };
};
