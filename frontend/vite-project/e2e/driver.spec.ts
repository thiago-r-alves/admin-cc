import { expect, test } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Motorista', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'motorista');
    await page.goto('/motorista');
  });

  test('renderiza pedidos ativos sem preco de admin', async ({ page }) => {
    await expect(page.getByText('Painel do Motorista')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pedidos Ativos' })).toBeVisible();
    await expect(page.getByText('#2231')).toBeVisible();
    await expect(page.getByText(/R\$/)).toHaveCount(0);
  });

  test('abre modal de registrar cacamba com badge do tipo', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Adicionar Caçamba/i }).first().click();
    await expect(page.getByText(/Registrar Ca.*amba/i)).toBeVisible();
    await expect(page.getByText(/Dados da Ca.*amba/i)).toBeVisible();
    await expect(page.locator('form').getByText(/Retirada|Entrega/).last()).toBeVisible();
    await expect(page.locator('#cacamba-numero')).toHaveValue('');
    await expect(page.locator('#cacamba-numero').locator('option')).toHaveCount(4);
    await expect(page.locator('#cacamba-numero').locator('option').nth(1)).toHaveText('435 - entregue em 14/05/2026');
    await expect(page.locator('#cacamba-numero')).not.toContainText(/pedido #/i);
  });

  test('exibe acao de concluir pedido quando ha pelo menos uma cacamba', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Concluir Pedido' })).toBeVisible();
  });

  test('imagem ampliada da cacamba cabe na tela', async ({ page }) => {
    await page.getByAltText('Foto da caçamba').first().click();

    const expandedImage = page.getByRole('img', { name: 'Imagem ampliada' });
    await expect(expandedImage).toBeVisible();

    const bounds = await expandedImage.evaluate((image) => {
      const rect = image.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    });

    expect(bounds.width).toBeLessThanOrEqual(bounds.viewportWidth - 32 + 1);
    expect(bounds.height).toBeLessThanOrEqual(bounds.viewportHeight - 32 + 1);

    await expandedImage.click();
    await expect(expandedImage).toBeVisible();
  });

  test('oculta concluir pedido quando nao ha cacamba', async ({ page }) => {
    const emptyCard = page.locator('article', { hasText: '#2232' }).first();
    await expect(emptyCard).toBeVisible();
    await expect(emptyCard.getByRole('button', { name: 'Concluir Pedido' })).toHaveCount(0);
  });

  test('registra cacamba com sucesso', async ({ page }) => {
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

  test('numero da cacamba aceita somente tres digitos', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /\+ Adicionar Caçamba/i }).click();

    const numeroInput = page.locator('#cacamba-numero');
    await numeroInput.fill('12a');
    await expect(numeroInput).toHaveValue('12');
    await numeroInput.fill('1234');
    await expect(numeroInput).toHaveValue('123');

    let postCount = 0;
    await page.route('**/driver/orders/*/cacambas', async (route) => {
      if (route.request().method() === 'POST') postCount += 1;
      await route.fallback();
    });

    await numeroInput.fill('12');
    await page.locator('#cacamba-os').fill('123');
    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByRole('alert')).toHaveText('Número da caçamba deve conter exatamente 3 dígitos.');
    expect(postCount).toBe(0);
  });

  test('valida erro ao registrar cacamba sem imagem', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /\+ Adicionar Caçamba/i }).click();

    await page.locator('#cacamba-numero').fill('555');
    await page.locator('#cacamba-os').fill('555');
    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByText(/Imagem.*obrigat.ria/i)).toBeVisible();
  });

  test('exibe o motivo retornado pela API quando a cacamba nao pode ser registrada', async ({ page }) => {
    await page.route('**/driver/orders/*/cacambas', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'A caçamba 777 já está entregue para Cliente B no pedido #2040. Faça a retirada dessa caçamba antes de lançar uma nova entrega.',
        }),
      });
    });

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

    await expect(page.getByRole('alert')).toContainText('já está entregue para Cliente B');
    await expect(page.getByText(/Registrar Ca.*amba/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar' })).toBeEnabled();
  });

  test('retirada exige tipo de conteudo no cadastro de cacamba', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: /\+ Adicionar Caçamba/i }).click();

    let postCount = 0;
    await page.route('**/driver/orders/*/cacambas', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
      }
      await route.fallback();
    });

    await page.locator('#cacamba-numero').selectOption('556');
    await page.locator('#cacamba-os').fill('556');
    await page.locator('#cacamba-imagem').setInputFiles({
      name: 'cacamba.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await page.getByRole('button', { name: 'Registrar' }).click();

    expect(postCount).toBe(0);
  });

  test('edita e exclui cacamba', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Editar' }).first().click();

    await page.locator('input').first().fill('436');
    await page.locator('label', { hasText: 'Tipo de conteúdo' }).locator('xpath=following::select[1]').selectOption('Entulho limpo');
    await page.getByRole('button', { name: /Salvar/i }).click();
    await expect(card.getByText('#436')).toBeVisible();

    await card.getByRole('button', { name: 'Excluir' }).first().click();
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(card.getByText('#436')).toHaveCount(0);
  });

  test('conclui pedido e remove da lista de ativos', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Concluir Pedido' }).click();
    await page.getByRole('button', { name: 'Concluir' }).last().click();
    await expect(page.locator('article', { hasText: '#2231' })).toHaveCount(0);
  });

  test('mantem pedido ativo quando concluir falha (500)', async ({ page }) => {
    await page.route('**/driver/orders/*/complete', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha ao concluir (teste).' }),
      });
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Concluir Pedido' }).click();
    await page.getByRole('button', { name: 'Concluir' }).last().click();
    await expect(page.locator('article', { hasText: '#2231' })).toHaveCount(1);
  });

  test('mantem cacamba quando exclusao falha (500)', async ({ page }) => {
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
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(card.getByText('#435')).toBeVisible();
  });

  test('mantem dados da cacamba quando edicao falha (500)', async ({ page }) => {
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

  test('logout limpa sessao e volta para login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: 'Sair' }).last().click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  });

  test('ver rota abre google maps com endereco do pedido', async ({ page }) => {
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
