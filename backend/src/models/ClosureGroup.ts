import mongoose, { Document, Schema } from 'mongoose';

export type ClosureGroupStatus = 'nota_fiscal_pendente' | 'paga';

export interface IClosureGroup extends Document {
  clientId: mongoose.Types.ObjectId | string;
  clientSequenceNumber: number;
  startDate: Date;
  endDate: Date;
  cacambaIds: mongoose.Types.ObjectId[];
  status: ClosureGroupStatus;
  invoiceNumber?: string;
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
      enum: ['nota_fiscal_pendente', 'paga'],
      default: 'nota_fiscal_pendente',
      required: true,
    },
    invoiceNumber: { type: String, trim: true, required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

ClosureGroupSchema.index({ clientId: 1, createdAt: -1 });
ClosureGroupSchema.index({ clientId: 1, clientSequenceNumber: 1 }, { unique: true });

export const ClosureGroupModel = mongoose.model<IClosureGroup>('ClosureGroup', ClosureGroupSchema);
