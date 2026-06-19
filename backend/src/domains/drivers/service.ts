import { CacambaModel } from '../../models/Cacamba';
import { OrderModel } from '../../models/Order';
import { IUser, UserModel } from '../../models/User';
import { uploadBufferToGridFS } from '../../gridfs';
import { compressImage } from '../../utils/image';
import { emitOrdersUpdated } from '../../shared/realtime';
import { isValidCacambaContentType } from '../cacambas/helpers';
import { listAvailableCacambasForClient, validateCacambaAvailability } from '../cacambas/availability';

const hideDriverCacambaPrice = (cacamba: any) => {
  const plain = typeof cacamba?.toObject === 'function' ? cacamba.toObject() : { ...(cacamba || {}) };
  delete plain.price;
  return plain;
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
  const { numero, local, horaServicoDigitos, contentType } = body;
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId }).select('+cacambaPrice');
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }

  const normalizedNumero = String(numero ?? '');
  if (!/^\d{3}$/.test(normalizedNumero)) {
    return { status: 400, body: { message: 'Número da caçamba deve conter exatamente 3 dígitos.' } };
  }

  if (!horaServicoDigitos || !/^\d{3}$/.test(String(horaServicoDigitos))) {
    return { status: 400, body: { message: 'Ordem de serviço deve conter exatamente 3 dígitos.' } };
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
    ...(finalTipo === 'retirada' && typeof order.cacambaPrice === 'number' ? { price: order.cacambaPrice } : {}),
    local,
    horaServicoDigitos,
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
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId }).select('type clientId');
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }
  if (order.type !== 'retirada') {
    return { status: 400, body: { message: 'A lista de caçambas disponíveis só existe para pedidos de retirada.' } };
  }

  const cacambas = await listAvailableCacambasForClient(order.clientId);
  return { status: 200, body: { cacambas } };
};

export const completeDriverOrder = async (orderId: string, driverId: string) => {
  const order = await OrderModel.findOne({ _id: orderId, motorista: driverId });
  if (!order) {
    return { status: 404, body: { message: 'Pedido não encontrado ou não pertence a este motorista.' } };
  }

  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderId,
    { status: 'concluido', updatedAt: Date.now() },
    { new: true },
  );
  emitOrdersUpdated();

  return {
    status: 200,
    body: { message: 'Pedido concluído com sucesso!', order: updatedOrder },
  };
};
