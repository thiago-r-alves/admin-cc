import { expect, test } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Motorista', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'motorista');
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.goto('/motorista');
  });

  test('renderiza pedidos ativos sem preço de admin', async ({ page }) => {
    await expect(page.getByText('Painel do Motorista')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pedidos Ativos' })).toBeVisible();
    await expect(page.getByText('#2231')).toBeVisible();
    await expect(page.getByText(/R\$/)).toHaveCount(0);
  });

  test('abre modal de registrar caçamba com badge do tipo', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Adicionar Caçamba/i }).first().click();
    await expect(page.getByText('Registrar Caçamba')).toBeVisible();
    await expect(page.getByText('Dados da Caçamba')).toBeVisible();
    await expect(page.locator('form').getByText(/Retirada|Entrega/).last()).toBeVisible();
  });

  test('exibe ação de concluir pedido quando há pelo menos uma caçamba', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Concluir Pedido' })).toBeVisible();
  });

  test('oculta concluir pedido quando não há caçamba', async ({ page }) => {
    const emptyCard = page.locator('article', { hasText: '#2232' }).first();
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard.getByRole('button', { name: 'Concluir Pedido' })).toHaveCount(0);
  });

  test('registra caçamba com sucesso', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /\+ Adicionar Caçamba/i }).click();

    await page.locator('#cacamba-numero').fill('777');
    await page.locator('#cacamba-os').fill('777');
    await page.locator('#cacamba-imagem').setInputFiles({
      name: 'cacamba.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(card.getByText('#999')).toBeVisible();
  });

  test('valida erro ao registrar caçamba sem imagem', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /\+ Adicionar Caçamba/i }).click();

    await page.locator('#cacamba-numero').fill('555');
    await page.locator('#cacamba-os').fill('555');
    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByText('Imagem é obrigatória')).toBeVisible();
  });

  test('edita e exclui caçamba', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Editar' }).first().click();

    await page.locator('input').first().fill('436');
    await page.locator('label', { hasText: 'Tipo de conteúdo' }).locator('xpath=following::select[1]').selectOption('Entulho limpo');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(card.getByText('#436')).toBeVisible();

    await card.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(card.getByText('#436')).toHaveCount(0);
  });

  test('conclui pedido e remove da lista de ativos', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Concluir Pedido' }).click();
    await expect(page.locator('article', { hasText: '#2231' })).toHaveCount(0);
  });

  test('mantém pedido ativo quando concluir falha (500)', async ({ page }) => {
    await page.route('**/driver/orders/*/complete', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha ao concluir (teste).' }),
      });
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Concluir Pedido' }).click();
    await expect(page.locator('article', { hasText: '#2231' })).toHaveCount(1);
  });

  test('mantém caçamba quando exclusão falha (500)', async ({ page }) => {
    await page.route('**/cacambas/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falha ao excluir caçamba (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await expect(card.getByText('#435')).toBeVisible();
    await card.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(card.getByText('#435')).toBeVisible();
  });

  test('mantém dados da caçamba quando edição falha (500)', async ({ page }) => {
    await page.route('**/cacambas/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falha ao editar caçamba (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await expect(card.getByText('#435')).toBeVisible();
    await card.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('input').first().fill('999');
    await page.locator('label', { hasText: 'Tipo de conteúdo' }).locator('xpath=following::select[1]').selectOption('Entulho limpo');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(card.getByText('#435')).toBeVisible();
    await expect(card.getByText('#999')).toHaveCount(0);
  });

  test('logout limpa sessão e volta para login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  });

  test('ver rota abre Google Maps com endereço do pedido', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__openedUrls = [];
      window.open = ((url?: string | URL | undefined) => {
        (window as any).__openedUrls.push(String(url ?? ''));
        return null;
      }) as typeof window.open;
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Ver rota' }).click();

    const opened = await page.evaluate(() => (window as any).__openedUrls as string[]);
    expect(opened.length).toBeGreaterThan(0);
    expect(opened[0]).toContain('google.com/maps/dir/?api=1');
    expect(opened[0]).toContain('Rua%20Januaria');
  });
});
