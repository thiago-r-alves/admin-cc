import { Router } from 'express';
import { authenticateToken, isAdmin } from '../../shared/auth';
import {
  changeOrderClient,
  correctPendingOrder,
  createOrder,
  deleteOrder,
  listOrders,
  updateOrder,
} from './service';

export const ordersRouter = Router();

ordersRouter.post('/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await createOrder(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

ordersRouter.get('/orders', authenticateToken, isAdmin, async (_req, res) => {
  try {
    const orders = await listOrders();
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

ordersRouter.patch('/orders/:id/change-client', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await changeOrderClient(req.params.id, String(req.body?.clientId || ''));
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao corrigir cliente do pedido:', error);
    return res.status(500).json({ message: 'Erro ao corrigir cliente do pedido.' });
  }
});

ordersRouter.patch('/orders/:id/correction', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await correctPendingOrder(req.params.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao corrigir pedido:', error);
    return res.status(500).json({ message: 'Erro ao corrigir pedido.' });
  }
});

ordersRouter.patch('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await updateOrder(req.params.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar pedido' });
  }
});

ordersRouter.delete('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await deleteOrder(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});
