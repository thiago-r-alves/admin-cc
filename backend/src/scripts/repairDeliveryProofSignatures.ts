import 'dotenv/config';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { OrderModel } from '../models/Order';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('Defina MONGODB_URI ou MONGO_URI no ambiente.');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');

const extractFileId = (url: unknown) => {
  const match = String(url || '').trim().match(/^\/files\/([a-f\d]{24})$/i);
  return match?.[1] || null;
};

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;
  const files = db.collection('uploads.files');

  const orders = await OrderModel.find({
    'deliveryProof.type': 'signed',
    'deliveryProof.signatureImageUrl': { $type: 'string', $ne: '' },
  })
    .select('_id orderNumber deliveryProof.signatureImageUrl')
    .lean();

  let alreadyValid = 0;
  let repaired = 0;
  let unrecoverable = 0;

  for (const order of orders as any[]) {
    const oldId = extractFileId(order.deliveryProof?.signatureImageUrl);
    if (!oldId) {
      unrecoverable += 1;
      console.warn(`[SEM ID] Pedido #${order.orderNumber || order._id}`);
      continue;
    }

    const currentFile = await files.findOne({ _id: new ObjectId(oldId) }, { projection: { _id: 1 } });
    if (currentFile) {
      alreadyValid += 1;
      continue;
    }

    const replacement = await files.findOne(
      { 'metadata.originalId': new ObjectId(oldId) },
      { sort: { uploadDate: -1 }, projection: { _id: 1 } },
    );
    if (!replacement?._id) {
      unrecoverable += 1;
      console.warn(`[NÃO ENCONTRADA] Pedido #${order.orderNumber || order._id} | ${oldId}`);
      continue;
    }

    const newUrl = `/files/${replacement._id.toString()}`;
    console.log(`${DRY_RUN ? '[DRY-RUN]' : '[REPARAR]'} Pedido #${order.orderNumber || order._id}: ${oldId} -> ${replacement._id}`);
    if (!DRY_RUN) {
      await OrderModel.updateOne(
        { _id: order._id, 'deliveryProof.signatureImageUrl': `/files/${oldId}` },
        { $set: { 'deliveryProof.signatureImageUrl': newUrl } },
      );
    }
    repaired += 1;
  }

  console.log(`Concluído | válidas: ${alreadyValid} | ${DRY_RUN ? 'recuperáveis' : 'reparadas'}: ${repaired} | não encontradas: ${unrecoverable}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Erro ao reparar assinaturas:', error);
  process.exit(1);
});
