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

export const clientsRouter = Router();

clientsRouter.get('/clients', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const result = await listClients(req.query as Record<string, unknown>);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return res.status(500).json({ message: 'Erro ao buscar clientes.' });
  }
});

clientsRouter.post('/clients', authenticateToken, async (req, res) => {
  try {
    const client = await createClient(req.body);
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
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
});

clientsRouter.delete('/clients/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await deleteClient(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return res.status(500).json({ message: 'Erro ao excluir cliente.' });
  }
});

clientsRouter.get('/clients/:id/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await listClientOrders(req.params.id, req.query as Record<string, unknown>);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

clientsRouter.get('/clients/:id/closure-groups', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await listClosureGroups(req.params.id, req.query as any);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar grupos de fechamento:', error);
    return res.status(500).json({ message: 'Erro ao buscar grupos de fechamento.' });
  }
});
