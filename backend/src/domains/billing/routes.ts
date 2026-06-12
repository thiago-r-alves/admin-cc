import { Router } from 'express';
import { authenticateToken, isAdmin } from '../../shared/auth';
import { getBillingSummary } from './service';

export const billingRouter = Router();

billingRouter.get('/billing/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await getBillingSummary(req.query as Record<string, string | undefined>);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao gerar resumo de faturamento:', error);
    return res.status(500).json({ message: 'Erro ao gerar resumo de faturamento.' });
  }
});
