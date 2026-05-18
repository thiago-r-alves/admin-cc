// src/models/Cacamba.ts

import mongoose, { Document, Schema } from 'mongoose';

export const CACAMBA_CONTENT_TYPES = [
  'Entulho limpo',
  'Entulho misto',
  'Entulho com madeira',
  'Terra',
  'Madeira limpa',
  'Madeira mista',
  'Madeira MDF',
  'Lixo diversos',
  'Gesso',
  'Gesso acartonado',
  'PMTFGP',
  'Sucatas',
  'Residuos contaminados',
] as const;

export type CacambaContentType = typeof CACAMBA_CONTENT_TYPES[number];

export interface ICacamba extends Document {
  numero: string;
  tipo: 'entrega' | 'retirada';
  contentType?: CacambaContentType;
  price?: number;
  imageUrl: string;
  orderId: mongoose.Types.ObjectId;
  local: 'via_publica' | 'canteiro_obra'; // <-- Adicione aqui
  createdAt: Date;
  horaServicoDigitos: string;
}

const CacambaSchema: Schema = new Schema({
  numero: { type: String, required: true },
  tipo: { type: String, enum: ['entrega', 'retirada'], required: true },
  contentType: { type: String, enum: CACAMBA_CONTENT_TYPES, required: false },
  price: { type: Number, min: 0, required: false },
  imageUrl: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  local: { type: String, enum: ['via_publica', 'canteiro_obra'], required: true },
  createdAt: { type: Date, default: Date.now },
  horaServicoDigitos: { type: String, required: false }
});

CacambaSchema.index({ orderId: 1, numero: 1 }, { unique: true });

export const CacambaModel = mongoose.model<ICacamba>('Cacamba', CacambaSchema);
