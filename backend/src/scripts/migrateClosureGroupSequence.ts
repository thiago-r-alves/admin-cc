import 'dotenv/config';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { ClosureGroupModel } from '../models/ClosureGroup';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('Defina MONGODB_URI no .env');
  process.exit(1);
}

const normalizeClientId = (value: unknown) => {
  if (value instanceof ObjectId) return value.toString();
  return String(value || '').trim();
};

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const groups = await ClosureGroupModel.find()
    .select('_id clientId createdAt clientSequenceNumber')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const counters = new Map<string, number>();
  let updated = 0;

  for (const group of groups) {
    const clientKey = normalizeClientId(group.clientId);
    if (!clientKey) continue;

    const next = (counters.get(clientKey) || 0) + 1;
    counters.set(clientKey, next);

    if (group.clientSequenceNumber === next) continue;

    await ClosureGroupModel.updateOne(
      { _id: group._id },
      { $set: { clientSequenceNumber: next } },
    );
    updated += 1;
  }

  // Recria indices para garantir o índice único após dados consistentes.
  await ClosureGroupModel.syncIndexes();

  console.log(
    `[migrate-closure-group-sequence] clientes=${counters.size} grupos=${groups.length} atualizados=${updated}`,
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('[migrate-closure-group-sequence] erro:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});

