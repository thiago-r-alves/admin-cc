import { ObjectId } from 'mongodb';
import { ClosureGroupModel } from '../../models/ClosureGroup';
import { parseLocalDate } from '../../utils/order';

export const buildClosureDateRange = (startDate: unknown, endDate: unknown) => {
  const hasStartDate = typeof startDate === 'string' && startDate.trim().length > 0;
  const hasEndDate = typeof endDate === 'string' && endDate.trim().length > 0;
  if (!hasStartDate && !hasEndDate) return null;

  const start = hasStartDate ? parseLocalDate(String(startDate)) : undefined;
  const end = hasEndDate ? parseLocalDate(String(endDate)) : undefined;
  if ((hasStartDate && !start) || (hasEndDate && !end)) return null;

  end?.setHours(23, 59, 59, 999);
  if (start && end && start.getTime() > end.getTime()) return null;

  return { start, end };
};

export type ClosureDateRange = NonNullable<ReturnType<typeof buildClosureDateRange>>;

export const buildClosureOrdersQuery = (range: ClosureDateRange) => {
  const updatedAt: Record<string, Date> = {};
  if (range.start) updatedAt.$gte = range.start;
  if (range.end) updatedAt.$lte = range.end;

  return {
    status: 'concluido' as const,
    type: 'retirada' as const,
    ...(Object.keys(updatedAt).length ? { updatedAt } : {}),
  };
};

export const buildClosureCandidateOrdersQuery = (range: ClosureDateRange | null) => {
  const updatedAt: Record<string, Date> = {};
  if (range?.start) updatedAt.$gte = range.start;
  if (range?.end) updatedAt.$lte = range.end;

  return {
    status: 'concluido' as const,
    type: { $in: ['entrega', 'retirada'] as const },
    ...(Object.keys(updatedAt).length ? { updatedAt } : {}),
  };
};

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
