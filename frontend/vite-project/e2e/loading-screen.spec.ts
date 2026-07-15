import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const loadingStatus = (page: Page) => page.getByRole('status').filter({ hasText: 'Sistema carregando...' });

test.describe('Loading screen', () => {
  test('admin: exibe loading animado enquanto pedidos carregam', async ({ page }) => {
    await setupMockApi(page);
    await page.route('**/orders', async (route) => {
      if (route.request().method() === 'GET') {
        await delay(800);
      }
      await route.fallback();
    });
    await seedSession(page, 'admin');

    await page.goto('/admin');

    await expect(loadingStatus(page)).toBeVisible();
    await expect(page.getByText('Sistema carregando...')).toBeVisible();
    await expect(page.getByText('Estamos preparando os dados para você.')).toBeVisible();
    await expect(page.getByText('Pedidos Pendentes')).toBeVisible();
    await expect(loadingStatus(page)).toHaveCount(0);
  });

  test('clientes: abre aba e nao deixa loading preso apos listar', async ({ page, isMobile }) => {
    await setupMockApi(page);
    await page.route('**/clients**', async (route) => {
      if (route.request().method() === 'GET') {
        await delay(800);
      }
      await route.fallback();
    });
    await seedSession(page, 'admin');

    await page.goto('/admin');
    if (isMobile) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
    }
    await page.getByRole('button', { name: 'Clientes' }).click();

    await expect(page.getByText('Gerenciamento de Clientes')).toBeVisible();
    await expect(loadingStatus(page)).toHaveCount(0);
  });

  test('motorista: exibe loading contextual e remove após pedidos ativos', async ({ page }) => {
    await setupMockApi(page);
    await page.route('**/driver/orders', async (route) => {
      if (route.request().method() === 'GET') {
        await delay(800);
      }
      await route.fallback();
    });
    await seedSession(page, 'motorista');

    await page.goto('/motorista');

    await expect(loadingStatus(page)).toBeVisible();
    await expect(page.getByText('Sistema carregando...')).toBeVisible();
    await expect(page.getByText('Estamos carregando os pedidos para você.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pedidos Ativos' })).toBeVisible();
    await expect(loadingStatus(page)).toHaveCount(0);
  });
});
