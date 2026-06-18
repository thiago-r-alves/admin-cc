import { Types } from 'mongoose';
import { CacambaModel } from '../../models/Cacamba';

type OrderForCacambaValidation = {
  type: 'entrega' | 'retirada';
  clientId: Types.ObjectId;
  clientName?: string;
  orderNumber?: number;
};

const formatHolder = (order: any) => {
  const clientName = String(order?.clientName || '').trim();
  const orderNumber = order?.orderNumber ? ` no pedido #${order.orderNumber}` : '';
  return clientName ? `${clientName}${orderNumber}` : `outro cliente${orderNumber}`;
};

export const validateCacambaAvailability = async (
  numero: string,
  order: OrderForCacambaValidation,
  options: { ignoreCacambaId?: unknown } = {},
) => {
  const normalizedNumero = String(numero || '').trim();
  if (!normalizedNumero) {
    return { valid: false, message: 'Número da caçamba é obrigatório.' };
  }

  const query: Record<string, unknown> = { numero: normalizedNumero };
  if (options.ignoreCacambaId) {
    query._id = { $ne: options.ignoreCacambaId };
  }

  const lastMovement = await CacambaModel.findOne(query)
    .sort({ createdAt: -1, _id: -1 })
    .populate('orderId', 'clientId clientName orderNumber')
    .lean();

  if (order.type === 'entrega') {
    if (lastMovement?.tipo === 'entrega') {
      const holderOrder = lastMovement.orderId;
      return {
        valid: false,
        message: `A caçamba ${normalizedNumero} já está entregue para ${formatHolder(holderOrder)}. Faça a retirada dessa caçamba antes de lançar uma nova entrega.`,
      };
    }
    return { valid: true, numero: normalizedNumero };
  }

  if (!lastMovement) {
    return {
      valid: false,
      message: `A caçamba ${normalizedNumero} não possui entrega registrada. Só é possível retirar uma caçamba que esteja entregue para este cliente.`,
    };
  }

  if (lastMovement.tipo !== 'entrega') {
    return {
      valid: false,
      message: `A caçamba ${normalizedNumero} já consta como retirada. Só é possível registrar retirada quando a última movimentação for uma entrega para este cliente.`,
    };
  }

  const holderOrder = lastMovement.orderId as any;
  if (String(holderOrder?.clientId || '') !== String(order.clientId || '')) {
    return {
      valid: false,
      message: `A caçamba ${normalizedNumero} está entregue para ${formatHolder(holderOrder)}. Este pedido é de outro cliente, por isso a retirada não pode ser registrada.`,
    };
  }

  return { valid: true, numero: normalizedNumero };
};

export const listAvailableCacambasForClient = async (clientId: Types.ObjectId) => {
  const movements = await CacambaModel.find()
    .sort({ createdAt: -1, _id: -1 })
    .populate('orderId', 'clientId clientName orderNumber')
    .select('numero tipo orderId createdAt')
    .lean();

  const latestByNumero = new Map<string, (typeof movements)[number]>();
  for (const movement of movements) {
    const numero = String(movement.numero || '').trim();
    if (numero && !latestByNumero.has(numero)) {
      latestByNumero.set(numero, movement);
    }
  }

  return Array.from(latestByNumero.values())
    .filter((movement) => {
      const order = movement.orderId as any;
      return movement.tipo === 'entrega' && String(order?.clientId || '') === String(clientId);
    })
    .map((movement) => {
      const order = movement.orderId as any;
      return {
        numero: String(movement.numero),
        deliveredAt: movement.createdAt,
        deliveryOrderNumber: order?.orderNumber ?? null,
      };
    })
    .sort((a, b) => a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true }));
};
