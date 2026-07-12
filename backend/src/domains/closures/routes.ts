import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, isAdmin } from '../../shared/auth';
import {
  createClosureDownload,
  markPixClosureGroupPaid,
  reopenClosureGroupCacamba,
  saveClosureGroupInvoice,
  saveClosureGroupPixInfo,
} from './service';
import { invalidateOperationalQueryCaches } from '../../shared/queryCache';

const invalidateOnSuccess = (status: number) => {
  if (status < 400) invalidateOperationalQueryCaches();
};

export const closuresRouter = Router();

closuresRouter.post('/closures/download', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await createClosureDownload(req.body, String(req.userData?.userId || ''));
    invalidateOnSuccess(result.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao fechar seleção de caçambas:', error);
    return res.status(500).json({ message: 'Erro ao processar fechamento.' });
  }
});

closuresRouter.patch('/closure-groups/:id/invoice', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await saveClosureGroupInvoice(req.params.id, req.body?.invoiceNumber);
    invalidateOnSuccess(result.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao salvar NF do grupo:', error);
    return res.status(500).json({ message: 'Erro ao salvar nota fiscal do grupo.' });
  }
});

closuresRouter.patch('/closure-groups/:id/pix-info', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await saveClosureGroupPixInfo(req.params.id, req.body?.pixInfo);
    invalidateOnSuccess(result.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao salvar informações do Pix:', error);
    return res.status(500).json({ message: 'Erro ao salvar informações do Pix.' });
  }
});

closuresRouter.patch('/closure-groups/:id/mark-paid', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await markPixClosureGroupPaid(req.params.id);
    invalidateOnSuccess(result.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao confirmar pagamento Pix:', error);
    return res.status(500).json({ message: 'Erro ao confirmar pagamento Pix.' });
  }
});

closuresRouter.patch('/closure-groups/:groupId/cacambas/:cacambaId/reopen', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await reopenClosureGroupCacamba(req.params.groupId, req.params.cacambaId);
    invalidateOnSuccess(result.status);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao voltar caçamba para pendente:', error);
    return res.status(500).json({ message: 'Erro ao voltar caçamba para pendente.' });
  }
});
