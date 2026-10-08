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

const toInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type BillingDatePreset = 'current-month' | 'previous-month' | 'last-three-months' | 'current-year';

export const getBillingDatePreset = (preset: BillingDatePreset, referenceDate = new Date()) => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const end = preset === 'previous-month'
    ? new Date(year, month, 0)
    : new Date(year, month, referenceDate.getDate());
  const start = preset === 'current-month'
    ? new Date(year, month, 1)
    : preset === 'previous-month'
      ? new Date(year, month - 1, 1)
      : preset === 'last-three-months'
        ? new Date(year, month - 2, 1)
        : new Date(year, 0, 1);

  return {
    startDate: toInputValue(start),
    endDate: toInputValue(end),
  };
};

export const getDefaultBillingDateRange = (referenceDate = new Date()) =>
  getBillingDatePreset('current-year', referenceDate);

export const formatBillingDateRange = (startDate: string, endDate: string) => {
  const formatDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).replace(/\./g, '');
  };
  return `${formatDate(startDate)} a ${formatDate(endDate)}`;
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
