import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../../shared/auth';
import { upload } from '../../shared/upload';
import { deleteCacamba, updateCacamba } from './service';

export const cacambasRouter = Router();

cacambasRouter.patch(
  '/cacambas/:id',
  authenticateToken,
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await updateCacamba(req.params.id, req.userData, req.body, req.file);
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

cacambasRouter.delete('/cacambas/:id', authenticateToken, async (req, res) => {
  try {
    const result = await deleteCacamba(req.params.id);
    return res.status(result.status).json(result.body);
  } catch {
    return res.status(500).json({ message: 'Erro ao excluir caçamba' });
  }
});
