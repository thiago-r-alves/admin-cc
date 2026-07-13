import { CacambaModel } from '../../models/Cacamba';
import type { ClosureDateRange, ClosurePaymentFilter } from './helpers';

type ClosureOrderLike = Record<string, any>;
type ClosureCacambaLike = Record<string, any>;

type MovementContext = {
  latestMovementByNumero: Map<string, any>;
  deliveriesByClientAndNumero: Map<string, Array<{ cacamba: any; createdAtMs: number }>>;
};

const generatedPaymentStatuses = new Set(['nota_fiscal_pendente', 'pix_pendente', 'paga']);

const toPlainOrder = (order: any) =>
  typeof order?.toObject === 'function' ? order.toObject() : { ...(order || {}) };

const getOrderClientId = (order: ClosureOrderLike) => String(order?.clientId || '').trim();

const getCacambaNumero = (cacamba: ClosureCacambaLike) => String(cacamba?.numero || '').trim();

const getDeliveryKey = (clientId: string, numero: string) => `${clientId}:${numero}`;

const getTime = (value: unknown, fallback = 0) => {
  const time = new Date(value as any).getTime();
  return Number.isFinite(time) ? time : fallback;
};

export const getClosurePaymentStatus = (cacamba: ClosureCacambaLike) =>
  String(cacamba?.paymentStatus || 'pendente');

export const isPendingClosurePaymentStatus = (cacamba: ClosureCacambaLike) =>
  getClosurePaymentStatus(cacamba) === 'pendente';

export const hasValidClosurePrice = (cacamba: ClosureCacambaLike) => {
  const price = Number(cacamba?.price);
  return Number.isFinite(price) && price >= 0;
};

export const hasValidClosureContentType = (cacamba: ClosureCacambaLike) =>
  typeof cacamba?.contentType === 'string' && cacamba.contentType.trim().length > 0;

export const isClosureMetadataPending = (cacamba: ClosureCacambaLike) => {
  if (!isPendingClosurePaymentStatus(cacamba)) return false;
  if (!hasValidClosurePrice(cacamba)) return true;
  return cacamba?.tipo === 'retirada' && !hasValidClosureContentType(cacamba);
};

export const isReadyForClosureSelection = (cacamba: ClosureCacambaLike) => {
  if (!isPendingClosurePaymentStatus(cacamba)) return false;
  if (!hasValidClosurePrice(cacamba)) return false;
  if (cacamba?.tipo === 'retirada') return hasValidClosureContentType(cacamba);
  return cacamba?.tipo === 'entrega';
};

export const isCacambaWithinClosureDateRange = (
  cacamba: ClosureCacambaLike,
  range: ClosureDateRange | null,
) => {
  if (!range?.start && !range?.end) return true;
  const createdAtMs = getTime(cacamba?.createdAt, Number.NaN);
  if (!Number.isFinite(createdAtMs)) return false;
  if (range.start && createdAtMs < range.start.getTime()) return false;
  if (range.end && createdAtMs > range.end.getTime()) return false;
  return true;
};

const isGeneratedClosureStatus = (cacamba: ClosureCacambaLike) =>
  generatedPaymentStatuses.has(getClosurePaymentStatus(cacamba));

const buildMovementContext = async (orders: ClosureOrderLike[]): Promise<MovementContext> => {
  const numeros = new Set<string>();
  const withdrawalNumeros = new Set<string>();

  for (const order of orders) {
    for (const cacamba of order.cacambas || []) {
      const numero = getCacambaNumero(cacamba);
      if (!numero) continue;
      numeros.add(numero);
      if (cacamba?.tipo === 'retirada') withdrawalNumeros.add(numero);
    }
  }

  const latestMovementByNumero = new Map<string, any>();
  if (numeros.size > 0) {
    const latestMovements = await CacambaModel.find({ numero: { $in: Array.from(numeros) } })
      .select('_id numero tipo paymentStatus closureGroupId createdAt orderId')
      .sort({ numero: 1, createdAt: -1, _id: -1 })
      .lean();

    for (const movement of latestMovements as any[]) {
      const numero = getCacambaNumero(movement);
      if (numero && !latestMovementByNumero.has(numero)) {
        latestMovementByNumero.set(numero, movement);
      }
    }
  }

  const deliveriesByClientAndNumero = new Map<string, Array<{ cacamba: any; createdAtMs: number }>>();
  if (withdrawalNumeros.size > 0) {
    const deliveries = await CacambaModel.find({
      numero: { $in: Array.from(withdrawalNumeros) },
      tipo: 'entrega',
    })
      .populate('orderId', 'clientId')
      .select('_id numero tipo paymentStatus closureGroupId createdAt orderId')
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    for (const delivery of deliveries as any[]) {
      const numero = getCacambaNumero(delivery);
      const clientId = String(delivery?.orderId?.clientId || '').trim();
      if (!numero || !clientId) continue;

      const key = getDeliveryKey(clientId, numero);
      deliveriesByClientAndNumero.set(key, [
        ...(deliveriesByClientAndNumero.get(key) || []),
        {
          cacamba: delivery,
          createdAtMs: getTime(delivery.createdAt),
        },
      ]);
    }

    for (const deliveriesForCacamba of deliveriesByClientAndNumero.values()) {
      deliveriesForCacamba.sort((a, b) => b.createdAtMs - a.createdAtMs);
    }
  }

  return { latestMovementByNumero, deliveriesByClientAndNumero };
};

const hasPrepaidDeliveryForWithdrawal = (
  order: ClosureOrderLike,
  cacamba: ClosureCacambaLike,
  context: MovementContext,
) => {
  const numero = getCacambaNumero(cacamba);
  const clientId = getOrderClientId(order);
  if (!numero || !clientId) return false;

  const withdrawalAtMs = getTime(cacamba?.createdAt, Number.MAX_SAFE_INTEGER);
  const deliveries = context.deliveriesByClientAndNumero.get(getDeliveryKey(clientId, numero)) || [];
  const previousDelivery = deliveries.find((delivery) => delivery.createdAtMs <= withdrawalAtMs);
  return Boolean(previousDelivery && isGeneratedClosureStatus(previousDelivery.cacamba));
};

const isOpenDelivery = (cacamba: ClosureCacambaLike, context: MovementContext) => {
  const latest = context.latestMovementByNumero.get(getCacambaNumero(cacamba));
  return latest?.tipo === 'entrega' && String(latest?._id || '') === String(cacamba?._id || '');
};

const isClosureCandidate = (
  order: ClosureOrderLike,
  cacamba: ClosureCacambaLike,
  context: MovementContext,
) => {
  if (cacamba?.tipo === 'entrega') {
    return isPendingClosurePaymentStatus(cacamba)
      ? isOpenDelivery(cacamba, context)
      : isGeneratedClosureStatus(cacamba);
  }

  if (cacamba?.tipo === 'retirada') {
    if (
      isPendingClosurePaymentStatus(cacamba) &&
      hasPrepaidDeliveryForWithdrawal(order, cacamba, context)
    ) {
      return false;
    }
    return true;
  }

  return false;
};

export const matchesClosurePaymentFilter = (
  cacamba: ClosureCacambaLike,
  paymentFilter: ClosurePaymentFilter = 'all',
) => {
  if (paymentFilter === 'pending') return isPendingClosurePaymentStatus(cacamba);
  if (paymentFilter === 'metadata_pending') return isClosureMetadataPending(cacamba);
  if (paymentFilter === 'invoice_pending') {
    return getClosurePaymentStatus(cacamba) === 'nota_fiscal_pendente';
  }
  if (paymentFilter === 'pix_pending') return getClosurePaymentStatus(cacamba) === 'pix_pendente';
  if (paymentFilter === 'paid') return getClosurePaymentStatus(cacamba) === 'paga';
  return true;
};

export const filterOrdersForClosureCandidates = async (
  ordersInput: any[],
  options: {
    paymentFilter?: ClosurePaymentFilter;
    metadataDateRange?: ClosureDateRange | null;
  } = {},
) => {
  const orders = ordersInput.map(toPlainOrder);
  const context = await buildMovementContext(orders);
  const paymentFilter = options.paymentFilter || 'all';
  const metadataDateRange = options.metadataDateRange || null;

  return orders
    .map((order) => {
      const cacambas = (order.cacambas || []).filter((cacamba: ClosureCacambaLike) => {
        if (!isClosureCandidate(order, cacamba, context)) return false;
        if (
          metadataDateRange &&
          isClosureMetadataPending(cacamba) &&
          !isCacambaWithinClosureDateRange(cacamba, metadataDateRange)
        ) {
          return false;
        }
        return matchesClosurePaymentFilter(cacamba, paymentFilter);
      });
      return { ...order, cacambas };
    })
    .filter((order) => (order.cacambas || []).length > 0);
};

export const summarizeClosureCacambas = (cacambas: ClosureCacambaLike[]) => {
  const pending = cacambas.filter(isPendingClosurePaymentStatus);
  const metadataPending = cacambas.filter(isClosureMetadataPending);

  return {
    pendingClosureCount: pending.length,
    invoicePendingClosureCount: cacambas.filter(
      (cacamba) => getClosurePaymentStatus(cacamba) === 'nota_fiscal_pendente',
    ).length,
    pixPendingClosureCount: cacambas.filter(
      (cacamba) => getClosurePaymentStatus(cacamba) === 'pix_pendente',
    ).length,
    paidClosureCount: cacambas.filter((cacamba) => getClosurePaymentStatus(cacamba) === 'paga').length,
    pendingClosureMetadataCount: metadataPending.length,
    pendingClosureMissingPriceCount: metadataPending.filter((cacamba) => !hasValidClosurePrice(cacamba)).length,
    pendingClosureMissingContentTypeCount: metadataPending.filter(
      (cacamba) => cacamba?.tipo === 'retirada' && !hasValidClosureContentType(cacamba),
    ).length,
  };
};
