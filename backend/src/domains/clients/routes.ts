import type express from 'express';
import { Router } from 'express';
import { authenticateToken, isAdmin } from '../../shared/auth';
import {
  createClient,
  deleteClient,
  listClientOrders,
  listClients,
  listClosureGroups,
  updateClient,
} from './service';
import {
  getOrSetQueryCache,
  invalidateQueryCaches,
  normalizeQueryKey,
  QUERY_CACHE_NAMESPACES,
} from '../../shared/queryCache';

export const clientsRouter = Router();

const paginateCachedResult = (result: { status: number; body: any }, query: Record<string, unknown>) => {
  if (result.status >= 400 || !Array.isArray(result.body)) return result;
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1);
  const pageSize = Math.min(25, Math.max(1, Number.parseInt(String(query.pageSize || '25'), 10) || 25));
  return {
    status: result.status,
    body: {
      items: result.body.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalItems: result.body.length,
      totalPages: Math.max(1, Math.ceil(result.body.length / pageSize)),
    },
  };
};

clientsRouter.get('/clients', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const query = req.query as Record<string, unknown>;
    const namespace = String(query.closure).toLowerCase() === 'true'
      ? QUERY_CACHE_NAMESPACES.closureClients
      : QUERY_CACHE_NAMESPACES.clients;
    const shouldCacheFullClosureResult = namespace === QUERY_CACHE_NAMESPACES.closureClients && String(query.paginated).toLowerCase() === 'true';
    const cacheQuery = shouldCacheFullClosureResult ? { ...query, paginated: undefined, page: undefined, pageSize: undefined } : query;
    const cached = await getOrSetQueryCache(normalizeQueryKey(namespace, cacheQuery), () => listClients(cacheQuery));
    res.setHeader('X-Cache', cached.status);
    res.setHeader('Access-Control-Expose-Headers', 'X-Cache');
    const result = shouldCacheFullClosureResult ? paginateCachedResult(cached.value, query) : cached.value;
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return res.status(500).json({ message: 'Erro ao buscar clientes.' });
  }
});

clientsRouter.post('/clients', authenticateToken, async (req, res) => {
  try {
    const client = await createClient(req.body);
    invalidateQueryCaches(QUERY_CACHE_NAMESPACES.clients, QUERY_CACHE_NAMESPACES.closureClients);
    return res.status(201).json(client);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao criar cliente' });
  }
});

clientsRouter.patch('/clients/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await updateClient(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Cliente não encontrado' });
    invalidateQueryCaches(QUERY_CACHE_NAMESPACES.clients, QUERY_CACHE_NAMESPACES.closureClients, QUERY_CACHE_NAMESPACES.clientOrders, QUERY_CACHE_NAMESPACES.closureGroups);
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
});

clientsRouter.delete('/clients/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await deleteClient(req.params.id);
    if (result.status < 400) invalidateQueryCaches(QUERY_CACHE_NAMESPACES.clients, QUERY_CACHE_NAMESPACES.closureClients);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return res.status(500).json({ message: 'Erro ao excluir cliente.' });
  }
});

clientsRouter.get('/clients/:id/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = req.query as Record<string, unknown>;
    const paginated = String(query.paginated).toLowerCase() === 'true';
    const cacheQuery = paginated ? { ...query, paginated: undefined, page: undefined, pageSize: undefined } : query;
    const key = normalizeQueryKey(`${QUERY_CACHE_NAMESPACES.clientOrders}:${req.params.id}`, cacheQuery);
    const cached = await getOrSetQueryCache(key, () => listClientOrders(req.params.id, cacheQuery));
    res.setHeader('X-Cache', cached.status);
    res.setHeader('Access-Control-Expose-Headers', 'X-Cache');
    const result = paginated ? paginateCachedResult(cached.value, query) : cached.value;
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

clientsRouter.get('/clients/:id/closure-groups', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = req.query as Record<string, unknown>;
    const key = normalizeQueryKey(`${QUERY_CACHE_NAMESPACES.closureGroups}:${req.params.id}`, query);
    const cached = await getOrSetQueryCache(key, () => listClosureGroups(req.params.id, query as any));
    res.setHeader('X-Cache', cached.status);
    res.setHeader('Access-Control-Expose-Headers', 'X-Cache');
    const result = cached.value;
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar grupos de fechamento:', error);
    return res.status(500).json({ message: 'Erro ao buscar grupos de fechamento.' });
  }
});
