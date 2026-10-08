import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    vi.useRealTimers();
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
    expect(screen.getByRole('heading', { name: 'Faturamento', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar dados' })).toBeInTheDocument();
    expect(screen.getAllByText('R$ 680,00').length).toBeGreaterThan(0);
    expect(screen.getByTestId('billing-trend-chart')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clientes com maior faturamento' })).toBeInTheDocument();
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
    expect(screen.getByText('Alterações não aplicadas')).toBeInTheDocument();

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

    expect(screen.queryByText('Alterações não aplicadas')).not.toBeInTheDocument();
    expect(screen.getByTestId('billing-applied-filters')).toHaveTextContent('01 de mai de 2026');
    expect(screen.getByTestId('billing-applied-filters')).toHaveTextContent('31 de mai de 2026');

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

  it('atualiza somente o recorte aplicado e mantém os indicadores enquanto aguarda a API', async () => {
    let summaryRequests = 0;
    let resolveRefresh: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients')) return buildJsonResponse([]);
      if (url.includes('/cities')) return buildJsonResponse([]);
      summaryRequests += 1;
      if (summaryRequests === 1) return buildJsonResponse(summaryFixture);
      return new Promise<Response>((resolve) => { resolveRefresh = resolve; });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);
    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    const appliedStartDate = (screen.getByLabelText('Data inicial') as HTMLInputElement).value;
    const appliedEndDate = (screen.getByLabelText('Data final') as HTMLInputElement).value;
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-05-31' } });
    expect(screen.getByText('Alterações não aplicadas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar dados' }));

    await waitFor(() => expect(summaryRequests).toBe(2));
    expect(screen.getByText('Atualizando indicadores de faturamento...').closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText('Faturamento total')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 680,00').length).toBeGreaterThan(0);
    const requestUrl = String(fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0]);
    const params = new URL(requestUrl, 'http://local.test').searchParams;
    expect(params.get('startDate')).toBe(appliedStartDate);
    expect(params.get('endDate')).toBe(appliedEndDate);
    expect(params.get('granularity')).toBe('monthly');

    await act(async () => {
      resolveRefresh(await buildJsonResponse({
        ...summaryFixture,
        summary: { ...summaryFixture.summary, totalRevenue: 900 },
      }));
    });
    expect((await screen.findAllByText('R$ 900,00')).length).toBeGreaterThan(0);
    expect(screen.getByText('Alterações não aplicadas')).toBeInTheDocument();
  });

  it('altera datas pelos atalhos sem consultar ou mudar o recorte aplicado', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T12:00:00'));
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') || url.includes('/cities')) return buildJsonResponse([]);
      return buildJsonResponse(summaryFixture);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);
    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    const appliedSummary = screen.getByTestId('billing-applied-filters').textContent;
    const initialRequestCount = fetchMock.mock.calls.filter(([url]) => String(url).includes('/billing/summary')).length;
    const startInput = screen.getByLabelText('Data inicial') as HTMLInputElement;
    const endInput = screen.getByLabelText('Data final') as HTMLInputElement;
    const shortcuts = [
      ['Este mês', '2026-10-01', '2026-10-08'],
      ['Mês anterior', '2026-09-01', '2026-09-30'],
      ['Últimos 3 meses', '2026-08-01', '2026-10-08'],
      ['Este ano', '2026-01-01', '2026-10-08'],
    ];

    for (const [label, expectedStart, expectedEnd] of shortcuts) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(startInput.value).toBe(expectedStart);
      expect(endInput.value).toBe(expectedEnd);
      expect(screen.getByTestId('billing-applied-filters').textContent).toBe(appliedSummary);
      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/billing/summary'))).toHaveLength(initialRequestCount);
    }
    expect(screen.queryByText('Alterações não aplicadas')).not.toBeInTheDocument();
  });

  it.each([
    ['', '2026-05-31', 'Informe a data inicial e a data final.'],
    ['2026-05-01', '', 'Informe a data inicial e a data final.'],
    ['2026-05-31', '2026-05-01', 'A data inicial deve ser anterior ou igual à data final.'],
  ])('valida datas %s a %s sem enviar nova consulta', async (startDate, endDate, message) => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') || url.includes('/cities')) return buildJsonResponse([]);
      return buildJsonResponse(summaryFixture);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);
    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    const appliedSummary = screen.getByTestId('billing-applied-filters').textContent;
    const initialRequestCount = fetchMock.mock.calls.filter(([url]) => String(url).includes('/billing/summary')).length;
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: startDate } });
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: endDate } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/billing/summary'))).toHaveLength(initialRequestCount);
    expect(screen.getByTestId('billing-applied-filters').textContent).toBe(appliedSummary);
    expect(screen.getByText('Faturamento total')).toBeInTheDocument();
  });

  it('mantém o último resumo quando uma atualização falha', async () => {
    let summaryRequests = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') || url.includes('/cities')) return buildJsonResponse([]);
      summaryRequests += 1;
      return summaryRequests === 1
        ? buildJsonResponse(summaryFixture)
        : buildJsonResponse({ message: 'Falha ao atualizar faturamento.' }, false);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);
    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar dados' }));

    expect(await screen.findByText('Falha ao atualizar faturamento.')).toBeInTheDocument();
    expect(screen.getByText('Faturamento total')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 680,00').length).toBeGreaterThan(0);
  });

  it('mantém o recorte do último resumo durante uma consulta nova que falha', async () => {
    let summaryRequests = 0;
    let resolveRequest: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/clients') || url.includes('/cities')) return buildJsonResponse([]);
      summaryRequests += 1;
      if (summaryRequests === 1) return buildJsonResponse(summaryFixture);
      return new Promise<Response>((resolve) => { resolveRequest = resolve; });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FaturamentoPage />);
    expect(await screen.findByText('Faturamento total')).toBeInTheDocument();
    const appliedSummary = screen.getByTestId('billing-applied-filters').textContent;
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2026-05-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtro' }));

    await waitFor(() => expect(summaryRequests).toBe(2));
    expect(screen.getByTestId('billing-applied-filters').textContent).toBe(appliedSummary);
    expect(screen.getByText('Faturamento total')).toBeInTheDocument();
    await act(async () => {
      resolveRequest(await buildJsonResponse({ message: 'Não foi possível aplicar esse recorte.' }, false));
    });
    expect(await screen.findByText('Não foi possível aplicar esse recorte.')).toBeInTheDocument();
    expect(screen.getByTestId('billing-applied-filters').textContent).toBe(appliedSummary);
    expect(screen.getByText('Alterações não aplicadas')).toBeInTheDocument();
    expect(screen.getByText('Faturamento total')).toBeInTheDocument();
  });
});
