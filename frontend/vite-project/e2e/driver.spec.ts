import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

declare global {
  interface Window {
    __openedUrls?: string[];
  }
}

const tinyPngFile = {
  name: 'cacamba.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
    'base64',
  ),
};

const addCacambaToDeliveryOrder = async (page: Page) => {
  const card = page.locator('article', { hasText: '#2232' }).first();
  await card.getByRole('button', { name: /Registrar entrega/i }).click();
  await page.locator('#cacamba-numero').fill('777');
  await page.locator('#cacamba-imagem').setInputFiles(tinyPngFile);
  await submitCacambaRegistration(page);
  await expect(card.getByText('#999')).toBeVisible();
  return card;
};

const drawSignature = async (page: Page) => {
  const signature = page.getByLabel('Área de assinatura pelo recebimento da locação');
  const box = await signature.boundingBox();
  if (!box) throw new Error('Área de assinatura não encontrada.');
  await page.mouse.move(box.x + 24, box.y + 48);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 92);
  await page.mouse.move(box.x + 260, box.y + 58);
  await page.mouse.up();
};

const cacambaDialog = (page: Page) => page.getByRole('dialog', { name: /Registrar Ca.*amba/i });

const submitCacambaRegistration = async (page: Page) => {
  await cacambaDialog(page).getByRole('button', { name: 'Registrar', exact: true }).click();
};

const proofDialog = (page: Page) => page.getByRole('dialog', { name: 'Comprovante da locação' });

const submitSignedProof = async (page: Page) => {
  await proofDialog(page).getByRole('button', { name: 'Concluir pedido', exact: true }).click();
};

test.describe('Motorista', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await setupMockApi(page, { enableReusableProof: testInfo.title.includes('reutiliza automaticamente') });
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
    await page.getByRole('button', { name: /Registrar (entrega|retirada)/i }).first().click();
    await expect(page.getByText(/Registrar Ca.*amba/i)).toBeVisible();
    await expect(page.getByText(/Dados da Ca.*amba/i)).toBeVisible();
    await expect(page.locator('form').getByText(/Retirada|Entrega/).last()).toBeVisible();
    await expect(page.locator('#cacamba-numero')).toHaveValue('');
    await expect(page.locator('#cacamba-numero').locator('option')).toHaveCount(4);
    await expect(page.locator('#cacamba-numero').locator('option').nth(1)).toHaveText('435 - entregue em 14/05/2026');
    await expect(page.locator('#cacamba-numero')).not.toContainText(/pedido #/i);
  });

  test('exibe acao de concluir pedido quando ha pelo menos uma cacamba', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Concluir pedido' })).toBeVisible();
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
    await expect(emptyCard.getByRole('button', { name: 'Concluir pedido' })).toHaveCount(0);
  });

  test('registra cacamba com sucesso', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /Registrar entrega/i }).click();

    await page.locator('#cacamba-numero').fill('777');
    await page.locator('#cacamba-imagem').setInputFiles(tinyPngFile);
    await submitCacambaRegistration(page);

    await expect(card.getByText('#999')).toBeVisible();
  });

  test('numero da cacamba aceita somente tres digitos', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /Registrar entrega/i }).click();

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
    await expect(cacambaDialog(page).getByRole('button', { name: 'Registrar', exact: true })).toBeDisabled();

    expect(postCount).toBe(0);
  });

  test('valida erro ao registrar cacamba sem imagem', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2232' }).first();
    await card.getByRole('button', { name: /Registrar entrega/i }).click();

    await page.locator('#cacamba-numero').fill('555');
    await expect(cacambaDialog(page).getByRole('button', { name: 'Registrar', exact: true })).toBeDisabled();

    await expect(page.getByText(/Imagem.*obrigat.ria/i)).toHaveCount(0);
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
    await card.getByRole('button', { name: /Registrar entrega/i }).click();
    await page.locator('#cacamba-numero').fill('777');
    await page.locator('#cacamba-imagem').setInputFiles({
      name: 'cacamba.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await submitCacambaRegistration(page);

    await expect(page.getByRole('alert')).toContainText('já está entregue para Cliente B');
    await expect(page.getByText(/Registrar Ca.*amba/i)).toBeVisible();
    await expect(cacambaDialog(page).getByRole('button', { name: 'Registrar', exact: true })).toBeEnabled();
  });

  test('retirada exige tipo de conteudo no cadastro de cacamba', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: /Registrar retirada/i }).click();

    let postCount = 0;
    await page.route('**/driver/orders/*/cacambas', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
      }
      await route.fallback();
    });

    await page.locator('#cacamba-numero').selectOption('556');
    await page.locator('#cacamba-imagem').setInputFiles({
      name: 'cacamba.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
        'base64',
      ),
    });
    await expect(cacambaDialog(page).getByRole('button', { name: 'Registrar', exact: true })).toBeDisabled();

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

  test('conclui retirada com assinatura e remove da lista de ativos', async ({ page }) => {
    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Concluir pedido' }).click();
    await expect(proofDialog(page)).toBeVisible();
    await drawSignature(page);
    await submitSignedProof(page);
    await expect(page.locator('article', { hasText: '#2231' })).toHaveCount(0);
  });

  test('conclui entrega com assinatura digital', async ({ page }) => {
    const card = await addCacambaToDeliveryOrder(page);
    await card.getByRole('button', { name: 'Concluir pedido' }).click();

    await expect(proofDialog(page)).toBeVisible();
    await drawSignature(page);

    await submitSignedProof(page);
    await expect(page.locator('article', { hasText: '#2232' })).toHaveCount(0);
    await expect(page.getByText('Pedido concluído com comprovante digital.')).toBeVisible();
  });

  test('reutiliza automaticamente a primeira assinatura na troca do mesmo cliente e obra', async ({ page }) => {
    const deliveryCard = await addCacambaToDeliveryOrder(page);
    await deliveryCard.getByRole('button', { name: 'Concluir pedido' }).click();

    await expect(proofDialog(page)).toHaveCount(0);
    await expect(page.locator('article', { hasText: '#2232' })).toHaveCount(0);
    await expect(page.getByText('Pedido concluído com o comprovante coletado anteriormente nesta obra.')).toBeVisible();
  });

  test('conclui entrega sem responsável no local', async ({ page }) => {
    const card = await addCacambaToDeliveryOrder(page);
    await card.getByRole('button', { name: 'Concluir pedido' }).click();

    await page.getByRole('button', { name: 'Sem responsável' }).click();
    await page.getByLabel('Confirmo que não havia responsável no local.').check();
    await page.getByLabel('Observação').fill('Portaria fechada.');
    await proofDialog(page).getByRole('button', { name: 'Concluir sem responsável' }).click();

    await expect(page.locator('article', { hasText: '#2232' })).toHaveCount(0);
    await expect(page.getByText('Pedido concluído com comprovante digital.')).toBeVisible();
  });

  test('valida comprovante antes de concluir entrega', async ({ page }) => {
    const card = await addCacambaToDeliveryOrder(page);
    let completeCount = 0;
    page.on('request', (request) => {
      const body = request.postData() || '';
      if (request.url().includes('/driver/orders/ord-3/complete') && request.method() === 'PATCH' && body.includes('"proof"')) {
        completeCount += 1;
      }
    });

    await card.getByRole('button', { name: 'Concluir pedido' }).click();
    await submitSignedProof(page);
    await expect(page.getByRole('alert')).toHaveText('Colete a assinatura pelo recebimento da locação.');
    expect(completeCount).toBe(0);
  });

  test('mantem pedido ativo quando concluir falha (500)', async ({ page }) => {
    await page.route('**/driver/orders/*/complete', async (route) => {
      const body = route.request().postData() || '';
      if (!body.includes('"proof"')) {
        await route.fulfill({
          status: 428,
          contentType: 'application/json',
          body: JSON.stringify({ requiresProof: true }),
        });
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Falha ao concluir (teste).' }),
      });
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Concluir pedido' }).click();
    await drawSignature(page);
    await submitSignedProof(page);
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
    const confirmDialog = page.getByRole('dialog', { name: 'Sair do sistema' });
    await expect(confirmDialog).toBeVisible();
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/', { timeout: 15000 }),
      confirmDialog.getByRole('button', { name: 'Sair' }).click(),
    ]);
  });

  test('ver rota abre google maps com endereco do pedido', async ({ page }) => {
    await page.evaluate(() => {
      window.__openedUrls = [];
      window.open = ((url?: string | URL | undefined) => {
        window.__openedUrls?.push(String(url ?? ''));
        return null;
      }) as typeof window.open;
    });

    const card = page.locator('article', { hasText: '#2231' }).first();
    await card.getByRole('button', { name: 'Abrir no Maps' }).click();

    const opened = await page.evaluate(() => window.__openedUrls ?? []);
    expect(opened.length).toBeGreaterThan(0);
    expect(opened[0]).toContain('google.com/maps/dir/?api=1');
    expect(opened[0]).toContain('Rua%20Januaria');
  });
});
