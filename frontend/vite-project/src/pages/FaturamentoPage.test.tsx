import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FaturamentoPage from './FaturamentoPage';
import type { IBillingSummaryResponse } from '../interfaces';

const summaryFixture: IBillingSummaryResponse = {
  summary: {
    totalRevenue: 680,
    totalCacambas: 3,
    averageTicket: 226.67,
    activeClients: 2,
    previousPeriodRevenue: 100,
    revenueDeltaPercent: 580,
  },
  timeseries: [
    {
      label: '05/2026',
      start: '2026-05-01T00:00:00.000Z',
      end: '2026-05-31T23:59:59.999Z',
      revenue: 680,
      count: 3,
    },
  ],
  topClients: [
    {
      clientId: 'cli-1',
      clientName: 'Cliente Faturamento A',
      revenue: 380,
      cacambaCount: 2,
      averageTicket: 190,
    },
    {
      clientId: 'cli-2',
      clientName: 'Cliente Faturamento B',
      revenue: 300,
      cacambaCount: 1,
      averageTicket: 300,
    },
  ],
  topCities: [
    { city: 'Jacarei', revenue: 380, cacambaCount: 2 },
    { city: 'Sao Jose dos Campos', revenue: 300, cacambaCount: 1 },
  ],
  topContentTypes: [
    { contentType: 'Terra', revenue: 380, cacambaCount: 2 },
    { contentType: 'Entulho limpo', revenue: 300, cacambaCount: 1 },
  ],
  highlights: {
    topClientName: 'Cliente Faturamento A',
    topClientRevenue: 380,
    bestBucketLabel: '05/2026',
    bestBucketRevenue: 680,
  },
};

const buildJsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => body,
  } as Response);

describe('FaturamentoPage', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
  });

  it('renderiza KPIs sem exibir o seletor de granularidade', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') && !url.includes('/billing/summary')) {
        return buildJsonResponse([{ _id: 'cli-1', clientName: 'Cliente Faturamento A' }]);
      }
      if (url.includes('/cities')) {
        return buildJsonResponse([{ _id: 'city-1', name: 'Jacarei' }]);
      }
      return buildJsonResponse(summaryFixture);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);

    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 680,00').length).toBeGreaterThan(0);
    expect(screen.getByTestId('billing-trend-chart')).toBeInTheDocument();
    expect(screen.getByText('Clientes com maior faturamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar filtro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpar filtro' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mensal' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Semestral' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Anual' })).not.toBeInTheDocument();
  });

  it('envia filtros selecionados na query de faturamento ao aplicar', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') && !url.includes('/billing/summary')) {
        return buildJsonResponse([
          { _id: 'cli-1', clientName: 'Cliente Faturamento A' },
          { _id: 'cli-2', clientName: 'Cliente Faturamento B' },
        ]);
      }
      if (url.includes('/cities')) {
        return buildJsonResponse([{ _id: 'city-1', name: 'Jacareí' }]);
      }
      return buildJsonResponse(summaryFixture);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);

    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Jacareí' })).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Data inicial') as HTMLInputElement;
    const endDateInput = screen.getByLabelText('Data final') as HTMLInputElement;
    const citySelect = screen.getByLabelText('Cidade') as HTMLSelectElement;
    const clientSelect = screen.getByLabelText('Cliente') as HTMLSelectElement;
    const contentTypeSelect = screen.getByLabelText('Tipo de conteúdo') as HTMLSelectElement;
    const defaultStartDate = startDateInput.value;
    const defaultEndDate = endDateInput.value;
    const billingUrls = () => fetchMock.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes('/billing/summary'));
    const initialBillingCount = billingUrls().length;

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-05-31' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Jacareí' } });
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'cli-1' } });
    fireEvent.change(screen.getByLabelText('Tipo de conteúdo'), { target: { value: 'Terra' } });

    expect(billingUrls()).toHaveLength(initialBillingCount);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));

    await waitFor(() => {
      expect(
        billingUrls().some((url) => {
          const params = new URL(url, 'http://local.test').searchParams;
          return (
            params.get('startDate') === '2026-05-01' &&
            params.get('endDate') === '2026-05-31' &&
            params.get('granularity') === 'monthly' &&
            params.get('city') === 'Jacareí' &&
            params.get('clientId') === 'cli-1' &&
            params.get('contentType') === 'Terra'
          );
        }),
      ).toBe(true);
    });

    const filteredBillingCount = billingUrls().length;
    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtro' }));

    expect(startDateInput.value).toBe(defaultStartDate);
    expect(endDateInput.value).toBe(defaultEndDate);
    expect(citySelect.value).toBe('');
    expect(clientSelect.value).toBe('');
    expect(contentTypeSelect.value).toBe('');

    await waitFor(() => {
      const currentBillingUrls = billingUrls();
      expect(currentBillingUrls.length).toBeGreaterThan(filteredBillingCount);
      const params = new URL(currentBillingUrls[currentBillingUrls.length - 1] || '', 'http://local.test').searchParams;
      expect(params.get('startDate')).toBe(defaultStartDate);
      expect(params.get('endDate')).toBe(defaultEndDate);
      expect(params.get('granularity')).toBe('monthly');
      expect(params.has('city')).toBe(false);
      expect(params.has('clientId')).toBe(false);
      expect(params.has('contentType')).toBe(false);
    });
  });

  it('mostra estado vazio quando o resumo não retorna faturamento', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') && !url.includes('/billing/summary')) {
        return buildJsonResponse([]);
      }
      if (url.includes('/cities')) {
        return buildJsonResponse([]);
      }
      return buildJsonResponse({
        ...summaryFixture,
        summary: {
          ...summaryFixture.summary,
          totalRevenue: 0,
          totalCacambas: 0,
          averageTicket: 0,
          activeClients: 0,
          previousPeriodRevenue: 0,
          revenueDeltaPercent: 0,
        },
        timeseries: [],
        topClients: [],
        topCities: [],
        topContentTypes: [],
        highlights: {
          topClientName: '',
          topClientRevenue: 0,
          bestBucketLabel: '',
          bestBucketRevenue: 0,
        },
      } satisfies IBillingSummaryResponse);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);

    expect(await screen.findByTestId('billing-empty-state')).toBeInTheDocument();
  });

  it('mostra erro quando a API de faturamento falha', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') && !url.includes('/billing/summary')) {
        return buildJsonResponse([]);
      }
      if (url.includes('/cities')) {
        return buildJsonResponse([]);
      }
      return buildJsonResponse({ message: 'Falha ao carregar faturamento.' }, false);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);

    expect(await screen.findByText('Falha ao carregar faturamento.')).toBeInTheDocument();
  });
});
