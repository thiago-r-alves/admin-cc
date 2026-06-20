import mongoose, { Document, Schema } from 'mongoose';

export type ClosureGroupStatus = 'nota_fiscal_pendente' | 'pix_pendente' | 'paga';
export type ClosurePaymentMethod = 'invoice' | 'pix';

export interface IClosureGroup extends Document {
  clientId: mongoose.Types.ObjectId | string;
  clientSequenceNumber: number;
  startDate: Date;
  endDate: Date;
  cacambaIds: mongoose.Types.ObjectId[];
  status: ClosureGroupStatus;
  paymentMethod: ClosurePaymentMethod;
  invoiceNumber?: string;
  totalAmount: number;
  pixCopyPaste?: string;
  pixTxid?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClosureGroupSchema = new Schema<IClosureGroup>(
  {
    clientId: { type: Schema.Types.Mixed, required: true },
    clientSequenceNumber: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cacambaIds: [{ type: Schema.Types.ObjectId, ref: 'Cacamba', required: true }],
    status: {
      type: String,
      enum: ['nota_fiscal_pendente', 'pix_pendente', 'paga'],
      default: 'nota_fiscal_pendente',
      required: true,
    },
    paymentMethod: { type: String, enum: ['invoice', 'pix'], default: 'invoice', required: true },
    invoiceNumber: { type: String, trim: true, required: false },
    totalAmount: { type: Number, min: 0, required: true, default: 0 },
    pixCopyPaste: { type: String, required: false },
    pixTxid: { type: String, required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

ClosureGroupSchema.index({ clientId: 1, createdAt: -1 });
ClosureGroupSchema.index({ clientId: 1, clientSequenceNumber: 1 }, { unique: true });

export const ClosureGroupModel = mongoose.model<IClosureGroup>('ClosureGroup', ClosureGroupSchema);
