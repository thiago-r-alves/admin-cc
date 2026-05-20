import { expect, test } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByText('Sistema carregando...')).toBeVisible();
    await expect(page.getByText('Estamos preparando os dados para você.')).toBeVisible();
    await expect(page.getByText('Pedidos Pendentes')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
  });

  test('clientes: exibe loading ao abrir aba e remove após listar', async ({ page, isMobile }) => {
    await setupMockApi(page);
    await page.route('**/clients', async (route) => {
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

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByText('Sistema carregando...')).toBeVisible();
    await expect(page.getByText('Gerenciamento de Clientes')).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
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

    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByText('Sistema carregando...')).toBeVisible();
    await expect(page.getByText('Estamos carregando os pedidos para você.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pedidos Ativos' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
  });
});

