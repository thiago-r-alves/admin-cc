import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
  }
};

test.describe('Fechamento', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'admin');
    await page.goto('/admin');
  });

  test('fluxo completo pendente -> NF pendente -> paga', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'webkit', 'Download no WebKit do CI pode ser inconsistente para jsPDF blob.');

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');

    await page.locator('#closure-payment-status').selectOption('pending');
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();
    await page.getByLabel('Selecionar para pagamento').first().check();

    await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('client-orders-download').click(),
    ]);

    await page.getByLabel('Fechar modal').click();

    await page.locator('#closure-payment-status').selectOption('invoice_pending');
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();

    await expect(page.getByTestId('closure-groups-list')).toBeVisible();
    await expect(page.getByText(/Grupo #\d+/).first()).toBeVisible();
    await expect(page.getByText('Detalhes da nota fiscal')).toBeVisible();
    await expect(page.getByText(/Valor total da nota:/i)).toBeVisible();
    await expect(page.getByText(/Pedido #/i)).toHaveCount(0);
    await page.getByTestId('closure-group-invoice-input').fill('NF-2026-001');
    await page.getByTestId('closure-group-save-invoice').click();
    await expect(page.getByTestId('invoice-feedback-modal')).toBeVisible();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByTestId('closure-group-save-invoice')).toHaveCount(0);

    await page.getByLabel('Fechar modal').click();

    await page.locator('#closure-payment-status').selectOption('paid');
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();
    await expect(page.getByTestId('closure-groups-list')).toBeVisible();
    await expect(page.getByText('Detalhes da nota fiscal')).toBeVisible();
    await expect(page.getByText(/Valor total da nota:/i)).toBeVisible();
    await expect(page.getByTestId('closure-group-save-invoice')).toHaveCount(0);
  });

  test('sem datas: troca de filtro e busca cliente dispara carregamento', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();

    await page.locator('#closure-payment-status').selectOption('all');
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();

    await page.locator('#closure-search').fill('PFF');
    await expect(page.getByText(/PFF INOVA/i).first()).toBeVisible();
  });
});
