import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, isAdmin } from '../../shared/auth';
import { createClosureDownload, saveClosureGroupInvoice } from './service';

export const closuresRouter = Router();

closuresRouter.post('/closures/download', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await createClosureDownload(req.body, String(req.userData?.userId || ''));
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao fechar seleção de caçambas:', error);
    return res.status(500).json({ message: 'Erro ao processar fechamento.' });
  }
});

closuresRouter.patch('/closure-groups/:id/invoice', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await saveClosureGroupInvoice(req.params.id, req.body?.invoiceNumber);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao salvar NF do grupo:', error);
    return res.status(500).json({ message: 'Erro ao salvar nota fiscal do grupo.' });
  }
});
