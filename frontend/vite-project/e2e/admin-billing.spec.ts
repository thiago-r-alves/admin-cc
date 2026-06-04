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
    await page.route('**/billing/summary**', async (route) => {
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
        }),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Faturamento' }).click();

    await expect(page.getByText('Recorte analítico')).toBeVisible();
    await page.locator('#billing-start-date').fill('2026-05-01');
    await page.locator('#billing-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: 'Semestral' }).click();
    await page.getByRole('button', { name: 'Anual' }).click();

    await expect(page.getByTestId('billing-trend-chart')).toBeVisible();
    await expect(page.getByText('Clientes com maior faturamento')).toBeVisible();
    await expect(page.getByText('Maiores tickets médios')).toBeVisible();
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
