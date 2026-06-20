import type { ICacamba, IDriver, IOrder } from '../../interfaces';

export type CacambaAgeTone = 'low' | 'medium' | 'high' | 'unknown';

export type AcompanhamentoFilters = {
  numero: string;
  clientName: string;
  cnpjCpf: string;
  contact: string;
  phone: string;
  serviceOrder: string;
  serviceOrderDigital: string;
  address: string;
  neighborhood: string;
  city: string;
  cep: string;
};

export type AcompanhamentoItem = {
  numero: string;
  numeroValue: number;
  createdAtMs: number;
  order: IOrder;
  cacamba: ICacamba;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getLocalDayIndex = (date: Date) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);

const getTime = (value?: string | null) => {
  const time = new Date(value ?? 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

const norm = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const digits = (value: unknown) => norm(value).replace(/\D/g, '');

export const getDaysOnSite = (createdAt?: string | null) => {
  if (!createdAt) return null;

  const deliveredAt = new Date(createdAt);
  if (!Number.isFinite(deliveredAt.getTime())) return null;

  const days = getLocalDayIndex(new Date()) - getLocalDayIndex(deliveredAt);
  return Math.max(0, days);
};

export const formatDaysOnSite = (days: number | null) => {
  if (days === null) return 'Na obra: sem data';
  if (days === 0) return 'Na obra: Hoje';
  if (days === 1) return 'Na obra há 1 dia';
  return `Na obra há ${days} dias`;
};

export const getDaysOnSiteTone = (days: number | null): CacambaAgeTone => {
  if (days === null) return 'unknown';
  if (days >= 7) return 'high';
  if (days >= 3) return 'medium';
  return 'low';
};

export const formatOrderAddress = (order: IOrder) => {
  const street = [order.address, order.addressNumber].filter(Boolean).join(', ');
  const parts = [
    street,
    order.neighborhood,
    order.city,
    order.cep ? `CEP ${order.cep}` : '',
  ].filter(Boolean);

  return parts.join(' - ') || '-';
};

export const getOrderDriverId = (order: IOrder) => {
  const driver = order.motorista;
  if (typeof driver === 'string') return driver;
  return driver?._id ?? '';
};

export const getAcompanhamentoCacambas = (orders: IOrder[]) => {
  const latestByNumero = new Map<string, AcompanhamentoItem>();

  for (const order of orders) {
    for (const cacamba of order.cacambas ?? []) {
      const numeroKey = String(cacamba.numero ?? '').trim();
      if (!numeroKey) continue;

      const createdAtMs = getTime(cacamba.createdAt);
      const numeroParsed = Number.parseInt(numeroKey, 10);
      const numeroValue = Number.isFinite(numeroParsed) ? numeroParsed : Number.NEGATIVE_INFINITY;
      const incoming: AcompanhamentoItem = {
        numero: numeroKey,
        numeroValue,
        createdAtMs,
        order,
        cacamba,
      };

      const current = latestByNumero.get(numeroKey);
      if (!current) {
        latestByNumero.set(numeroKey, incoming);
        continue;
      }

      const shouldReplace =
        createdAtMs > current.createdAtMs ||
        (createdAtMs === current.createdAtMs &&
          incoming.cacamba.tipo === 'retirada' &&
          current.cacamba.tipo !== 'retirada');

      if (shouldReplace) latestByNumero.set(numeroKey, incoming);
    }
  }

  return [...latestByNumero.values()]
    .filter((item) => item.cacamba.tipo === 'entrega')
    .sort((a, b) => {
      if (a.createdAtMs !== b.createdAtMs) return b.createdAtMs - a.createdAtMs;

      const aNumeric = Number.isFinite(a.numeroValue);
      const bNumeric = Number.isFinite(b.numeroValue);
      if (aNumeric && bNumeric && a.numeroValue !== b.numeroValue) return b.numeroValue - a.numeroValue;
      if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
      return b.numero.localeCompare(a.numero, 'pt-BR', { numeric: true, sensitivity: 'base' });
    });
};

export const filterAcompanhamentoCacambas = (
  items: AcompanhamentoItem[],
  acompanhamentoFilters: AcompanhamentoFilters,
) => {
  const filters = {
    numero: norm(acompanhamentoFilters.numero).trim(),
    clientName: norm(acompanhamentoFilters.clientName).trim(),
    cnpjCpf: norm(acompanhamentoFilters.cnpjCpf).trim(),
    contact: norm(acompanhamentoFilters.contact).trim(),
    phone: norm(acompanhamentoFilters.phone).trim(),
    phoneDigits: digits(acompanhamentoFilters.phone),
    serviceOrder: norm(acompanhamentoFilters.serviceOrder).trim(),
    serviceOrderDigital: norm(acompanhamentoFilters.serviceOrderDigital).trim(),
    address: norm(acompanhamentoFilters.address).trim(),
    neighborhood: norm(acompanhamentoFilters.neighborhood).trim(),
    city: norm(acompanhamentoFilters.city).trim(),
    cep: norm(acompanhamentoFilters.cep).trim(),
  };

  if (!Object.values(filters).some(Boolean)) return items;

  return items.filter(({ numero, order, cacamba }) => {
    const numeroValue = norm(numero);
    const clientNameValue = norm(order.clientName);
    const cnpjCpfValue = norm(order.cnpjCpf);
    const contactValue = norm(order.contactName);
    const phoneValue = norm(order.contactNumber);
    const phoneDigitsValue = digits(order.contactNumber);
    const serviceOrderValue = norm(cacamba.horaServicoDigitos);
    const serviceOrderDigitalValue = norm(order.orderNumber);
    const addressValue = norm([order.address, order.addressNumber].filter(Boolean).join(' '));
    const neighborhoodValue = norm(order.neighborhood);
    const cityValue = norm(order.city);
    const cepValue = norm(order.cep);

    return (
      (!filters.numero || numeroValue.includes(filters.numero)) &&
      (!filters.clientName || clientNameValue.includes(filters.clientName)) &&
      (!filters.cnpjCpf || cnpjCpfValue.includes(filters.cnpjCpf)) &&
      (!filters.contact || contactValue.includes(filters.contact)) &&
      (!filters.phone ||
        phoneValue.includes(filters.phone) ||
        (Boolean(filters.phoneDigits) && phoneDigitsValue.includes(filters.phoneDigits))) &&
      (!filters.serviceOrder || serviceOrderValue.includes(filters.serviceOrder)) &&
      (!filters.serviceOrderDigital || serviceOrderDigitalValue.includes(filters.serviceOrderDigital)) &&
      (!filters.address || addressValue.includes(filters.address)) &&
      (!filters.neighborhood || neighborhoodValue.includes(filters.neighborhood)) &&
      (!filters.city || cityValue.includes(filters.city)) &&
      (!filters.cep || cepValue.includes(filters.cep))
    );
  });
};

export const getDriverOrders = (orders: IOrder[], selectedDriverId: string) =>
  orders.filter((order) => getOrderDriverId(order) === selectedDriverId);

export const getPendingOrders = (driverOrders: IOrder[]) =>
  [...driverOrders.filter((order) => order.status !== 'concluido')].sort((a, b) => {
    const aTime = getTime(a.createdAt);
    const bTime = getTime(b.createdAt);
    if (aTime !== bTime) return bTime - aTime;

    const aNumber = typeof a.orderNumber === 'number' ? a.orderNumber : -Infinity;
    const bNumber = typeof b.orderNumber === 'number' ? b.orderNumber : -Infinity;
    return bNumber - aNumber;
  });

export const getCompletedOrders = (driverOrders: IOrder[]) =>
  [...driverOrders.filter((order) => order.status === 'concluido')].sort((a, b) => {
    const aTime = getTime(a.updatedAt ?? a.createdAt);
    const bTime = getTime(b.updatedAt ?? b.createdAt);
    if (aTime !== bTime) return bTime - aTime;

    const aNumber = typeof a.orderNumber === 'number' ? a.orderNumber : -Infinity;
    const bNumber = typeof b.orderNumber === 'number' ? b.orderNumber : -Infinity;
    return bNumber - aNumber;
  });

export const getPendingCountByDriver = (drivers: IDriver[], orders: IOrder[]) => {
  const counts: Record<string, number> = {};
  for (const driver of drivers) counts[driver._id] = 0;

  for (const order of orders) {
    if (order.status === 'concluido') continue;
    const driverId = getOrderDriverId(order);
    if (driverId && counts[driverId] !== undefined) counts[driverId] += 1;
  }

  return counts;
};
