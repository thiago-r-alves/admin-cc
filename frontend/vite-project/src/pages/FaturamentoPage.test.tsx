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

  it('renderiza KPIs e alterna granularidade sem perder os filtros', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Semestral' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([url]) => String(url).includes('granularity=semiannual')),
      ).toBe(true);
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
