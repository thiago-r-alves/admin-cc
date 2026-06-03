import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
  }
};

test.describe('Admin acompanhamentos', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'admin');
    await page.goto('/admin');
  });

  test('exibe CPF/CNPJ e ação de exclusão no card de acompanhamento', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByRole('heading', { name: 'Acompanhamentos' })).toBeVisible();
    await expect(page.getByText('39.003.660/0001-61')).toBeVisible();
    await expect(page.getByTestId('acompanhamento-delete-cac-2')).toBeVisible();
  });

  test('exclui a caçamba do acompanhamento após confirmação', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByText('Caçamba #415')).toBeVisible();
    await page.getByTestId('acompanhamento-delete-cac-2').click();

    await expect(page.getByText('Excluir caçamba do acompanhamento')).toBeVisible();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();

    await expect(page.getByTestId('acompanhamento-delete-cac-2')).toHaveCount(0);
    await expect(page.getByText('Caçamba #415 excluída com sucesso.')).toBeVisible();
  });

  test('mantém a caçamba visível quando a exclusão falha', async ({ page, isMobile }) => {
    await page.route('**/cacambas/cac-2', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro ao excluir caçamba.' }),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByText('Caçamba #415')).toBeVisible();
    await page.getByTestId('acompanhamento-delete-cac-2').click();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();

    await expect(page.getByTestId('acompanhamento-delete-cac-2')).toBeVisible();
    await expect(page.getByText('Erro ao excluir caçamba.')).toBeVisible();
  });
});
