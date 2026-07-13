import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest, isAdmin } from '../../shared/auth';
import { upload } from '../../shared/upload';
import { deleteCacamba, getCacambaTrack, listTrackedCacambaNumbers, updateCacamba } from './service';
import { invalidateOperationalQueryCaches } from '../../shared/queryCache';

export const cacambasRouter = Router();

cacambasRouter.get('/cacambas/track', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await getCacambaTrack(req.query.numero);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar histórico da caçamba:', error);
    return res.status(500).json({ message: 'Erro ao buscar histórico da caçamba' });
  }
});

cacambasRouter.get('/cacambas/tracked-numbers', authenticateToken, isAdmin, async (_req, res) => {
  try {
    const result = await listTrackedCacambaNumbers();
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Erro ao buscar caçambas rastreadas:', error);
    return res.status(500).json({ message: 'Erro ao buscar caçambas rastreadas' });
  }
});

cacambasRouter.patch(
  '/cacambas/:id',
  authenticateToken,
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await updateCacamba(req.params.id, req.userData, req.body, req.file);
      if (result.status < 400) invalidateOperationalQueryCaches();
      return res.status(result.status).json(result.body);
    } catch (error: any) {
      if (error?.code === 11000) {
        return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
      }
      console.error('Erro ao editar caçamba:', error);
      return res.status(500).json({ message: 'Erro ao editar caçamba' });
    }
  },
);

cacambasRouter.delete('/cacambas/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await deleteCacamba(req.params.id, req.userData);
    if (result.status < 400) invalidateOperationalQueryCaches();
    return res.status(result.status).json(result.body);
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir caçamba' });
  }
});
