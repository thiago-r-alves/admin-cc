import { expect, test, type Page } from '@playwright/test';
import { setupMockApi } from './support/mockApi';

test.describe('Autenticação', () => {
  const passwordInput = (page: Page) => page.locator('#password');

  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await page.goto('/');
  });

  test('faz login como admin e redireciona para /admin', async ({ page }) => {
    await page.getByLabel('Usuário').fill('admin');
    await passwordInput(page).fill('123456');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Pedidos Pendentes')).toBeVisible();
  });

  test('faz login como motorista e redireciona para /motorista', async ({ page }) => {
    await page.getByLabel('Usuário').fill('motorista');
    await passwordInput(page).fill('123456');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/motorista$/);
    await expect(page.getByText('Painel do Motorista')).toBeVisible();
  });

  test('mostra erro quando login falha', async ({ page }) => {
    await page.getByLabel('Usuário').fill('erro');
    await passwordInput(page).fill('123456');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Falha no login.')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('toggle de senha funciona', async ({ page }) => {
    const password = passwordInput(page);
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Mostrar senha|Ocultar senha/ }).click();
    await expect(password).toHaveAttribute('type', 'text');
  });
});
