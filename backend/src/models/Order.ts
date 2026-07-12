// src/models/Order.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryProof {
  type: 'signed' | 'no_responsible';
  signatureImageUrl?: string;
  note?: string;
  capturedAt: Date;
  capturedBy: mongoose.Types.ObjectId;
  driverNameSnapshot: string;
}

export interface IOrder extends Document {
  orderNumber: number;
  clientName: string; // Manter para referência rápida, mas não obrigatório no schema
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  type: 'entrega' | 'retirada';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista?: mongoose.Types.ObjectId;
  priority: number;
  imageUrls: string[];
  cacambas: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  clientId: mongoose.Types.ObjectId; // Referência ao cliente
  cnpjCpf?: string;
  city?: string;
  cep?: string; // ADICIONADO
  placa?: string; // ADICIONADO
  cacambaPrice?: number;
  plannedWithdrawalCacambaIds?: mongoose.Types.ObjectId[];
  deliveryProof?: IDeliveryProof;
}

const DeliveryProofSchema = new Schema<IDeliveryProof>(
  {
    type: {
      type: String,
      enum: ['signed', 'no_responsible'],
      required: true,
    },
    signatureImageUrl: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    capturedAt: { type: Date, required: true },
    capturedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverNameSnapshot: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const OrderSchema: Schema = new Schema<IOrder>({
  orderNumber: { type: Number, unique: true },
  // Campos que virão do cliente (não são mais obrigatórios no pedido)
  clientName: { type: String, required: true, trim: true },
  cnpjCpf: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  cep: { type: String, trim: true, default: '' }, // ADICIONADO
  contactName: { type: String, trim: true, default: '' },
  contactNumber: { type: String, trim: true, default: '' },
  neighborhood: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  addressNumber: { type: String, default: '' },
  placa: { type: String, required: false, trim: true, default: '' },
  cacambaPrice: { type: Number, min: 0, required: false, select: false },

  // Referência obrigatória ao cliente
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },

  // Campos específicos do pedido
  type: {
    type: String,
    enum: ['entrega', 'retirada'],
    required: true,
  },
  priority: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'concluido'],
    default: 'pendente',
  },
  motorista: { type: Schema.Types.ObjectId, ref: 'User' },
  cacambas: [{ type: Schema.Types.ObjectId, ref: 'Cacamba' }],
  plannedWithdrawalCacambaIds: [{ type: Schema.Types.ObjectId, ref: 'Cacamba' }],
  deliveryProof: { type: DeliveryProofSchema, required: false },
  imageUrls: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);
