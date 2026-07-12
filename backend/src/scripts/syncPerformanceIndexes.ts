import mongoose from 'mongoose';
import 'dotenv/config';
import { ClientModel } from '../models/Client';
import { OrderModel } from '../models/Order';
import { CacambaModel } from '../models/Cacamba';
import { ClosureGroupModel } from '../models/ClosureGroup';

const run = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGO_URI ou MONGODB_URI não configurada.');
  await mongoose.connect(mongoUri);
  for (const model of [ClientModel, OrderModel, CacambaModel, ClosureGroupModel]) {
    await model.createIndexes();
    console.log(`Índices sincronizados: ${model.modelName}`);
  }
  await mongoose.disconnect();
};

void run().catch(async (error) => {
  console.error('Falha ao sincronizar índices de performance:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
