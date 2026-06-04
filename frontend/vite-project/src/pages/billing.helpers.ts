import type { IBillingSummaryResponse } from '../interfaces';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);

export const formatPercent = (value: number) => {
  const signal = value > 0 ? '+' : '';
  return `${signal}${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
};

export const getDefaultBillingDateRange = (referenceDate = new Date()) => {
  const start = new Date(referenceDate.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0);

  const toInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: toInputValue(start),
    endDate: toInputValue(end),
  };
};

export const getTopAverageTicketClients = (summary: IBillingSummaryResponse | null, limit = 5) =>
  [...(summary?.topClients || [])]
    .filter((client) => client.cacambaCount > 0)
    .sort(
      (a, b) =>
        b.averageTicket - a.averageTicket ||
        b.revenue - a.revenue ||
        a.clientName.localeCompare(b.clientName, 'pt-BR'),
    )
    .slice(0, limit);
