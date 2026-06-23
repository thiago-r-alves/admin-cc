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

export type AcompanhamentoSortMode = 'default' | 'clientName';
export type PendingWithdrawalSortMode = 'overdueDesc' | 'overdueAsc' | 'clientName';

export type WithdrawalDueItem = AcompanhamentoItem & {
  businessDaysOnSite: number;
  dueDate: string;
  plannedWithdrawal?: {
    orderId: string;
    orderNumber: number | null;
    status: IOrder['status'];
  };
};

export type WithdrawalAddressGroup = {
  key: string;
  order: IOrder;
  items: WithdrawalDueItem[];
  cacambaIds: string[];
  availableCacambaIds: string[];
  address: string;
  oldestCreatedAtMs: number;
  maxBusinessDaysOnSite: number;
};

export type WithdrawalClientGroup = {
  key: string;
  clientId?: string;
  clientName: string;
  cnpjCpf?: string;
  groups: WithdrawalAddressGroup[];
  totalCacambas: number;
};

const comparePtBr = (a: string, b: string) =>
  a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });

const compareWithdrawalClientGroupsByName = (
  a: WithdrawalClientGroup,
  b: WithdrawalClientGroup,
) => {
  const nameComparison = comparePtBr(a.clientName, b.clientName);
  if (nameComparison !== 0) return nameComparison;
  return comparePtBr(a.key, b.key);
};

const getWithdrawalClientMaxBusinessDays = (group: WithdrawalClientGroup) =>
  Math.max(0, ...group.groups.map((addressGroup) => addressGroup.maxBusinessDaysOnSite));

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

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getSaoPauloDateParts = (date: Date) => {
  const parts = saoPauloDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
};

const dateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const getDayIndexFromParts = ({ year, month, day }: { year: number; month: number; day: number }) =>
  Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);

const getPartsFromDayIndex = (dayIndex: number) => {
  const date = new Date(dayIndex * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

const addDaysToParts = (
  parts: { year: number; month: number; day: number },
  amount: number,
) => getPartsFromDayIndex(getDayIndexFromParts(parts) + amount);

const getEasterParts = (year: number) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
};

export const getSaoJoseDosCamposHolidayKeys = (year: number) => {
  const easter = getEasterParts(year);
  const goodFriday = addDaysToParts(easter, -2);
  const corpusChristi = addDaysToParts(easter, 60);
  return new Set([
    dateKey(year, 1, 1),
    dateKey(year, 3, 19),
    dateKey(goodFriday.year, goodFriday.month, goodFriday.day),
    dateKey(year, 4, 21),
    dateKey(year, 5, 1),
    dateKey(corpusChristi.year, corpusChristi.month, corpusChristi.day),
    dateKey(year, 7, 9),
    dateKey(year, 7, 27),
    dateKey(year, 9, 7),
    dateKey(year, 10, 12),
    dateKey(year, 11, 2),
    dateKey(year, 11, 15),
    dateKey(year, 11, 20),
    dateKey(year, 12, 25),
  ]);
};

export const isSaoJoseBusinessDay = (dayIndex: number) => {
  const parts = getPartsFromDayIndex(dayIndex);
  const weekday = new Date(dayIndex * MS_PER_DAY).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  return !getSaoJoseDosCamposHolidayKeys(parts.year).has(dateKey(parts.year, parts.month, parts.day));
};

export const getSaoJoseBusinessDaysAfter = (start?: string | null, end: Date = new Date()) => {
  if (!start) return null;
  const startDate = new Date(start);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(end.getTime())) return null;

  const startParts = getSaoPauloDateParts(startDate);
  const endParts = getSaoPauloDateParts(end);
  if (!startParts || !endParts) return null;

  const startIndex = getDayIndexFromParts(startParts);
  const endIndex = getDayIndexFromParts(endParts);
  if (endIndex <= startIndex) return 0;

  let businessDays = 0;
  for (let dayIndex = startIndex + 1; dayIndex <= endIndex; dayIndex += 1) {
    if (isSaoJoseBusinessDay(dayIndex)) businessDays += 1;
  }
  return businessDays;
};

export const getSaoJoseDueDateAfterBusinessDays = (start?: string | null, days = 5) => {
  if (!start) return null;
  const startDate = new Date(start);
  if (!Number.isFinite(startDate.getTime())) return null;
  const startParts = getSaoPauloDateParts(startDate);
  if (!startParts) return null;

  let businessDays = 0;
  let dayIndex = getDayIndexFromParts(startParts);
  while (businessDays < days) {
    dayIndex += 1;
    if (isSaoJoseBusinessDay(dayIndex)) businessDays += 1;
  }

  const dueParts = getPartsFromDayIndex(dayIndex);
  return dateKey(dueParts.year, dueParts.month, dueParts.day);
};

export const formatBusinessDaysOnSite = (days: number | null) => {
  if (days === null) return 'Sem prazo calculado';
  if (days === 1) return '1 dia útil';
  return `${days} dias úteis`;
};

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

export const sortAcompanhamentoCacambas = (
  items: AcompanhamentoItem[],
  mode: AcompanhamentoSortMode,
) => {
  if (mode === 'default') return items;

  return [...items].sort((a, b) => {
    const aClientName = String(a.order.clientName || '').trim();
    const bClientName = String(b.order.clientName || '').trim();

    if (aClientName && !bClientName) return -1;
    if (!aClientName && bClientName) return 1;

    const clientNameComparison = aClientName.localeCompare(bClientName, 'pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });
    if (clientNameComparison !== 0) return clientNameComparison;

    return a.numero.localeCompare(b.numero, 'pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });
  });
};

const getOpenPlannedWithdrawalCacambaMap = (orders: IOrder[]) => {
  const planned = new Map<
    string,
    {
      orderId: string;
      orderNumber: number | null;
      status: IOrder['status'];
      createdAtMs: number;
    }
  >();

  for (const order of orders) {
    if (order.type !== 'retirada') continue;
    if (order.status === 'concluido' || order.status === 'cancelado') continue;

    const createdAtMs = getTime(order.createdAt);
    for (const id of order.plannedWithdrawalCacambaIds || []) {
      const normalized = String(id || '').trim();
      if (!normalized) continue;

      const current = planned.get(normalized);
      if (current && current.createdAtMs > createdAtMs) continue;
      planned.set(normalized, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAtMs,
      });
    }
  }

  return planned;
};

const getClientGroupKey = (order: IOrder) =>
  String(order.clientId || '').trim() || `${norm(order.clientName).trim()}|${digits(order.cnpjCpf)}`;

const getAddressGroupKey = (order: IOrder) =>
  [
    norm(order.address).trim(),
    norm(order.addressNumber).trim(),
    norm(order.neighborhood).trim(),
    norm(order.city).trim(),
    digits(order.cep),
  ].join('|');

export const getPendingWithdrawalGroups = (orders: IOrder[], today: Date = new Date()) => {
  const plannedByCacambaId = getOpenPlannedWithdrawalCacambaMap(orders);
  const dueItems = getAcompanhamentoCacambas(orders)
    .map((item): WithdrawalDueItem | null => {
      const businessDaysOnSite = getSaoJoseBusinessDaysAfter(item.cacamba.createdAt, today);
      if (businessDaysOnSite === null || businessDaysOnSite < 5) return null;
      const plannedWithdrawal = plannedByCacambaId.get(String(item.cacamba._id));
      return {
        ...item,
        businessDaysOnSite,
        dueDate: getSaoJoseDueDateAfterBusinessDays(item.cacamba.createdAt, 5) || '',
        plannedWithdrawal: plannedWithdrawal
          ? {
              orderId: plannedWithdrawal.orderId,
              orderNumber: plannedWithdrawal.orderNumber,
              status: plannedWithdrawal.status,
            }
          : undefined,
      };
    })
    .filter((item): item is WithdrawalDueItem => Boolean(item));

  const clients = new Map<string, WithdrawalClientGroup>();
  for (const item of dueItems) {
    const clientKey = getClientGroupKey(item.order);
    const clientGroup = clients.get(clientKey) || {
      key: clientKey,
      clientId: item.order.clientId,
      clientName: item.order.clientName || '-',
      cnpjCpf: item.order.cnpjCpf,
      groups: [],
      totalCacambas: 0,
    };

    const addressKey = getAddressGroupKey(item.order);
    let addressGroup = clientGroup.groups.find((group) => group.key === addressKey);
    if (!addressGroup) {
      addressGroup = {
        key: addressKey,
        order: item.order,
        items: [],
        cacambaIds: [],
        availableCacambaIds: [],
        address: formatOrderAddress(item.order),
        oldestCreatedAtMs: item.createdAtMs,
        maxBusinessDaysOnSite: item.businessDaysOnSite,
      };
      clientGroup.groups.push(addressGroup);
    }

    addressGroup.items.push(item);
    addressGroup.cacambaIds.push(item.cacamba._id);
    if (!item.plannedWithdrawal) addressGroup.availableCacambaIds.push(item.cacamba._id);
    addressGroup.oldestCreatedAtMs = Math.min(addressGroup.oldestCreatedAtMs, item.createdAtMs);
    addressGroup.maxBusinessDaysOnSite = Math.max(
      addressGroup.maxBusinessDaysOnSite,
      item.businessDaysOnSite,
    );
    clientGroup.totalCacambas += 1;
    clients.set(clientKey, clientGroup);
  }

  return [...clients.values()]
    .map((clientGroup) => ({
      ...clientGroup,
      groups: [...clientGroup.groups]
        .map((addressGroup) => {
          const items = [...addressGroup.items].sort((a, b) =>
            a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true, sensitivity: 'base' }),
          );
          return {
            ...addressGroup,
            items,
            cacambaIds: items.map((item) => item.cacamba._id),
            availableCacambaIds: items
              .filter((item) => !item.plannedWithdrawal)
              .map((item) => item.cacamba._id),
          };
        })
        .sort((a, b) => a.oldestCreatedAtMs - b.oldestCreatedAtMs),
    }))
    .sort((a, b) => {
      const nameComparison = a.clientName.localeCompare(b.clientName, 'pt-BR', {
        numeric: true,
        sensitivity: 'base',
      });
      if (nameComparison !== 0) return nameComparison;
      return a.key.localeCompare(b.key, 'pt-BR', { numeric: true, sensitivity: 'base' });
    });
};

export const sortPendingWithdrawalGroups = (
  groups: WithdrawalClientGroup[],
  mode: PendingWithdrawalSortMode,
) => {
  const groupsWithSortedAddresses = groups.map((clientGroup) => {
    const addressGroups = [...clientGroup.groups];

    if (mode === 'overdueDesc' || mode === 'overdueAsc') {
      addressGroups.sort((a, b) => {
        const overdueComparison =
          mode === 'overdueDesc'
            ? b.maxBusinessDaysOnSite - a.maxBusinessDaysOnSite
            : a.maxBusinessDaysOnSite - b.maxBusinessDaysOnSite;
        if (overdueComparison !== 0) return overdueComparison;
        return comparePtBr(a.key, b.key);
      });
    }

    return {
      ...clientGroup,
      groups: addressGroups,
    };
  });

  return groupsWithSortedAddresses.sort((a, b) => {
    if (mode === 'clientName') return compareWithdrawalClientGroupsByName(a, b);

    const overdueComparison =
      mode === 'overdueDesc'
        ? getWithdrawalClientMaxBusinessDays(b) - getWithdrawalClientMaxBusinessDays(a)
        : getWithdrawalClientMaxBusinessDays(a) - getWithdrawalClientMaxBusinessDays(b);
    if (overdueComparison !== 0) return overdueComparison;

    return compareWithdrawalClientGroupsByName(a, b);
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
