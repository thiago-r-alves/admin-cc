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

  test('fluxo completo gera fechamento e salva NF no mesmo modal', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'webkit', 'Download no WebKit do CI pode ser inconsistente para jsPDF blob.');

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');

    await page.locator('#closure-payment-status').selectOption('pending');
    await expect(page.getByRole('button', { name: 'Gerar fechamento do cliente' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Gerar fechamento do cliente' }).first().click();
    await page.getByLabel('Selecionar para pagamento').first().check();

    await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('client-orders-download').click(),
    ]);

    await expect(page.getByText('Detalhes da nota fiscal')).toBeVisible();
    await expect(page.getByText(/Valor total da nota:/i)).toBeVisible();
    await expect(page.getByText(/Pedido #/i)).toHaveCount(0);
    await page.getByTestId('closure-group-invoice-input').fill('NF-2026-001');
    await page.getByTestId('closure-group-save-invoice').click();
    await expect(page.getByText(/grupo marcado como pago/i)).toHaveCount(0);
    await expect(page.getByTestId('closure-group-save-invoice')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /ver grupos anteriores/i })).toHaveCount(0);
    await expect(page.getByTestId('closure-groups-list')).toBeVisible();
    await expect(page.getByTestId('closure-group-download')).toBeVisible();
    await expect(page.getByTestId('closure-group-edit-invoice')).toBeVisible();
    await expect(page.getByTestId('closure-group-download')).toHaveCSS('background-color', 'rgb(227, 6, 19)');

    await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('closure-group-download').click(),
    ]);

    await page.getByTestId('closure-group-edit-invoice').click();
    await page.getByTestId('closure-group-invoice-input').fill('NF-2026-001-A');
    await page.getByTestId('closure-group-save-invoice').click();
    await expect(page.getByText(/nota fiscal atualizada com sucesso/i)).toBeVisible();
  });

  test('sem datas: troca de filtro e busca cliente dispara carregamento', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();

    await page.locator('#closure-payment-status').selectOption('all');
    await expect(
      page.getByRole('button', { name: 'Gerar fechamento do cliente' }).first(),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver notas geradas' }).first()).toBeVisible();

    await page.locator('#closure-search').fill('3GK');
    await expect(page.getByText(/3GK HOLDING/i).first()).toBeVisible();
  });

  test('consulta notas geradas sem entrar no fluxo de criação', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-payment-status').selectOption('all');

    await expect(page.getByRole('button', { name: 'Ver notas geradas' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver notas geradas' }).first().click();

    await expect(page.getByTestId('closure-groups-list')).toBeVisible();
    await expect(page.getByText('Detalhes da nota fiscal')).toBeVisible();
    await expect(page.getByText('NF atual: NF-EXIST-001')).toBeVisible();
    await expect(page.getByTestId('client-orders-download')).toHaveCount(0);
    await expect(page.getByLabel('Selecionar para pagamento')).toHaveCount(0);
  });
});
