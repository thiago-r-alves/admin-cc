import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Admin change client', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'admin');
    await page.goto('/admin');
  });

  const openMenuIfMobile = async (page: Page) => {
    const menuButton = page.getByRole('button', { name: 'Abrir menu' });
    if (await menuButton.count()) {
      await menuButton.click();
    }
  };

  test('corrige cliente de pedido concluído e transfere fechamento pago para o novo cliente', async ({ page }) => {
    await page.getByRole('button', { name: 'jhonatan' }).click();
    const completedCard = page.locator('div').filter({ hasText: '#2234' }).first();
    await expect(completedCard.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toBeVisible();

    await completedCard.getByRole('button', { name: 'Corrigir Cliente' }).click();
    await expect(page.getByTestId('change-order-client-modal')).toBeVisible();

    const clientInput = page.locator('#change-order-client-select');
    await clientInput.click();
    await clientInput.fill('PFF');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Confirmar correção' }).click();

    await expect(page.getByText(/Cliente corrigido com sucesso/i)).toBeVisible();
    await expect(completedCard.getByText('PFF INOVA IND E COM DE MAQ OBRA 1')).toBeVisible();

    await openMenuIfMobile(page);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-10');
    await page.locator('#closure-end-date').fill('2026-05-19');
    await page.locator('#closure-payment-status').selectOption('paid');
    await page.locator('#closure-search').fill('PFF');
    await expect(page.getByText('PFF INOVA IND E COM DE MAQ OBRA 1')).toBeVisible();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toHaveCount(0);
  });

  test('mantém modal aberto quando corrigir cliente falha', async ({ page }) => {
    await page.route('**/orders/*/change-client', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao corrigir cliente (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: 'jhonatan' }).click();
    const completedCard = page.locator('div').filter({ hasText: '#2234' }).first();
    await completedCard.getByRole('button', { name: 'Corrigir Cliente' }).click();
    await expect(page.getByTestId('change-order-client-modal')).toBeVisible();

    const clientInput = page.locator('#change-order-client-select');
    await clientInput.click();
    await clientInput.fill('PFF');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Confirmar correção' }).click();

    await expect(page.getByText('Erro ao corrigir cliente (teste).')).toBeVisible();
    await expect(page.getByTestId('change-order-client-modal')).toBeVisible();
  });
});
