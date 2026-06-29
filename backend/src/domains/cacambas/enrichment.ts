import { ObjectId } from 'mongodb';
import { OrderModel } from '../../models/Order';

const isObjectIdLike = (value: unknown) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const getDriverName = (motorista: unknown) => {
  if (!motorista) return '';
  if (typeof motorista === 'object' && 'username' in motorista) {
    return String((motorista as { username?: string }).username || '');
  }
  const value = String(motorista || '');
  return isObjectIdLike(value) ? '' : value;
};

const buildActionMetadata = (order: any, cacamba: any) => ({
  date: cacamba?.createdAt || '',
  driverName: getDriverName(order?.motorista),
  placa: String(order?.placa || '').toUpperCase(),
  orderNumber: order?.orderNumber ?? null,
});

const buildClientIdMatch = (id: string) => {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [{ clientId: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    return [{ clientId: trimmed }, { clientId: new ObjectId(trimmed) }];
  }
  return [{ clientId: trimmed }];
};

const getClientId = (order: any, fallbackClientId?: string) =>
  String(fallbackClientId || order?.clientId || '').trim();

const getDeliveryKey = (clientId: string, numero: string) => `${clientId}:${numero}`;

export const enrichWithdrawalCacambasWithDeliveryMetadata = async (
  ordersInput: any[],
  options: { clientId?: string } = {},
) => {
  const orders = ordersInput.map((order) => (typeof order?.toObject === 'function' ? order.toObject() : order));
  const withdrawalItems: Array<{ order: any; cacamba: any; clientId: string }> = [];
  const clientIds = new Set<string>();
  const numeros = new Set<string>();

  for (const order of orders) {
    const clientId = getClientId(order, options.clientId);
    if (!clientId) continue;

    for (const cacamba of order.cacambas || []) {
      const numero = String(cacamba?.numero || '').trim();
      if (!numero) continue;

      if (cacamba?.tipo === 'entrega') {
        cacamba.closureDelivery = buildActionMetadata(order, cacamba);
        cacamba.closureWithdrawal = cacamba.closureWithdrawal || null;
        continue;
      }

      if (cacamba?.tipo !== 'retirada') continue;

      withdrawalItems.push({ order, cacamba, clientId });
      clientIds.add(clientId);
      numeros.add(numero);
    }
  }

  if (!withdrawalItems.length) return orders;

  const deliveryOrders = await OrderModel.find({
    $or: Array.from(clientIds).flatMap((clientId) => buildClientIdMatch(clientId)),
    status: 'concluido',
    type: 'entrega',
  })
    .populate({
      path: 'motorista',
      select: 'username',
    })
    .populate({
      path: 'cacambas',
      match: { tipo: 'entrega', numero: { $in: Array.from(numeros) } },
      select: 'numero tipo paymentStatus contentType price imageUrl createdAt local horaServicoDigitos',
    })
    .lean();

  const deliveriesByKey = new Map<string, Array<{ order: any; cacamba: any; createdAtMs: number }>>();
  for (const order of deliveryOrders as any[]) {
    const clientId = getClientId(order);
    if (!clientId) continue;

    for (const cacamba of order.cacambas || []) {
      const numero = String(cacamba?.numero || '').trim();
      if (!numero) continue;

      const createdAtMs = new Date(cacamba.createdAt || 0).getTime();
      const item = {
        order,
        cacamba,
        createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
      };
      const key = getDeliveryKey(clientId, numero);
      deliveriesByKey.set(key, [...(deliveriesByKey.get(key) || []), item]);
    }
  }

  for (const deliveries of deliveriesByKey.values()) {
    deliveries.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }

  for (const { order, cacamba, clientId } of withdrawalItems) {
    const numero = String(cacamba.numero || '').trim();
    const withdrawalAtMs = new Date(cacamba.createdAt || 0).getTime();
    const safeWithdrawalAtMs = Number.isFinite(withdrawalAtMs) ? withdrawalAtMs : Number.MAX_SAFE_INTEGER;
    const delivery = (deliveriesByKey.get(getDeliveryKey(clientId, numero)) || []).find(
      (item) => item.createdAtMs <= safeWithdrawalAtMs,
    );

    cacamba.closureWithdrawal = buildActionMetadata(order, cacamba);
    cacamba.closureDelivery = delivery ? buildActionMetadata(delivery.order, delivery.cacamba) : null;
  }

  return orders;
};
