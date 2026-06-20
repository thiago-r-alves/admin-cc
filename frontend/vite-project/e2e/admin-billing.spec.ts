import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Admin Billing', () => {
  const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
    }
  };

  test.beforeEach(async ({ page }) => {
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

    await expect(page.getByText('Recorte analítico')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aplicar filtro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Limpar filtro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semestral' })).toHaveCount(0);
    const defaultStartDate = await page.locator('#billing-start-date').inputValue();
    const defaultEndDate = await page.locator('#billing-end-date').inputValue();
    await page.locator('#billing-start-date').fill('2026-05-01');
    await page.locator('#billing-end-date').fill('2026-05-31');
    await page.locator('#billing-city').selectOption('Jacareí');
    await page.locator('#billing-client').selectOption('cli-1');
    await page.locator('#billing-content-type').selectOption('Terra');
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
    await expect(page.getByText('Clientes com maior faturamento')).toBeVisible();
    await expect(page.getByText('Maiores tickets médios')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
          return documentWidth <= document.documentElement.clientWidth + 1;
        }),
      )
      .toBe(true);
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
});
