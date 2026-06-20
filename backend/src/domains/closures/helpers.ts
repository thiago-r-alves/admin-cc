import { ObjectId } from 'mongodb';
import { ClosureGroupModel } from '../../models/ClosureGroup';
import { buildLocalDateRange } from '../../utils/order';

export const buildClosureDateRange = (startDate: unknown, endDate: unknown) => {
  if (!startDate || !endDate) return null;
  return buildLocalDateRange(String(startDate), String(endDate));
};

export const buildClosureOrdersQuery = (range: { start: Date; end: Date }) => ({
  status: 'concluido' as const,
  type: 'retirada' as const,
  updatedAt: { $gte: range.start, $lte: range.end },
});

export type ClosurePaymentFilter =
  | 'all'
  | 'pending'
  | 'invoice_pending'
  | 'pix_pending'
  | 'paid'
  | 'metadata_pending';

export const parseClosurePaymentFilter = (value: unknown): ClosurePaymentFilter => {
  if (value === 'pending') return 'pending';
  if (value === 'invoice_pending') return 'invoice_pending';
  if (value === 'pix_pending') return 'pix_pending';
  if (value === 'paid') return 'paid';
  if (value === 'metadata_pending') return 'metadata_pending';
  return 'all';
};

export const buildClientIdMatch = (id: string) => {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [{ clientId: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    return [{ clientId: trimmed }, { clientId: new ObjectId(trimmed) }];
  }
  return [{ clientId: trimmed }];
};

export const buildClosureGroupClientMatch = (id: string) => {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [{ clientId: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    return [{ clientId: trimmed }, { clientId: new ObjectId(trimmed) }];
  }
  return [{ clientId: trimmed }];
};

export const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getNextClosureGroupSequence = async (clientId: string | ObjectId) => {
  const latestGroupForClient = (await ClosureGroupModel.findOne({
    $or: buildClosureGroupClientMatch(String(clientId)),
  })
    .sort({ clientSequenceNumber: -1 })
    .select('clientSequenceNumber')
    .lean()) as { clientSequenceNumber?: number } | null;

  return (latestGroupForClient?.clientSequenceNumber || 0) + 1;
};

export const CLOSURE_DEBUG = String(process.env.CLOSURE_DEBUG || '').toLowerCase() === 'true';
