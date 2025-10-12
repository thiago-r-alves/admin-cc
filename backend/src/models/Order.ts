// src/models/Order.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: number;
  clientName: string; // Manter para referência rápida, mas não obrigatório no schema
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  type: 'entrega' | 'retirada' | 'troca';
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
}

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

  // Referência obrigatória ao cliente
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },

  // Campos específicos do pedido
  type: {
    type: String,
    enum: ['entrega', 'retirada', 'troca'],
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
  imageUrls: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);