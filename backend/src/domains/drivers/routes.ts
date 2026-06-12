import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, isAdmin, isDriver } from '../../shared/auth';
import { upload } from '../../shared/upload';
import {
  completeDriverOrder,
  createDriver,
  createDriverOrderCacamba,
  deleteDriver,
  getDriverOrderCacambas,
  listDriverOrders,
  listDrivers,
  updateDriver,
} from './service';

export const driversRouter = Router();

driversRouter.post('/drivers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await createDriver(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao cadastrar motorista:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

driversRouter.get('/drivers', authenticateToken, isAdmin, async (_req, res) => {
  try {
    const drivers = await listDrivers();
    return res.status(200).json(drivers);
  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

driversRouter.patch('/drivers/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await updateDriver(req.params.id, req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao atualizar motorista:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

driversRouter.delete('/drivers/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await deleteDriver(req.params.id);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao excluir motorista:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

driversRouter.get('/driver/orders', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
  try {
    const orders = await listDriverOrders(String(req.userData?.userId || ''));
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos do motorista:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

driversRouter.post(
  '/driver/orders/:id/cacambas',
  authenticateToken,
  isDriver,
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await createDriverOrderCacamba(
        req.params.id,
        String(req.userData?.userId || ''),
        req.body,
        req.file,
      );
      return res.status(result.status).json(result.body);
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
      }
      console.error('Erro ao registrar caçamba:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },
);

driversRouter.get('/driver/orders/:id/cacambas', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await getDriverOrderCacambas(req.params.id, String(req.userData?.userId || ''));
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar caçambas:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

driversRouter.patch('/driver/orders/:id/complete', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await completeDriverOrder(req.params.id, String(req.userData?.userId || ''));
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao concluir pedido:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});
