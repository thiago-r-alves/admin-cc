import 'dotenv/config';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import sharp from 'sharp';

// Ajuste se seus models não forem export default
import { CacambaModel } from '../models/Cacamba';
import { OrderModel } from '../models/Order';

type GridFsFile = {
  _id: ObjectId;
  filename: string;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  contentType?: string;
  metadata?: any;
};

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('Defina MONGODB_URI no .env');
  process.exit(1);
}

// Configurações
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(process.env.RECOMPRESS_LIMIT || 0) || 0; // 0 = sem limite
const MAX_WIDTH = Number(process.env.RECOMPRESS_MAX_W || 1280);
const MAX_HEIGHT = Number(process.env.RECOMPRESS_MAX_H || 1280);
const QUALITY = Number(process.env.RECOMPRESS_QUALITY || 75);

function bytes(n: number) {
  const kb = n / 1024;
  const mb = kb / 1024;
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
}

async function main() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  const cursor = db.collection('uploads.files').find<GridFsFile>({
    contentType: { $regex: '^image/' },
    $and: [{ contentType: { $ne: 'image/webp' } }, { contentType: { $ne: 'image/avif' } }]
  });

  let processed = 0;
  for await (const file of cursor) {
    if (LIMIT && processed >= LIMIT) break;

    const oldId = file._id.toString();
    const oldUrl = `/files/${oldId}`;

    // Baixa
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      bucket
        .openDownloadStream(file._id)
        .on('data', d => chunks.push(d as Buffer))
        .on('end', () => resolve())
        .on('error', reject);
    });
    const input = Buffer.concat(chunks);

    // Recompressão -> WebP
    let output: Buffer;
    try {
      output = await sharp(input, { failOnError: false })
        .rotate()
        .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
    } catch (e) {
      console.error(`[SKIP] Falha ao recomprimir ${oldId}:`, e);
      continue;
    }

    if (output.length >= input.length) {
      console.log(`[SKIP] ${oldId} novo(${bytes(output.length)}) >= antigo(${bytes(input.length)})`);
      continue;
    }

    const newFilename = file.filename.replace(/\.[^.]+$/, '') + '.webp';
    console.log(`${DRY_RUN ? '[DRY-RUN]' : '[DO]'} ${oldId} ${bytes(input.length)} -> ${bytes(output.length)} (${newFilename})`);

    if (DRY_RUN) {
      processed++;
      continue;
    }

    // Sobe novo arquivo
    const newId: ObjectId = await new Promise<ObjectId>((resolve, reject) => {
      const up = bucket.openUploadStream(newFilename, {
        contentType: 'image/webp',
        metadata: {
          originalId: file._id,
          originalContentType: file.contentType,
          originalLength: file.length
        }
      });
      up.on('error', reject);
      up.on('finish', () => resolve(up.id as ObjectId));
      up.end(output);
    });
    const newUrl = `/files/${newId.toString()}`;

    // Atualiza Cacamba.imageUrl
    const cacRes = await CacambaModel.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });

    // Atualiza Order.imageUrls (array)
    const ordersToUpdate = await OrderModel.find({ imageUrls: oldUrl }).select('_id imageUrls').lean();
    for (const ord of ordersToUpdate) {
      const newArr = (ord.imageUrls as string[]).map(u => (u === oldUrl ? newUrl : u));
      await OrderModel.updateOne({ _id: ord._id }, { $set: { imageUrls: newArr } });
    }

    // Atualiza comprovantes digitais antes de remover o arquivo original.
    // Assinaturas também são imagens PNG no mesmo bucket do GridFS.
    const proofRes = await OrderModel.updateMany(
      { 'deliveryProof.signatureImageUrl': oldUrl },
      { $set: { 'deliveryProof.signatureImageUrl': newUrl } },
    );

    // Deleta antigo
    try {
      await bucket.delete(file._id);
    } catch (e) {
      console.warn(`[WARN] Falha ao deletar antigo ${oldId}:`, e);
    }

    console.log(`OK: ${oldId} -> ${newId} | Cacambas:${cacRes.modifiedCount} | Orders:${ordersToUpdate.length} | Assinaturas:${proofRes.modifiedCount}`);
    processed++;
  }

  console.log(`Concluído. Processados: ${processed}`);
  await mongoose.disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
