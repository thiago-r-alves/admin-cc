import { OrderModel } from '../../models/Order';
import { buildClientIdMatch } from '../closures/helpers';

const isObjectIdLike = (value: unknown) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const normalizeValue = (value: unknown) => String(value || '').trim();

const getDriverName = (motorista: unknown) => {
  if (!motorista) return '';
  if (typeof motorista === 'object' && 'username' in motorista) {
    return String((motorista as { username?: string }).username || '');
  }
  const value = normalizeValue(motorista);
  return isObjectIdLike(value) ? '' : value;
};

const buildActionMetadata = (order: any, cacamba: any) => ({
  date: cacamba?.createdAt || '',
  driverName: getDriverName(order?.motorista),
  placa: normalizeValue(order?.placa).toUpperCase(),
  orderNumber: order?.orderNumber ?? null,
});

const buildLookupKey = (clientId: unknown, numero: unknown) => {
  const normalizedClientId = normalizeValue(clientId);
  const normalizedNumero = normalizeValue(numero);
  if (!normalizedClientId || !normalizedNumero) return '';
  return `${normalizedClientId}::${normalizedNumero}`;
};

export const enrichOrdersWithLinkedDeliveryMetadata = async (ordersInput: any[]) => {
  const orders = ordersInput.map((order) =>
    typeof order?.toObject === 'function' ? order.toObject() : order,
  );

  const withdrawalItems: Array<{ order: any; cacamba: any }> = [];
  const numeros = new Set<string>();
  const clientIds = new Set<string>();

  for (const order of orders) {
    for (const cacamba of order.cacambas || []) {
      if (cacamba?.tipo !== 'retirada') continue;
      withdrawalItems.push({ order, cacamba });

      const numero = normalizeValue(cacamba?.numero);
      const clientId = normalizeValue(order?.clientId);
      if (numero) numeros.add(numero);
      if (clientId) clientIds.add(clientId);
    }
  }

  if (!withdrawalItems.length) return orders;

  for (const { order, cacamba } of withdrawalItems) {
    cacamba.closureWithdrawal = buildActionMetadata(order, cacamba);
    cacamba.closureDelivery = null;
  }

  if (!numeros.size || !clientIds.size) return orders;

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
    for (const cacamba of order.cacambas || []) {
      const key = buildLookupKey(order.clientId, cacamba?.numero);
      if (!key) continue;

      const createdAtMs = new Date(cacamba.createdAt || 0).getTime();
      const deliveryItem = {
        order,
        cacamba,
        createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
      };

      deliveriesByKey.set(key, [...(deliveriesByKey.get(key) || []), deliveryItem]);
    }
  }

  for (const deliveries of deliveriesByKey.values()) {
    deliveries.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }

  for (const { order, cacamba } of withdrawalItems) {
    const key = buildLookupKey(order?.clientId, cacamba?.numero);
    if (!key) continue;

    const withdrawalAtMs = new Date(cacamba.createdAt || 0).getTime();
    const safeWithdrawalAtMs = Number.isFinite(withdrawalAtMs)
      ? withdrawalAtMs
      : Number.MAX_SAFE_INTEGER;
    const delivery = (deliveriesByKey.get(key) || []).find(
      (item) => item.createdAtMs <= safeWithdrawalAtMs,
    );

    cacamba.closureDelivery = delivery ? buildActionMetadata(delivery.order, delivery.cacamba) : null;
  }

  return orders;
};
