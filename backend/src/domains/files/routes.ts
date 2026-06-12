import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getBucket } from '../../gridfs';

export const filesRouter = Router();

filesRouter.get('/files/:id', async (req, res) => {
  try {
    const bucket = getBucket();
    const id = new ObjectId(req.params.id);
    const files = await bucket.find({ _id: id }).toArray();

    if (!files || !files[0]) {
      return res.status(404).json({ message: 'Arquivo não encontrado' });
    }

    res.setHeader('Content-Type', files[0].contentType || 'application/octet-stream');
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on('error', () => res.status(500).end());
    downloadStream.pipe(res);
  } catch {
    return res.status(400).json({ message: 'ID inválido' });
  }
});
