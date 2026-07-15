import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
  }
};

test.describe('Admin correcao de cacambas', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'admin');
    await page.goto('/admin');
  });

  test('corrige cacamba pela aba pedidos', async ({ page }) => {
    await expect(page.getByText('#435')).toBeVisible();

    await page.getByRole('button', { name: 'Editar caçamba' }).first().click();
    await expect(page.getByText(/Editar Caçamba/)).toBeVisible();

    await page.getByPlaceholder('Ex: 501').fill('436');
    await page.locator('form').last().locator('select').nth(1).selectOption('Entulho limpo');
    await page.getByRole('button', { name: /Salvar/ }).click();

    await expect(page.getByText('#436', { exact: true })).toBeVisible();
    await expect(page.getByText('Caçamba #436 editada com sucesso.')).toBeVisible();
  });

  test('corrige cacamba pela aba acompanhamentos', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    const acompanhamentoCard = page.getByTestId('acompanhamento-card-cac-2');
    await expect(acompanhamentoCard.getByText('Caçamba #415')).toBeVisible();

    await page.getByTestId('acompanhamento-edit-cac-2').click();
    await expect(page.getByText(/Editar Caçamba/)).toBeVisible();

    await page.getByPlaceholder('Ex: 501').fill('436');
    await page.getByRole('button', { name: /Salvar/ }).click();

    await expect(page.getByTestId('acompanhamento-card-cac-2').getByText('Caçamba #436')).toBeVisible();
    await expect(page.getByText('Caçamba #436 editada com sucesso.')).toBeVisible();
  });
});
