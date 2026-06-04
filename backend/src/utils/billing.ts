import type { ICacamba } from '../models/Cacamba';

export type BillingPaymentFilter = 'all' | 'pending' | 'invoice_pending' | 'paid';
export type BillingGranularity = 'monthly' | 'semiannual' | 'annual';

export type BillingRow = {
  clientId: string;
  clientName: string;
  city: string;
  updatedAt: Date;
  paymentStatus: ICacamba['paymentStatus'];
  contentType: string;
  price: number;
};

export type BillingSummaryResponse = {
  summary: {
    totalRevenue: number;
    totalCacambas: number;
    averageTicket: number;
    activeClients: number;
    paidRevenue: number;
    pendingRevenue: number;
    invoicePendingRevenue: number;
    previousPeriodRevenue: number;
    revenueDeltaPercent: number;
  };
  timeseries: Array<{
    label: string;
    start: string;
    end: string;
    revenue: number;
    count: number;
  }>;
  paymentBreakdown: Array<{
    status: 'pendente' | 'nota_fiscal_pendente' | 'paga';
    label: string;
    revenue: number;
    count: number;
  }>;
  topClients: Array<{
    clientId: string;
    clientName: string;
    revenue: number;
    cacambaCount: number;
    averageTicket: number;
  }>;
  topCities: Array<{
    city: string;
    revenue: number;
    cacambaCount: number;
  }>;
  topContentTypes: Array<{
    contentType: string;
    revenue: number;
    cacambaCount: number;
  }>;
  highlights: {
    topClientName: string;
    topClientRevenue: number;
    bestBucketLabel: string;
    bestBucketRevenue: number;
  };
};

export const parseBillingGranularity = (value: unknown): BillingGranularity => {
  if (value === 'semiannual') return 'semiannual';
  if (value === 'annual') return 'annual';
  return 'monthly';
};

const currencyStatuses: Array<{ status: 'pendente' | 'nota_fiscal_pendente' | 'paga'; label: string }> = [
  { status: 'pendente', label: 'Pendente' },
  { status: 'nota_fiscal_pendente', label: 'NF pendente' },
  { status: 'paga', label: 'Pago' },
];

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

export const buildPreviousPeriodRange = (start: Date, end: Date) => {
  const duration = end.getTime() - start.getTime() + 1;
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration + 1);
  return { start: previousStart, end: previousEnd };
};

type Bucket = {
  label: string;
  start: Date;
  end: Date;
};

const buildMonthlyBuckets = (start: Date, end: Date) => {
  const buckets: Bucket[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);

  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({
      label: monthFormatter.format(bucketStart).replace('.', ''),
      start: bucketStart,
      end: bucketEnd,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  return buckets;
};

const buildSemiannualBuckets = (start: Date, end: Date) => {
  const buckets: Bucket[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth() < 6 ? 0 : 6, 1, 0, 0, 0, 0);

  while (cursor <= end) {
    const isFirstSemester = cursor.getMonth() < 6;
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getFullYear(), isFirstSemester ? 5 : 11, isFirstSemester ? 30 : 31, 23, 59, 59, 999);
    buckets.push({
      label: `${isFirstSemester ? '1o' : '2o'} sem/${cursor.getFullYear()}`,
      start: bucketStart,
      end: bucketEnd,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 6, 1, 0, 0, 0, 0);
  }

  return buckets;
};

const buildAnnualBuckets = (start: Date, end: Date) => {
  const buckets: Bucket[] = [];
  let cursor = new Date(start.getFullYear(), 0, 1, 0, 0, 0, 0);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    buckets.push({
      label: String(year),
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    });
    cursor = new Date(year + 1, 0, 1, 0, 0, 0, 0);
  }

  return buckets;
};

export const buildBuckets = (start: Date, end: Date, granularity: BillingGranularity) => {
  if (granularity === 'semiannual') return buildSemiannualBuckets(start, end);
  if (granularity === 'annual') return buildAnnualBuckets(start, end);
  return buildMonthlyBuckets(start, end);
};

const roundCurrency = (value: number) => Number(value.toFixed(2));

const matchesPaymentFilter = (status: ICacamba['paymentStatus'], filter: BillingPaymentFilter) => {
  if (filter === 'pending') return status === 'pendente';
  if (filter === 'invoice_pending') return status === 'nota_fiscal_pendente';
  if (filter === 'paid') return status === 'paga';
  return true;
};

const sumRevenue = (rows: BillingRow[]) => rows.reduce((sum, row) => sum + row.price, 0);

export const extractBillingRows = (
  orders: Array<{
    clientId?: unknown;
    clientName?: string;
    city?: string;
    updatedAt?: Date | string;
    cacambas?: Array<Partial<ICacamba> & { _id?: unknown }>;
  }>,
  filters: {
    paymentStatus: BillingPaymentFilter;
    contentType?: string;
  },
) => {
  const normalizedContentType = String(filters.contentType || '').trim();

  return orders.flatMap((order) => {
    const updatedAt = order.updatedAt ? new Date(order.updatedAt) : null;
    if (!updatedAt || Number.isNaN(updatedAt.getTime())) return [];

    return (order.cacambas || [])
      .filter((cacamba) => cacamba.tipo === 'retirada')
      .filter((cacamba) => typeof cacamba.price === 'number' && Number.isFinite(cacamba.price) && cacamba.price > 0)
      .map((cacamba) => ({
        clientId: String(order.clientId || ''),
        clientName: String(order.clientName || 'Cliente sem nome'),
        city: String(order.city || 'Sem cidade'),
        updatedAt,
        paymentStatus: (cacamba.paymentStatus || 'pendente') as ICacamba['paymentStatus'],
        contentType: String(cacamba.contentType || 'Sem tipo'),
        price: Number(cacamba.price || 0),
      }))
      .filter((row) => matchesPaymentFilter(row.paymentStatus, filters.paymentStatus))
      .filter((row) => !normalizedContentType || row.contentType === normalizedContentType);
  });
};

const groupTopItems = <TKey extends string>(
  rows: BillingRow[],
  getKey: (row: BillingRow) => TKey,
  getLabel: (key: TKey) => string,
) => {
  const grouped = new Map<TKey, { revenue: number; cacambaCount: number }>();

  rows.forEach((row) => {
    const key = getKey(row);
    const current = grouped.get(key) || { revenue: 0, cacambaCount: 0 };
    current.revenue += row.price;
    current.cacambaCount += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      key,
      label: getLabel(key),
      revenue: roundCurrency(value.revenue),
      cacambaCount: value.cacambaCount,
      averageTicket: value.cacambaCount ? roundCurrency(value.revenue / value.cacambaCount) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.cacambaCount - a.cacambaCount || a.label.localeCompare(b.label, 'pt-BR'));
};

export const buildBillingSummary = (
  currentRows: BillingRow[],
  previousRows: BillingRow[],
  start: Date,
  end: Date,
  granularity: BillingGranularity,
): BillingSummaryResponse => {
  const totalRevenueRaw = sumRevenue(currentRows);
  const previousPeriodRevenueRaw = sumRevenue(previousRows);
  const totalCacambas = currentRows.length;
  const activeClients = new Set(currentRows.map((row) => row.clientId)).size;
  const paidRevenue = sumRevenue(currentRows.filter((row) => row.paymentStatus === 'paga'));
  const pendingRevenue = sumRevenue(currentRows.filter((row) => row.paymentStatus === 'pendente'));
  const invoicePendingRevenue = sumRevenue(currentRows.filter((row) => row.paymentStatus === 'nota_fiscal_pendente'));
  const averageTicket = totalCacambas ? totalRevenueRaw / totalCacambas : 0;
  const revenueDeltaPercent =
    previousPeriodRevenueRaw === 0
      ? (totalRevenueRaw > 0 ? 100 : 0)
      : ((totalRevenueRaw - previousPeriodRevenueRaw) / previousPeriodRevenueRaw) * 100;

  const buckets = buildBuckets(start, end, granularity);
  const timeseries = buckets.map((bucket) => {
    const bucketRows = currentRows.filter(
      (row) => row.updatedAt.getTime() >= bucket.start.getTime() && row.updatedAt.getTime() <= bucket.end.getTime(),
    );
    return {
      label: bucket.label,
      start: startOfDay(bucket.start).toISOString(),
      end: endOfDay(bucket.end).toISOString(),
      revenue: roundCurrency(sumRevenue(bucketRows)),
      count: bucketRows.length,
    };
  });

  const paymentBreakdown = currencyStatuses.map(({ status, label }) => {
    const statusRows = currentRows.filter((row) => row.paymentStatus === status);
    return {
      status,
      label,
      revenue: roundCurrency(sumRevenue(statusRows)),
      count: statusRows.length,
    };
  });

  const clientRanking = groupTopItems(
    currentRows,
    (row) => row.clientId || row.clientName,
    () => '',
  ).map((item) => ({
    clientId: item.key,
    clientName: currentRows.find((row) => (row.clientId || row.clientName) === item.key)?.clientName || 'Cliente sem nome',
    revenue: item.revenue,
    cacambaCount: item.cacambaCount,
    averageTicket: item.averageTicket,
  }));

  const topCities = groupTopItems(
    currentRows,
    (row) => row.city || 'Sem cidade',
    (key) => key,
  ).map((item) => ({
    city: item.label,
    revenue: item.revenue,
    cacambaCount: item.cacambaCount,
  }));

  const topContentTypes = groupTopItems(
    currentRows,
    (row) => row.contentType || 'Sem tipo',
    (key) => key,
  ).map((item) => ({
    contentType: item.label,
    revenue: item.revenue,
    cacambaCount: item.cacambaCount,
  }));

  const bestBucket = timeseries.reduce(
    (best, item) => (item.revenue > best.revenue ? item : best),
    { label: '', start: '', end: '', revenue: 0, count: 0 },
  );

  const topClient = clientRanking[0];

  return {
    summary: {
      totalRevenue: roundCurrency(totalRevenueRaw),
      totalCacambas,
      averageTicket: roundCurrency(averageTicket),
      activeClients,
      paidRevenue: roundCurrency(paidRevenue),
      pendingRevenue: roundCurrency(pendingRevenue),
      invoicePendingRevenue: roundCurrency(invoicePendingRevenue),
      previousPeriodRevenue: roundCurrency(previousPeriodRevenueRaw),
      revenueDeltaPercent: roundCurrency(revenueDeltaPercent),
    },
    timeseries,
    paymentBreakdown,
    topClients: clientRanking,
    topCities,
    topContentTypes,
    highlights: {
      topClientName: topClient?.clientName || '',
      topClientRevenue: topClient?.revenue || 0,
      bestBucketLabel: bestBucket.label,
      bestBucketRevenue: bestBucket.revenue,
    },
  };
};
