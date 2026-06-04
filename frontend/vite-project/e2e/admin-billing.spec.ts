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
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Faturamento' }).click();

    await expect(page.getByRole('heading', { name: 'Faturamento', exact: true })).toBeVisible();
    await page.locator('#billing-start-date').fill('2026-05-01');
    await page.locator('#billing-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: 'Semestral' }).click();
    await page.getByRole('button', { name: 'Anual' }).click();

    await expect(page.getByTestId('billing-trend-chart')).toBeVisible();
    await expect(page.getByTestId('billing-breakdown-chart')).toBeVisible();
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
            paidRevenue: 0,
            pendingRevenue: 0,
            invoicePendingRevenue: 0,
            previousPeriodRevenue: 0,
            revenueDeltaPercent: 0,
          },
          timeseries: [],
          paymentBreakdown: [],
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
