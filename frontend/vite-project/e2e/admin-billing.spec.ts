import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Admin Billing', () => {
  const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime('2026-10-08T12:00:00-03:00');
    await setupMockApi(page);
    await seedSession(page, 'admin');
    await page.goto('/admin');
  });

  test('navega para faturamento e valida gráficos e rankings principais', async ({ page, isMobile }) => {
    const billingRequests: string[] = [];

    await page.route('**/billing/summary**', async (route) => {
      billingRequests.push(route.request().url());

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: {
            totalRevenue: 680,
            totalCacambas: 3,
            averageTicket: 226.67,
            activeClients: 2,
            previousPeriodRevenue: 100,
            revenueDeltaPercent: 580,
          },
          timeseries: Array.from({ length: 12 }, (_, index) => ({
            label: `${String(index + 1).padStart(2, '0')}/2026`,
            start: `2026-${String(index + 1).padStart(2, '0')}-01T00:00:00.000Z`,
            end: `2026-${String(index + 1).padStart(2, '0')}-28T23:59:59.999Z`,
            revenue: index === 4 ? 680 : 0,
            count: index === 4 ? 3 : 0,
          })),
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
        }),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Faturamento' }).click();

    await expect(page.getByRole('heading', { name: 'Faturamento', level: 1 })).toBeVisible();
    await expect(page.getByText('Faturamento total', { exact: true })).toBeVisible();
    await expect(page.getByText('Recorte analítico')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atualizar dados' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aplicar filtro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Limpar filtro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semestral' })).toHaveCount(0);
    const defaultStartDate = await page.locator('#billing-start-date').inputValue();
    const defaultEndDate = await page.locator('#billing-end-date').inputValue();
    const initialBillingCount = billingRequests.length;
    const initialAppliedSummary = await page.getByTestId('billing-applied-filters').textContent();
    await page.getByRole('button', { name: 'Mês anterior', exact: true }).click();
    await expect(page.locator('#billing-start-date')).toHaveValue('2026-09-01');
    await expect(page.locator('#billing-end-date')).toHaveValue('2026-09-30');
    expect(await page.getByTestId('billing-applied-filters').textContent()).toBe(initialAppliedSummary);
    expect(billingRequests).toHaveLength(initialBillingCount);
    await page.locator('#billing-start-date').fill('2026-05-01');
    await page.locator('#billing-end-date').fill('2026-05-31');
    await page.locator('#billing-city').selectOption('Jacareí');
    await page.locator('#billing-client').selectOption('cli-1');
    await page.locator('#billing-content-type').selectOption('Terra');
    await expect(page.getByText('Alterações não aplicadas')).toBeVisible();
    expect(billingRequests).toHaveLength(initialBillingCount);
    await page.getByRole('button', { name: 'Aplicar filtro' }).click();

    await expect
      .poll(() =>
        billingRequests.some((requestUrl) => {
          const params = new URL(requestUrl).searchParams;
          return (
            params.get('startDate') === '2026-05-01' &&
            params.get('endDate') === '2026-05-31' &&
            params.get('granularity') === 'monthly' &&
            params.get('city') === 'Jacareí' &&
            params.get('clientId') === 'cli-1' &&
            params.get('contentType') === 'Terra'
          );
        }),
      )
      .toBe(true);
    await expect(page.getByTestId('billing-applied-filters')).toContainText('01 de mai de 2026');
    await expect(page.getByTestId('billing-applied-filters')).toContainText('31 de mai de 2026');
    await expect(page.getByText('Alterações não aplicadas')).toHaveCount(0);

    const filteredBillingCount = billingRequests.length;
    await page.getByRole('button', { name: 'Limpar filtro' }).click();

    await expect(page.locator('#billing-start-date')).toHaveValue(defaultStartDate);
    await expect(page.locator('#billing-end-date')).toHaveValue(defaultEndDate);
    await expect(page.locator('#billing-city')).toHaveValue('');
    await expect(page.locator('#billing-client')).toHaveValue('');
    await expect(page.locator('#billing-content-type')).toHaveValue('');
    await expect
      .poll(() => {
        if (billingRequests.length <= filteredBillingCount) return false;
        const params = new URL(billingRequests[billingRequests.length - 1]).searchParams;
        return (
          params.get('startDate') === defaultStartDate &&
          params.get('endDate') === defaultEndDate &&
          params.get('granularity') === 'monthly' &&
          !params.has('city') &&
          !params.has('clientId') &&
          !params.has('contentType')
        );
      })
      .toBe(true);

    await expect(page.getByTestId('billing-trend-chart')).toBeVisible();
    await page.getByRole('button', { name: 'Ver detalhes de 05/2026', exact: true }).click();
    await expect(page.getByTestId('billing-month-details')).toContainText('05/2026');
    await expect(page.getByTestId('billing-month-details')).toContainText('680');
    await page.getByRole('button', { name: 'Tabela', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Tabela', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('table', { name: 'Faturamento por mês', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Gráfico', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Gráfico', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('heading', { name: 'Clientes com maior faturamento' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Maiores tickets médios' })).toBeVisible();
    if (!isMobile) {
      for (const title of [
        'Clientes com maior faturamento',
        'Maiores tickets médios',
        'Cidades com maior faturamento',
        'Tipos de conteúdo com maior faturamento',
      ]) {
        const rankingScroller = page.getByLabel(`Rolagem do ranking: ${title}`, { exact: true });
        expect(await rankingScroller.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
      }
    }
    await expect
      .poll(() =>
        page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
          return documentWidth <= document.documentElement.clientWidth + 1;
        }),
      )
      .toBe(true);

    const screenshotDirectory = process.env.BILLING_QA_DIR;
    if (screenshotDirectory) {
      const deviceName = isMobile ? 'mobile' : 'desktop';
      await page.getByTestId('billing-trend-chart').screenshot({
        path: path.join(screenshotDirectory, `faturamento-${deviceName}-grafico.png`),
        animations: 'disabled',
        scale: 'css',
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(screenshotDirectory, `faturamento-${deviceName}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await page.screenshot({
        path: path.join(screenshotDirectory, `faturamento-${deviceName}-viewport.png`),
        animations: 'disabled',
        scale: 'css',
      });
    }
  });

  test('faturamento mostra estado vazio quando não há dados para o período', async ({ page, isMobile }) => {
    await page.route('**/billing/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: {
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
        }),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Faturamento' }).click();

    await expect(page.getByTestId('billing-empty-state')).toBeVisible();
  });

  test('explora ranking completo com busca e ordenacao sem nova consulta', async ({ page, isMobile }) => {
    const clientNames = ['Zeta', 'Alpha', 'Gamma', 'Delta', 'Epsilon', 'Beta', 'Eta'];
    const clients = clientNames.map((name, index) => ({
      clientId: `billing-client-${index}`,
      clientName: `Cliente ${name}`,
      revenue: (7 - index) * 100,
      cacambaCount: index + 1,
      averageTicket: ((7 - index) * 100) / (index + 1),
    }));
    let billingRequests = 0;
    await page.route('**/billing/summary**', async (route) => {
      billingRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: {
            totalRevenue: 2800,
            totalCacambas: 28,
            averageTicket: 100,
            activeClients: 7,
            previousPeriodRevenue: 0,
            revenueDeltaPercent: 100,
          },
          timeseries: [{ label: '10/2026', start: '2026-10-01', end: '2026-10-31', revenue: 2800, count: 28 }],
          topClients: clients,
          topCities: [{ city: 'Jacareí', revenue: 2800, cacambaCount: 28 }],
          topContentTypes: [{ contentType: 'Terra', revenue: 2800, cacambaCount: 28 }],
          highlights: { topClientName: 'Cliente Zeta', topClientRevenue: 700, bestBucketLabel: '10/2026', bestBucketRevenue: 2800 },
        }),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Faturamento' }).click();
    await expect(page.getByText('Sem base anterior', { exact: true }).first()).toBeVisible();
    const rankingTable = page.getByRole('table', { name: 'Clientes com maior faturamento', exact: true });
    await expect(rankingTable.locator('tbody tr')).toHaveCount(5);
    const initialBillingCount = billingRequests;
    await page.getByRole('button', { name: 'Ver todos os 7 itens: Clientes com maior faturamento', exact: true }).click();
    await expect(rankingTable.locator('tbody tr')).toHaveCount(7);
    await page.getByLabel('Ordenar clientes por', { exact: true }).selectOption('count');
    await expect(rankingTable.locator('tbody tr').first()).toContainText('Cliente Eta');
    await page.getByLabel('Ordenar clientes por', { exact: true }).selectOption('name');
    await expect(rankingTable.locator('tbody tr').first()).toContainText('Cliente Alpha');
    await page.getByLabel('Buscar cliente no ranking', { exact: true }).fill('Gamma');
    await expect(rankingTable.locator('tbody tr')).toHaveCount(1);
    await expect(rankingTable.locator('tbody tr').first()).toContainText('Cliente Gamma');
    expect(billingRequests).toBe(initialBillingCount);
  });

  test('bloqueia recorte inválido preservando os indicadores aplicados', async ({ page, isMobile }) => {
    let billingRequests = 0;
    await page.route('**/billing/summary**', async (route) => {
      billingRequests += 1;
      await route.fallback();
    });
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Faturamento' }).click();
    await expect(page.getByText('Faturamento total', { exact: true })).toBeVisible();
    const appliedSummary = await page.getByTestId('billing-applied-filters').textContent();
    const initialRequestCount = billingRequests;

    await page.locator('#billing-start-date').fill('2026-05-31');
    await page.locator('#billing-end-date').fill('2026-05-01');
    await page.getByRole('button', { name: 'Aplicar filtro' }).click();
    await expect(page.getByText('A data inicial deve ser anterior ou igual à data final.')).toBeVisible();
    expect(billingRequests).toBe(initialRequestCount);
    expect(await page.getByTestId('billing-applied-filters').textContent()).toBe(appliedSummary);
    await page.locator('#billing-start-date').fill('');
    await page.getByRole('button', { name: 'Aplicar filtro' }).click();
    await expect(page.getByText('Informe a data inicial e a data final.')).toBeVisible();
    expect(billingRequests).toBe(initialRequestCount);
    await expect(page.getByText('Faturamento total', { exact: true })).toBeVisible();
  });
});
