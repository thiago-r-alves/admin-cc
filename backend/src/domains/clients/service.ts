import { ObjectId } from 'mongodb';

import { ClientModel } from '../../models/Client';
import { ClosureGroupModel } from '../../models/ClosureGroup';
import { OrderModel } from '../../models/Order';
import { buildLocalDateRange } from '../../utils/order';
import { enrichWithdrawalCacambasWithDeliveryMetadata } from '../cacambas/enrichment';
import {
  filterOrdersForClosureCandidates,
  summarizeClosureCacambas,
} from '../closures/candidates';
import {
  buildClientIdMatch,
  buildClosureCandidateOrdersQuery,
  buildClosureDateRange,
  buildClosureGroupClientMatch,
  CLOSURE_DEBUG,
  escapeRegExp,
  type ClosureDateRange,
  parseClosurePaymentFilter,
} from '../closures/helpers';

const CLIENT_SELECT = 'clientName contactName contactNumber neighborhood address addressNumber cnpjCpf email rgInscricaoEstadual city cep createdAt updatedAt';
const ORDER_SELECT = '_id orderNumber clientId clientName contactName contactNumber neighborhood address addressNumber type priority status motorista cacambas createdAt updatedAt cnpjCpf city cep placa';
const CACAMBA_SELECT = '_id numero tipo paymentStatus closureGroupId contentType price imageUrl orderId local createdAt horaServicoDigitos';

const parsePagination = (query: Record<string, unknown>) => {
  const paginated = String(query.paginated || '').toLowerCase() === 'true';
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const requestedPageSize = Number.parseInt(String(query.pageSize || '25'), 10) || 25;
  return { paginated, page, pageSize: Math.min(25, Math.max(1, requestedPageSize)) };
};

const paginate = <T>(items: T[], page: number, pageSize: number) => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  page,
  pageSize,
  totalItems: items.length,
  totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
});

const buildClientSearchQuery = (value: unknown) => {
  const q = String(value || '').trim();
  if (!q) return {};
  const pattern = new RegExp(escapeRegExp(q), 'i');
  return {
    $or: [
      'clientName', 'cnpjCpf', 'email', 'rgInscricaoEstadual', 'address', 'addressNumber',
      'neighborhood', 'city', 'cep', 'contactName', 'contactNumber',
    ].map((field) => ({ [field]: pattern })),
  };
};

export const listClients = async (query: Record<string, unknown>) => {
  const { startDate, endDate, type, closure, paymentStatus } = query;
  const isClosureMode = String(closure || '').toLowerCase() === 'true';
  const closurePaymentFilter = parseClosurePaymentFilter(paymentStatus);
  const hasTypeFilter = typeof type === 'string' && (type === 'entrega' || type === 'retirada');
  const { paginated, page, pageSize } = parsePagination(query);
  const clientSearchQuery = buildClientSearchQuery(query.q);

  if (isClosureMode) {
    const hasDateFilter = Boolean(startDate || endDate);
    const range = hasDateFilter ? buildClosureDateRange(startDate, endDate) : null;
    if (hasDateFilter && !range) {
      return { status: 400, body: { message: 'Período de datas inválido.' } };
    }
    const metadataPendingDateRange = closurePaymentFilter === 'metadata_pending' ? range : null;
    const matchingClientIds = String(query.q || '').trim()
      ? (await ClientModel.find(clientSearchQuery).select('_id').lean()).map((client) => client._id)
      : null;
    if (matchingClientIds && matchingClientIds.length === 0) {
      const emptyResult: any[] = [];
      return { status: 200, body: paginated ? paginate(emptyResult, page, pageSize) : emptyResult };
    }
    const closureOrdersQuery = {
      ...buildClosureCandidateOrdersQuery(range),
      ...(matchingClientIds ? { clientId: { $in: matchingClientIds } } : {}),
    };
    const foundOrders = await OrderModel.find(closureOrdersQuery)
      .select('clientId cacambas updatedAt')
      .populate({ path: 'cacambas', select: CACAMBA_SELECT })
      .lean();
    const closureOrders = await filterOrdersForClosureCandidates(foundOrders as any[], {
      metadataDateRange: metadataPendingDateRange,
    });

    const statsByClient = new Map<string, any>();
    for (const order of closureOrders as any[]) {
      const clientId = String(order.clientId || '').trim();
      if (!clientId) continue;

      const counts = summarizeClosureCacambas(order.cacambas || []);
      const generatedClosureGroupsCount =
        counts.invoicePendingClosureCount + counts.pixPendingClosureCount + counts.paidClosureCount;
      const updatedAtMs = new Date(order.updatedAt || 0).getTime();
      const current = statsByClient.get(clientId) || {
        _id: clientId,
        latestCompletionMs: 0,
        orderCount: 0,
        pendingClosureCount: 0,
        generatedClosureGroupsCount: 0,
        pendingClosureMetadataCount: 0,
        pendingClosureMissingPriceCount: 0,
        pendingClosureMissingContentTypeCount: 0,
        invoicePendingClosureCount: 0,
        pixPendingClosureCount: 0,
        paidClosureCount: 0,
      };

      current.latestCompletionMs = Math.max(
        current.latestCompletionMs,
        Number.isFinite(updatedAtMs) ? updatedAtMs : 0,
      );
      current.orderCount += 1;
      current.pendingClosureCount += counts.pendingClosureCount;
      current.generatedClosureGroupsCount += generatedClosureGroupsCount;
      current.pendingClosureMetadataCount += counts.pendingClosureMetadataCount;
      current.pendingClosureMissingPriceCount += counts.pendingClosureMissingPriceCount;
      current.pendingClosureMissingContentTypeCount += counts.pendingClosureMissingContentTypeCount;
      current.invoicePendingClosureCount += counts.invoicePendingClosureCount;
      current.pixPendingClosureCount += counts.pixPendingClosureCount;
      current.paidClosureCount += counts.paidClosureCount;
      statsByClient.set(clientId, current);
    }

    const matchesPaymentFilter = (stats: any) => {
      if (closurePaymentFilter === 'pending') return stats.pendingClosureCount > 0;
      if (closurePaymentFilter === 'invoice_pending') return stats.invoicePendingClosureCount > 0;
      if (closurePaymentFilter === 'pix_pending') return stats.pixPendingClosureCount > 0;
      if (closurePaymentFilter === 'metadata_pending') return stats.pendingClosureMetadataCount > 0;
      if (closurePaymentFilter === 'paid') return stats.paidClosureCount > 0;
      return stats.pendingClosureCount > 0 || stats.generatedClosureGroupsCount > 0;
    };

    const filteredStats = Array.from(statsByClient.values()).filter(matchesPaymentFilter);
    const clientIds = filteredStats
      .map((stats) => stats._id)
      .filter((clientId): clientId is string => Boolean(clientId) && ObjectId.isValid(clientId))
      .map((clientId) => new ObjectId(clientId));
    const clients = clientIds.length
      ? await ClientModel.find({ _id: { $in: clientIds }, ...clientSearchQuery }).select(CLIENT_SELECT).lean()
      : [];
    const clientById = new Map(clients.map((client: any) => [String(client._id), client]));
    const aggregated = filteredStats
      .map((stats) => ({
        ...stats,
        latestCompletion: stats.latestCompletionMs ? new Date(stats.latestCompletionMs) : null,
        client: clientById.get(stats._id),
      }))
      .filter((stats) => Boolean(stats.client))
      .sort((a, b) => {
        if (b.latestCompletionMs !== a.latestCompletionMs) {
          return b.latestCompletionMs - a.latestCompletionMs;
        }
        return String(a.client.clientName || '').localeCompare(
          String(b.client.clientName || ''),
          'pt-BR',
        );
      });

    if (CLOSURE_DEBUG) {
      console.log('[CLOSURE_DEBUG] /clients?closure=true', {
        range: range
          ? {
            start: range.start?.toISOString() || null,
            end: range.end?.toISOString() || null,
          }
          : 'all',
        count: aggregated.length,
        clients: aggregated.map((row: any) => ({
          clientId: row._id,
          orderCount: row.orderCount,
          latestCompletion: row.latestCompletion,
        })),
      });
    }

    const result = aggregated
      .map((row: any) => {
        if (!row.client) return null;
        return {
          ...row.client,
          hasPendingClosureItems: Number(row.pendingClosureCount || 0) > 0,
          hasGeneratedClosureGroups: Number(row.generatedClosureGroupsCount || 0) > 0,
          hasPendingClosureMetadata: Number(row.pendingClosureMetadataCount || 0) > 0,
          pendingClosureCount: Number(row.pendingClosureCount || 0),
          generatedClosureGroupsCount: Number(row.generatedClosureGroupsCount || 0),
          pendingClosureMetadataCount: Number(row.pendingClosureMetadataCount || 0),
          pendingClosureMissingPriceCount: Number(row.pendingClosureMissingPriceCount || 0),
          pendingClosureMissingContentTypeCount: Number(row.pendingClosureMissingContentTypeCount || 0),
        };
      })
      .filter(Boolean);
    return {
      status: 200,
      body: paginated ? paginate(result, page, pageSize) : result,
    };
  }

  if (startDate && endDate) {
    const range = buildLocalDateRange(String(startDate), String(endDate));
    if (!range) {
      return { status: 400, body: { message: 'Período de datas inválido.' } };
    }
    const { start, end } = range;

    const ordersQuery: Record<string, unknown> = {
      status: 'concluido',
      updatedAt: { $gte: start, $lte: end },
    };
    if (hasTypeFilter) {
      ordersQuery.type = type;
    }

    const concludedOrders = await OrderModel.find(ordersQuery).select('clientId updatedAt').lean();
    const firstCompletionByClient = new Map<string, number>();

    for (const order of concludedOrders as Array<{ clientId?: unknown; updatedAt?: Date | string }>) {
      const clientId = String(order.clientId ?? '');
      if (!clientId) continue;

      const updatedAtMs = new Date(order.updatedAt ?? 0).getTime();
      if (!Number.isFinite(updatedAtMs)) continue;

      const current = firstCompletionByClient.get(clientId);
      if (current === undefined || updatedAtMs < current) {
        firstCompletionByClient.set(clientId, updatedAtMs);
      }
    }

    const clientIds = Array.from(firstCompletionByClient.keys());
    if (!clientIds.length) {
      return { status: 200, body: [] };
    }

    const clients = await ClientModel.find({ _id: { $in: clientIds }, ...clientSearchQuery }).select(CLIENT_SELECT).lean();
    const clientById = new Map(clients.map((client) => [String(client._id), client]));

    const sortedClients = clientIds
      .map((id) => ({
        client: clientById.get(id),
        firstCompletion: firstCompletionByClient.get(id) ?? 0,
      }))
      .filter((item): item is { client: any; firstCompletion: number } => Boolean(item.client))
      .sort((a, b) => {
        if (b.firstCompletion !== a.firstCompletion) {
          return b.firstCompletion - a.firstCompletion;
        }
        const aName = String(a.client.clientName ?? '').toLocaleLowerCase('pt-BR');
        const bName = String(b.client.clientName ?? '').toLocaleLowerCase('pt-BR');
        return aName.localeCompare(bName, 'pt-BR');
      })
      .map((item) => item.client);

    return { status: 200, body: paginated ? paginate(sortedClients, page, pageSize) : sortedClients };
  }

  if (hasTypeFilter) {
    const typedOrders = await OrderModel.find({ type }).select('clientId').lean();
    const clientIds = Array.from(
      new Set(
        typedOrders
          .map((order: any) => String(order.clientId))
          .filter(Boolean),
      ),
    );
    const clients = await ClientModel.find({ _id: { $in: clientIds }, ...clientSearchQuery }).select(CLIENT_SELECT).sort({ clientName: 1 }).lean();
    return { status: 200, body: paginated ? paginate(clients, page, pageSize) : clients };
  }

  if (paginated) {
    const [clients, totalItems] = await Promise.all([
      ClientModel.find(clientSearchQuery).select(CLIENT_SELECT).sort({ clientName: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      ClientModel.countDocuments(clientSearchQuery),
    ]);
    return { status: 200, body: { items: clients, page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) } };
  }
  const clients = await ClientModel.find(clientSearchQuery).select(CLIENT_SELECT).sort({ clientName: 1 }).lean();
  return { status: 200, body: clients };
};

export const createClient = async (payload: Record<string, unknown>) =>
  ClientModel.create({
    clientName: payload.clientName,
    contactName: payload.contactName,
    contactNumber: payload.contactNumber,
    neighborhood: payload.neighborhood,
    address: payload.address,
    addressNumber: payload.addressNumber,
    cnpjCpf: payload.cnpjCpf || '',
    email: payload.email || '',
    rgInscricaoEstadual: payload.rgInscricaoEstadual || '',
    city: payload.city || '',
    cep: payload.cep || '',
  });

export const updateClient = async (id: string, payload: Record<string, unknown>) => {
  const updates: Record<string, unknown> = {};
  const fields = [
    'clientName',
    'contactName',
    'contactNumber',
    'neighborhood',
    'address',
    'addressNumber',
    'cnpjCpf',
    'email',
    'rgInscricaoEstadual',
    'city',
    'cep',
  ];

  for (const field of fields) {
    if (payload[field] !== undefined) updates[field] = payload[field];
  }

  return ClientModel.findByIdAndUpdate(id, updates, { new: true });
};

export const deleteClient = async (id: string) => {
  const orderCount = await OrderModel.countDocuments({ clientId: id });
  if (orderCount > 0) {
    return {
      status: 400,
      body: { message: 'Não é possível excluir o cliente pois existem pedidos associados.' },
    };
  }

  const client = await ClientModel.findByIdAndDelete(id);
  if (!client) {
    return { status: 404, body: { message: 'Cliente não encontrado.' } };
  }

  return { status: 200, body: { message: 'Cliente excluído com sucesso.' } };
};

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const filterOperationalOrderCacambas = (
  orders: any[],
  filters: { local?: unknown; q?: unknown },
) => {
  const localFilter = typeof filters.local === 'string' ? filters.local : '';
  const search = normalizeText(filters.q);

  if (!localFilter && !search) return orders;

  return orders
    .map((order) => {
      const orderMatchesSearch =
        Boolean(search) && normalizeText(order?.orderNumber).includes(search);
      let filteredCacambas = [...(order.cacambas || [])];

      if (localFilter) {
        filteredCacambas = filteredCacambas.filter((cacamba: any) => cacamba?.local === localFilter);
      }

      if (search && !orderMatchesSearch) {
        filteredCacambas = filteredCacambas.filter((cacamba: any) =>
          normalizeText(cacamba?.numero).includes(search),
        );
      }

      return {
        ...order,
        cacambas: filteredCacambas,
        __orderMatchesSearch: orderMatchesSearch,
      };
    })
    .filter((order) => {
      if (localFilter && (order.cacambas || []).length === 0) return false;
      if (search && !order.__orderMatchesSearch && (order.cacambas || []).length === 0) {
        return false;
      }
      return true;
    })
    .map(({ __orderMatchesSearch, ...order }) => order);
};

export const listClientOrders = async (clientId: string, query: Record<string, unknown>) => {
  const { startDate, endDate, type, local, status, closure, paymentStatus, q } = query;
  const isClosureMode = String(closure || '').toLowerCase() === 'true';
  const closurePaymentFilter = parseClosurePaymentFilter(paymentStatus);
  const orderQuery: Record<string, unknown> = { clientId };
  let closureRange: ClosureDateRange | null = null;
  const { paginated, page, pageSize } = parsePagination(query);

  if (isClosureMode) {
    const hasDateFilter = Boolean(startDate || endDate);
    closureRange = hasDateFilter ? buildClosureDateRange(startDate, endDate) : null;
    if (hasDateFilter && !closureRange) {
      return { status: 400, body: { message: 'Período de datas inválido.' } };
    }
    orderQuery.$or = buildClientIdMatch(clientId);
    delete orderQuery.clientId;
    Object.assign(orderQuery, buildClosureCandidateOrdersQuery(closureRange));
  } else {
    if (startDate && endDate) {
      const range = buildLocalDateRange(String(startDate), String(endDate));
      if (!range) {
        return { status: 400, body: { message: 'Período de datas inválido.' } };
      }
      orderQuery.createdAt = {
        $gte: range.start,
        $lte: range.end,
      };
    }

    if (type) {
      orderQuery.type = type;
    }

    if (status) {
      orderQuery.status = status;
    }
  }

  const foundOrders = await OrderModel.find(orderQuery)
    .select(ORDER_SELECT)
    .populate({ path: 'cacambas', select: CACAMBA_SELECT })
    .populate({
      path: 'motorista',
      select: 'username',
    })
    .sort(isClosureMode ? { updatedAt: -1 } : { createdAt: -1 });
  let orders = await enrichWithdrawalCacambasWithDeliveryMetadata(foundOrders as any[], { clientId });

  if (isClosureMode) {
    orders = await filterOrdersForClosureCandidates(orders, {
      paymentFilter: closurePaymentFilter,
      metadataDateRange: closurePaymentFilter === 'metadata_pending' ? closureRange : null,
    });
  } else {
    orders = filterOperationalOrderCacambas(orders, { local, q });
  }

  return { status: 200, body: paginated ? paginate(orders, page, pageSize) : orders };
};

export const listClosureGroups = async (
  clientId: string,
  query: { startDate?: string; endDate?: string; status?: 'nota_fiscal_pendente' | 'pix_pendente' | 'paga' | 'all' },
) => {
  const { startDate, endDate, status } = query;
  const { paginated, page, pageSize } = parsePagination(query as Record<string, unknown>);
  const hasDateFilter = Boolean(startDate || endDate);
  const range = hasDateFilter ? buildClosureDateRange(startDate, endDate) : null;
  if (hasDateFilter && !range) {
    return { status: 400, body: { message: 'Período de datas inválido.' } };
  }

  const groupQuery: Record<string, unknown> = {
    $or: buildClosureGroupClientMatch(clientId),
  };
  if (range?.start) {
    groupQuery.startDate = { $gte: range.start };
  }
  if (range?.end) {
    groupQuery.endDate = { $lte: range.end };
  }
  if (status && status !== 'all') {
    groupQuery.status = status;
  }

  const groupsQuery = ClosureGroupModel.find(groupQuery)
    .populate({ path: 'cacambaIds', select: CACAMBA_SELECT })
    .sort({ createdAt: -1 })
    .lean();
  const totalItems = paginated ? await ClosureGroupModel.countDocuments(groupQuery) : 0;
  if (paginated) groupsQuery.skip((page - 1) * pageSize).limit(pageSize);
  const groups = await groupsQuery;

  const closureCacambaIds = groups.flatMap((group: any) =>
    (group.cacambaIds || []).map((cacamba: any) => String(cacamba?._id || '')).filter(Boolean),
  );
  const closureOrdersForGroups = closureCacambaIds.length
    ? await OrderModel.find({
      $or: buildClientIdMatch(clientId),
      cacambas: { $in: closureCacambaIds },
    })
      .populate({
        path: 'motorista',
        select: 'username',
      })
      .select(ORDER_SELECT)
      .populate({ path: 'cacambas', select: CACAMBA_SELECT })
      .lean()
    : [];
  const enrichedOrders = await enrichWithdrawalCacambasWithDeliveryMetadata(
    closureOrdersForGroups as any[],
    { clientId },
  );
  const enrichedCacambaById = new Map<string, any>();
  for (const order of enrichedOrders as any[]) {
    for (const cacamba of order.cacambas || []) {
      enrichedCacambaById.set(String(cacamba._id), cacamba);
    }
  }

  const result = groups.map((group: any) => ({
    ...group,
    cacambaIds: (group.cacambaIds || []).map((cacamba: any) => ({
      ...cacamba,
      ...(enrichedCacambaById.get(String(cacamba._id)) || {}),
    })),
  }));
  return {
    status: 200,
    body: paginated
      ? { items: result, page, pageSize, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / pageSize)) }
      : result,
  };
};
