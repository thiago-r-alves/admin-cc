import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Admin', () => {
  const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
    }
  };

  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await seedSession(page, 'admin');
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await page.goto('/admin');
  });

  test('renderiza pedidos e permite abrir modal de novo pedido', async ({ page }) => {
    await expect(page.getByText('Pedidos Pendentes')).toBeVisible();
    await expect(page.getByText('Concluídos')).toBeVisible();
    await expect(page.getByText('#2231')).toBeVisible();
    await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();
    await expect(page.getByText('Novo Pedido')).toBeVisible();
    await expect(page.getByText('Buscar Cliente (Autocomplete)')).toBeVisible();
  });

  test('cria pedido com submit completo', async ({ page }) => {
    await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();

    const clientInput = page.locator('input[id^="react-select-"]').first();
    await expect(clientInput).toBeVisible();
    await clientInput.click();
    await clientInput.fill('3GK');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Nome do Cliente')).toBeVisible();

    await page
      .locator('label', { hasText: 'Placa' })
      .locator('xpath=following::select[1]')
      .selectOption('fto2e29');
    await page
      .locator('label', { hasText: 'Atribuir Motorista' })
      .locator('xpath=following::select[1]')
      .selectOption('drv-1');

    const orderPost = page.waitForResponse(
      (r) => r.url().includes('/orders') && r.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await Promise.all([
      orderPost,
      page.getByRole('button', { name: 'Criar Pedido' }).click(),
    ]);

    await expect(page.getByRole('button', { name: 'Criar Pedido' })).toHaveCount(0);
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1').first()).toBeVisible();
  });

  test('navega para clientes, abre modal de pedidos e aplica filtro', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await expect(page.getByText('Gerenciamento de Clientes')).toBeVisible();
    await page.locator('button', { hasText: /^Pedidos$/ }).nth(1).click();

    await expect(page.getByRole('button', { name: 'Fechar modal' })).toBeVisible();
    await expect(page.getByText('Data Inicial')).toBeVisible();
    await expect(page.getByText('Tipo')).toBeVisible();
    await page.locator('#orders-type').selectOption('retirada');
    await expect(page.getByText('Pedido #1500')).toHaveCount(0);

    await page.getByRole('button', { name: 'Fechar modal' }).click();
    await expect(page.getByText(/Pedidos de/i)).toHaveCount(0);
  });

  test('navega para motoristas e exibe lista', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();
    await expect(page.getByText('Gerenciar Motoristas')).toBeVisible();
    await expect(page.getByText('adalberto')).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Adicionar Motorista/i })).toBeVisible();
  });

  test('reatribui motorista e mantém pedido acessível no novo filtro', async ({ page }) => {
    await expect(page.getByText('#2231')).toBeVisible();
    const orderCard = page.locator('div', { hasText: '#2231' }).first();
    await orderCard.locator('select').first().selectOption('drv-2');

    await page.getByRole('button', { name: 'jhonatan' }).click();
    await expect(page.getByText('#2231')).toBeVisible();
  });

  test('exclui pedido pendente', async ({ page }) => {
    await expect(page.getByText('#2231')).toBeVisible();
    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(page.getByText('#2231')).toHaveCount(0);
  });

  test('aciona baixar pedido em concluídos', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Baixar Pedido' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Baixar Pedido' }).first().click();
    await expect(page.getByText('Concluídos')).toBeVisible();
  });

  test('mostra erro ao falhar criação de pedido', async ({ page }) => {
    await page.route('**/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Falha ao criar pedido (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();
    const clientInput = page.locator('input[id^="react-select-"]').first();
    await clientInput.click();
    await clientInput.fill('3GK');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Nome do Cliente')).toBeVisible();

    await page
      .locator('label', { hasText: 'Placa' })
      .locator('xpath=following::select[1]')
      .selectOption('fto2e29');
    await page
      .locator('label', { hasText: 'Atribuir Motorista' })
      .locator('xpath=following::select[1]')
      .selectOption('drv-1');
    await page.getByRole('button', { name: 'Criar Pedido' }).click();

    await expect(page.getByText('Falha ao criar pedido (teste).')).toBeVisible();
  });

  test('mostra erro 400 ao validar criação de pedido', async ({ page }) => {
    await page.route('**/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Dados obrigatórios inválidos (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();
    const clientInput = page.locator('input[id^="react-select-"]').first();
    await clientInput.click();
    await clientInput.fill('3GK');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Nome do Cliente')).toBeVisible();
    await page
      .locator('label', { hasText: 'Placa' })
      .locator('xpath=following::select[1]')
      .selectOption('fto2e29');
    await page
      .locator('label', { hasText: 'Atribuir Motorista' })
      .locator('xpath=following::select[1]')
      .selectOption('drv-1');
    await page.getByRole('button', { name: 'Criar Pedido' }).click();

    await expect(page.getByText('Dados obrigatórios inválidos (teste).')).toBeVisible();
  });

  test('mostra alerta 400 ao falhar reatribuição de motorista', async ({ page }) => {
    await page.route('**/orders/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Motorista inválido (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      (window as any).__alerts = [];
      window.alert = ((message?: string) => {
        (window as any).__alerts.push(String(message ?? ''));
      }) as typeof window.alert;
    });

    const orderCard = page.locator('div', { hasText: '#2231' }).first();
    await orderCard.locator('select').first().selectOption('drv-2');
    await expect
      .poll(async () => page.evaluate(() => ((window as any).__alerts as string[]).join(' | ')))
      .toContain('Motorista inválido (teste).');
  });

  test('mostra alerta ao falhar reatribuição de motorista', async ({ page }) => {
    await page.route('**/orders/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao reatribuir (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      (window as any).__alerts = [];
      window.alert = ((message?: string) => {
        (window as any).__alerts.push(String(message ?? ''));
      }) as typeof window.alert;
    });

    const orderCard = page.locator('div', { hasText: '#2231' }).first();
    await orderCard.locator('select').first().selectOption('drv-2');
    await expect
      .poll(async () =>
        page.evaluate(() => ((window as any).__alerts as string[]).join(' | ')),
      )
      .toContain('Erro ao reatribuir (teste).');
  });

  test('mostra alerta ao falhar exclusão de pedido', async ({ page }) => {
    await page.route('**/orders/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao excluir pedido (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      (window as any).__alerts = [];
      window.alert = ((message?: string) => {
        (window as any).__alerts.push(String(message ?? ''));
      }) as typeof window.alert;
    });

    await expect(page.getByText('#2231')).toBeVisible();
    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect
      .poll(async () =>
        page.evaluate(() => ((window as any).__alerts as string[]).join(' | ')),
      )
      .toContain('Erro ao excluir pedido (teste).');
    await expect(page.getByText('#2231')).toBeVisible();
  });

  test('cria cliente, edita e exclui', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await page.getByRole('button', { name: /\+ Adicionar Cliente/i }).click();

    await page.locator('#clientName').fill('CLIENTE E2E');
    await page.locator('#address').fill('Rua Teste');
    await page.locator('#neighborhood').fill('Centro');
    await page.locator('#city').selectOption({ label: 'Jacareí' });
    await page.locator('#contactName').fill('Contato E2E');
    await page.locator('#contactNumber').fill('(12) 99999-9999');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByText('CLIENTE E2E')).toBeVisible();

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#clientName').fill('CLIENTE E2E EDITADO');
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.getByText('CLIENTE E2E EDITADO')).toBeVisible();

    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(page.getByText('CLIENTE E2E EDITADO')).toHaveCount(0);
  });

  test('filtra clientes por busca textual', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toBeVisible();

    await page
      .getByPlaceholder('Buscar cliente por nome, CNPJ/CPF, endereço, bairro, cidade, CEP...')
      .fill('PFF INOVA');

    await expect(page.getByText('PFF INOVA IND E COM DE MAQ OBRA 1')).toBeVisible();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toHaveCount(0);
  });

  test('não envia criação de cliente sem campos obrigatórios', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await page.getByRole('button', { name: /\+ Adicionar Cliente/i }).click();

    let postCount = 0;
    await page.route('**/clients', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.getByRole('heading', { name: 'Gerenciamento de Clientes' }).first()).toBeVisible();
    expect(postCount).toBe(0);
  });

  test('mantém cliente quando criação falha (500)', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();

    await page.route('**/clients', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao criar cliente (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: /\+ Adicionar Cliente/i }).click();
    await page.locator('#clientName').fill('CLIENTE COM ERRO');
    await page.locator('#address').fill('Rua Teste');
    await page.locator('#neighborhood').fill('Centro');
    await page.locator('#city').selectOption({ label: 'Jacareí' });
    await page.locator('#contactName').fill('Contato');
    await page.locator('#contactNumber').fill('(12) 99999-9999');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByText('CLIENTE COM ERRO')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Gerenciamento de Clientes' }).first()).toBeVisible();
  });

  test('mantém cliente quando edição falha (500)', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();

    await page.route('**/clients/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao atualizar cliente (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#clientName').fill('CLIENTE NAO DEVE SALVAR');
    await page.getByRole('button', { name: 'Atualizar' }).click();

    await expect(page.getByText('CLIENTE NAO DEVE SALVAR')).toHaveCount(0);
  });

  test('mantém cliente quando exclusão falha (500)', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toBeVisible();

    await page.route('**/clients/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao excluir cliente (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toBeVisible();
  });

  test('cria motorista, edita e exclui', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();
    await page.getByRole('button', { name: /\+ Adicionar Motorista/i }).click();

    await page.locator('#driver-username').fill('motorista-e2e');
    await page.locator('#driver-password').fill('123456');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.getByText('motorista-e2e')).toBeVisible();

    await page.getByRole('button', { name: 'Editar' }).last().click();
    await page.locator('#driver-username').fill('motorista-e2e-editado');
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.getByText('motorista-e2e-editado')).toBeVisible();

    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(page.getByText('motorista-e2e-editado')).toHaveCount(0);
  });

  test('não envia criação de motorista sem campos obrigatórios', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();
    await page.getByRole('button', { name: /\+ Adicionar Motorista/i }).click();

    let postCount = 0;
    await page.route('**/drivers', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: 'Cadastrar' }).click();
    expect(postCount).toBe(0);
  });

  test('mostra alerta ao falhar criação de motorista (500)', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();
    await page.getByRole('button', { name: /\+ Adicionar Motorista/i }).click();

    await page.route('**/drivers', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao cadastrar motorista (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      (window as any).__alerts = [];
      window.alert = ((message?: string) => {
        (window as any).__alerts.push(String(message ?? ''));
      }) as typeof window.alert;
    });

    await page.locator('#driver-username').fill('motorista-erro');
    await page.locator('#driver-password').fill('123456');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect
      .poll(async () => page.evaluate(() => ((window as any).__alerts as string[]).join(' | ')))
      .toContain('Erro ao cadastrar motorista (teste).');
  });

  test('mostra alerta ao falhar edição de motorista (500)', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();

    await page.route('**/drivers/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao atualizar motorista (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      (window as any).__alerts = [];
      window.alert = ((message?: string) => {
        (window as any).__alerts.push(String(message ?? ''));
      }) as typeof window.alert;
    });

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#driver-username').fill('driver-erro');
    await page.getByRole('button', { name: 'Atualizar' }).click();

    await expect
      .poll(async () => page.evaluate(() => ((window as any).__alerts as string[]).join(' | ')))
      .toContain('Erro ao atualizar motorista (teste).');
  });

  test('mostra alerta ao falhar exclusão de motorista (500)', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();

    await page.route('**/drivers/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Erro ao excluir motorista (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    await page.evaluate(() => {
      (window as any).__alerts = [];
      window.alert = ((message?: string) => {
        (window as any).__alerts.push(String(message ?? ''));
      }) as typeof window.alert;
    });

    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect
      .poll(async () => page.evaluate(() => ((window as any).__alerts as string[]).join(' | ')))
      .toContain('Erro ao excluir motorista (teste).');
  });

  test('logout limpa sessão e volta para login', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('mobile: abre menu gaveta e navega de pedidos para clientes', async ({ page, isMobile }) => {
    if (!isMobile) {
      return;
    }
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('button', { name: 'Clientes' }).click();
    await expect(page.getByText('Gerenciamento de Clientes')).toBeVisible();
  });
});
