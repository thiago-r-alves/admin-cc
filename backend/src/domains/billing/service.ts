import { OrderModel } from '../../models/Order';
import {
  buildBillingSummary,
  buildPreviousPeriodRange,
  extractBillingRows,
  parseBillingGranularity,
} from '../../utils/billing';
import { buildLocalDateRange } from '../../utils/order';
import { buildClientIdMatch } from '../closures/helpers';

export const getBillingSummary = async (query: {
  startDate?: string;
  endDate?: string;
  granularity?: string;
  city?: string;
  clientId?: string;
  contentType?: string;
}) => {
  const {
    startDate,
    endDate,
    granularity,
    city,
    clientId,
    contentType,
  } = query;

  if (!startDate || !endDate) {
    return { status: 400, body: { message: 'startDate e endDate são obrigatórios.' } };
  }

  const currentRange = buildLocalDateRange(startDate, endDate);
  if (!currentRange) {
    return { status: 400, body: { message: 'Período de datas inválido.' } };
  }

  const previousRange = buildPreviousPeriodRange(currentRange.start, currentRange.end);
  const resolvedGranularity = parseBillingGranularity(granularity);
  const normalizedCity = String(city || '').trim();
  const normalizedContentType = String(contentType || '').trim();
  const normalizedClientId = String(clientId || '').trim();

  const buildBillingOrderQuery = (start: Date, end: Date) => {
    const billingQuery: Record<string, unknown> = {
      status: 'concluido',
      type: 'retirada',
      updatedAt: { $gte: start, $lte: end },
    };

    if (normalizedCity) {
      billingQuery.city = normalizedCity;
    }

    if (normalizedClientId) {
      billingQuery.$or = buildClientIdMatch(normalizedClientId);
    }

    return billingQuery;
  };

  const [currentOrders, previousOrders] = await Promise.all([
    OrderModel.find(buildBillingOrderQuery(currentRange.start, currentRange.end))
      .populate({
        path: 'cacambas',
        select: 'tipo paymentStatus contentType price',
      })
      .lean(),
    OrderModel.find(buildBillingOrderQuery(previousRange.start, previousRange.end))
      .populate({
        path: 'cacambas',
        select: 'tipo paymentStatus contentType price',
      })
      .lean(),
  ]);

  const currentRows = extractBillingRows(currentOrders as any[], {
    contentType: normalizedContentType,
  });
  const previousRows = extractBillingRows(previousOrders as any[], {
    contentType: normalizedContentType,
  });

  return {
    status: 200,
    body: buildBillingSummary(
      currentRows,
      previousRows,
      currentRange.start,
      currentRange.end,
      resolvedGranularity,
    ),
  };
};
