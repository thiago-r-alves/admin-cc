import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, isDriver } from '../../shared/auth';
import { registerPushSubscription } from './service';

export const pushRouter = Router();

pushRouter.post('/push/subscribe', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await registerPushSubscription(String(req.userData?.userId || ''), req.body?.subscription);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao registrar subscription', error);
    return res.status(500).json({ message: 'Erro interno' });
  }
});
