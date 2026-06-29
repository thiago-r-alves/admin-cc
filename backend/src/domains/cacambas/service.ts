import { ObjectId } from 'mongodb';
import { CacambaModel } from '../../models/Cacamba';
import { OrderModel } from '../../models/Order';
import { getBucket, uploadBufferToGridFS } from '../../gridfs';
import { emitOrdersUpdated } from '../../shared/realtime';
import { compressImage, extractGridFsIdFromUrl } from '../../utils/image';
import { isValidCacambaContentType, isValidCacambaLocal } from './helpers';
import { validateCacambaAvailability } from './availability';

const hideDriverCacambaPrice = (cacamba: any) => {
  const plain = typeof cacamba?.toObject === 'function' ? cacamba.toObject() : { ...(cacamba || {}) };
  delete plain.price;
  return plain;
};

export const updateCacamba = async (
  id: string,
  userData: { userId: string; role: 'admin' | 'motorista' } | undefined,
  body: Record<string, unknown>,
  file?: Express.Multer.File,
) => {
  if (!userData) {
    return { status: 401, body: { message: 'Usuário não autenticado.' } };
  }

  const existing = await CacambaModel.findById(id);
  if (!existing) return { status: 404, body: { message: 'Caçamba não encontrada' } };

  const order = await OrderModel.findById(existing.orderId).select('motorista type status clientId clientName orderNumber');
  if (!order) return { status: 404, body: { message: 'Pedido da caçamba não encontrado.' } };

  const isAdminUser = userData.role === 'admin';
  const isDriverOwner =
    userData.role === 'motorista' && String(order.motorista || '') === String(userData.userId || '');

  if (!isAdminUser && !isDriverOwner) {
    return { status: 403, body: { message: 'Sem permissão para editar esta caçamba.' } };
  }

  const { numero, tipo, local, horaServicoDigitos, contentType, price } = body;
  const updates: Record<string, unknown> = {};
  const orderType: 'entrega' | 'retirada' = order.type === 'retirada' ? 'retirada' : 'entrega';

  if (numero !== undefined) {
    const normalizedNumero = String(numero).trim();
    if (!normalizedNumero) {
      return { status: 400, body: { message: 'Número da caçamba é obrigatório.' } };
    }

    const duplicate = await CacambaModel.exists({
      _id: { $ne: existing._id },
      orderId: existing.orderId,
      numero: normalizedNumero,
    });
    if (duplicate) {
      return { status: 400, body: { message: 'Número de caçamba já registrado neste pedido.' } };
    }

    if (normalizedNumero !== existing.numero) {
      const availability = await validateCacambaAvailability(
        normalizedNumero,
        {
          type: orderType,
          clientId: order.clientId,
          clientName: order.clientName,
          orderNumber: order.orderNumber,
        },
        { ignoreCacambaId: existing._id },
      );
      if (!availability.valid) {
        return { status: 400, body: { message: availability.message } };
      }
    }

    updates.numero = normalizedNumero;
  }

  if (tipo !== undefined && tipo !== orderType) {
    return { status: 400, body: { message: 'Tipo da caçamba deve acompanhar o tipo do pedido.' } };
  }
  if (existing.tipo !== orderType || tipo !== undefined) {
    updates.tipo = orderType;
  }

  if (local !== undefined) {
    if (!isValidCacambaLocal(local)) {
      return { status: 400, body: { message: 'Local da caçamba inválido.' } };
    }
    updates.local = local;
  }

  if (horaServicoDigitos !== undefined) {
    const digits = String(horaServicoDigitos).trim();
    if (!/^\d{3}$/.test(digits)) {
      return { status: 400, body: { message: 'Ordem de serviço deve conter exatamente 3 dígitos.' } };
    }
    updates.horaServicoDigitos = digits;
  }

  if (contentType !== undefined) {
    const normalizedContentType = String(contentType).trim();
    if (orderType === 'retirada') {
      if (!normalizedContentType) {
        return { status: 400, body: { message: 'Tipo de conteúdo é obrigatório para retirada.' } };
      }
      if (!isValidCacambaContentType(normalizedContentType)) {
        return { status: 400, body: { message: 'Tipo de conteúdo inválido para retirada.' } };
      }
      updates.contentType = normalizedContentType;
    }
  }

  if (orderType === 'retirada' && contentType === undefined) {
    const existingContentType = String(existing.contentType || '').trim();
    if (!existingContentType) {
      return { status: 400, body: { message: 'Tipo de conteúdo é obrigatório para retirada.' } };
    }
  }

  if (price !== undefined) {
    if (!isAdminUser) {
      return { status: 403, body: { message: 'Somente admin pode atualizar valor da caçamba.' } };
    }
    if (order.status !== 'concluido') {
      return {
        status: 400,
        body: { message: 'Valor por caçamba só pode ser definido em pedido concluído.' },
      };
    }
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return { status: 400, body: { message: 'Valor da caçamba inválido.' } };
    }
    updates.price = parsedPrice;
  }

  if (file) {
    const { buffer: outBuf, contentType: imageContentType, filename } = await compressImage(
      file.buffer,
      file.originalname,
      { maxWidth: 1280, maxHeight: 1280, quality: 75, format: 'webp' },
    );
    const fileId = await uploadBufferToGridFS(outBuf, filename, imageContentType);
    updates.imageUrl = `/files/${fileId.toString()}`;

    const oldId = extractGridFsIdFromUrl(existing.imageUrl);
    if (oldId) {
      try {
        await getBucket().delete(new ObjectId(oldId));
      } catch {}
    }
  }

  const cacamba = await CacambaModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!cacamba) return { status: 404, body: { message: 'Caçamba não encontrada' } };

  emitOrdersUpdated();
  return {
    status: 200,
    body: { cacamba: isAdminUser ? cacamba : hideDriverCacambaPrice(cacamba) },
  };
};

export const deleteCacamba = async (id: string) => {
  const cacamba = await CacambaModel.findByIdAndDelete(id);
  if (!cacamba) return { status: 404, body: { message: 'Caçamba não encontrada' } };

  const oldId = extractGridFsIdFromUrl(cacamba.imageUrl);
  if (oldId) {
    try {
      await getBucket().delete(new ObjectId(oldId));
    } catch {}
  }

  return { status: 200, body: { message: 'Caçamba excluída.' } };
};
