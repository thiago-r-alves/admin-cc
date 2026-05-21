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
    await page.goto('/admin');
  });

  test('renderiza pedidos e permite abrir modal de novo pedido', async ({ page }) => {
    await expect(page.getByText('Pedidos Pendentes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Baixar Pedido' }).first()).toBeVisible();
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

  test('navega para fechamento e abre modal com perÃ­odo aplicado', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await expect(page.getByRole('heading', { name: 'Fechamento' })).toBeVisible();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: 'Aplicar Filtro' }).click();
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();

    await expect(page.getByText(/Total do cliente \(Retiradas\)/i)).toBeVisible();
    await expect(page.getByText(/Pedidos de/i)).toBeVisible();
  });

  test('modal de pedidos do fechamento mostra motorista, placa e resumo expandido', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: 'Aplicar Filtro' }).click();
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();

    await expect(page.getByText(/Total do cliente \(Retiradas\)/i)).toBeVisible();
    await expect(page.getByText(/Motorista/i).first()).toBeVisible();
    await expect(page.getByText(/adalberto/i).first()).toBeVisible();
    await expect(page.getByText(/Placa do caminh/i).first()).toBeVisible();
  });

  test('modal de pedidos do fechamento permite baixar pdf consolidado', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'webkit', 'Download no WebKit do CI pode ser inconsistente para jsPDF blob.');
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: 'Aplicar Filtro' }).click();
    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('client-orders-modal').getByTestId('client-orders-download').click(),
    ]);
    const filename = download.suggestedFilename();
    expect(filename).toContain('relatorio_pedidos_');
    expect(filename).toContain('3GK_HOLDING_E_PARTICIPACOES_OBRA_1');
  });

  test('navega para motoristas e exibe lista', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Motoristas' }).click();
    await expect(page.getByText('Gerenciar Motoristas')).toBeVisible();
    await expect(page.getByText('adalberto')).toBeVisible();
    await expect(page.getByRole('button', { name: /\+ Adicionar Motorista/i })).toBeVisible();
  });

  test('aba acompanhamentos mostra apenas caçambas pendentes de retirada e campos principais', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByRole('heading', { name: 'Acompanhamentos' })).toBeVisible();
    await expect(page.getByText('Caçamba #415')).toBeVisible();
    await expect(page.getByText('Caçamba #435')).toHaveCount(0);
    await expect(page.getByText('Caçamba #777')).toHaveCount(0);

    await expect(page.getByText('Placa do caminhão').first()).toBeVisible();
    await expect(page.getByText('ABC1D23').first()).toBeVisible();
    await expect(page.getByText('Motorista', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('adalberto').first()).toBeVisible();
    await expect(page.getByText('Contato', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('SR SAMIIR - (12) 98195-6675').first()).toBeVisible();
  });

  test('aba acompanhamentos respeita último evento por número e ordena pela última entrega mais recente', async ({ page, isMobile }) => {
    const mockOrders = [
      {
        _id: 'ord-ac-1',
        orderNumber: 6001,
        clientId: 'cli-1',
        clientName: 'Cliente A',
        cnpjCpf: '',
        city: 'Cidade',
        cep: '11111-111',
        contactName: 'Contato A',
        contactNumber: '(11) 99999-1111',
        neighborhood: 'Bairro A',
        address: 'Rua A',
        addressNumber: '1',
        placa: 'AAA1A11',
        type: 'entrega',
        priority: 0,
        status: 'pendente',
        motorista: { _id: 'drv-1', username: 'adalberto' },
        cacambas: [
          { _id: 'cac-ac-120-ret', numero: '120', tipo: 'retirada', local: 'via_publica', orderId: 'ord-ac-1', createdAt: '2026-05-16T09:00:00.000Z' },
          { _id: 'cac-ac-120-ent', numero: '120', tipo: 'entrega', local: 'via_publica', orderId: 'ord-ac-1', createdAt: '2026-05-16T12:00:00.000Z' },
        ],
        imageUrls: [],
        createdAt: '2026-05-16T08:00:00.000Z',
        updatedAt: '2026-05-16T12:00:00.000Z',
      },
      {
        _id: 'ord-ac-2',
        orderNumber: 6002,
        clientId: 'cli-1',
        clientName: 'Cliente B',
        cnpjCpf: '',
        city: 'Cidade',
        cep: '22222-222',
        contactName: 'Contato B',
        contactNumber: '(11) 99999-2222',
        neighborhood: 'Bairro B',
        address: 'Rua B',
        addressNumber: '2',
        placa: 'BBB2B22',
        type: 'retirada',
        priority: 0,
        status: 'concluido',
        motorista: { _id: 'drv-1', username: 'adalberto' },
        cacambas: [
          { _id: 'cac-ac-99-ent', numero: '99', tipo: 'entrega', local: 'canteiro_obra', orderId: 'ord-ac-2', createdAt: '2026-05-16T10:00:00.000Z' },
          { _id: 'cac-ac-99-ret', numero: '99', tipo: 'retirada', local: 'via_publica', orderId: 'ord-ac-2', createdAt: '2026-05-16T11:00:00.000Z' },
        ],
        imageUrls: [],
        createdAt: '2026-05-16T09:00:00.000Z',
        updatedAt: '2026-05-16T11:00:00.000Z',
      },
      {
        _id: 'ord-ac-3',
        orderNumber: 6003,
        clientId: 'cli-1',
        clientName: 'Cliente C',
        cnpjCpf: '',
        city: 'Cidade',
        cep: '33333-333',
        contactName: 'Contato C',
        contactNumber: '(11) 99999-3333',
        neighborhood: 'Bairro C',
        address: 'Rua C',
        addressNumber: '3',
        placa: '',
        type: 'entrega',
        priority: 0,
        status: 'em_andamento',
        motorista: { _id: 'drv-1', username: 'adalberto' },
        cacambas: [
          { _id: 'cac-ac-7-ent', numero: '7', tipo: 'entrega', local: 'via_publica', orderId: 'ord-ac-3', createdAt: '2026-05-16T13:00:00.000Z' },
        ],
        imageUrls: [],
        createdAt: '2026-05-16T09:00:00.000Z',
        updatedAt: '2026-05-16T13:00:00.000Z',
      },
    ];

    await page.route('**/orders', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockOrders),
        });
        return;
      }
      await route.fallback();
    });

    await page.reload();
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByText('Caçamba #120')).toBeVisible();
    await expect(page.getByText('Caçamba #7')).toBeVisible();
    await expect(page.getByText('Caçamba #99')).toHaveCount(0);

    const headers = await page.getByText(/Caçamba #\d+/).allTextContents();
    expect(headers.slice(0, 2)).toEqual(['Caçamba #7', 'Caçamba #120']);
  });

  test('reatribui motorista e mantÃ©m pedido acessÃ­vel no novo filtro', async ({ page }) => {
    const firstOrderNumber = (await page.getByText(/#\d+/).first().innerText()).trim();
    const reassignSelect = page.locator('select').first();
    const patchOrder = page.waitForResponse(
      (r) => /\/orders\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await Promise.all([
      patchOrder,
      reassignSelect.selectOption('drv-2'),
    ]);

    await page.getByRole('button', { name: 'jhonatan' }).click();
    await expect(page.getByText(firstOrderNumber)).toBeVisible();
  });

  test('exclui pedido pendente', async ({ page }) => {
    await page.getByRole('button', { name: 'adalberto' }).click();
    await expect(page.getByText('#2231')).toBeVisible();

    const pendingCountBefore = await page.locator('article').filter({ hasText: '#2231' }).count();
    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await expect(page.locator('article').filter({ hasText: '#2231' })).toHaveCount(Math.max(0, pendingCountBefore - 1));
  });

  test('aciona baixar pedido em concluÃ­dos', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Baixar Pedido' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Baixar Pedido' }).first().click();
    await expect(page.getByRole('button', { name: 'Baixar Pedido' }).first()).toBeVisible();
  });

  test('mostra erro ao falhar criaÃ§Ã£o de pedido', async ({ page }) => {
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

  test('mostra erro 400 ao validar criaÃ§Ã£o de pedido', async ({ page }) => {
    await page.route('**/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Dados obrigatÃ³rios invÃ¡lidos (teste).' }),
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

    await expect(page.getByText('Dados obrigatÃ³rios invÃ¡lidos (teste).')).toBeVisible();
  });

  test('mostra erro 400 ao falhar reatribuiÃ§Ã£o de motorista', async ({ page }) => {
    await page.route('**/orders/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Motorista invÃ¡lido (teste).' }),
        });
        return;
      }
      await route.fallback();
    });

    const orderCard = page.locator('div', { hasText: '#2231' }).first();
    await orderCard.locator('select').first().selectOption('drv-2');
    await expect(page.getByText('Motorista invÃ¡lido (teste).')).toBeVisible();
  });

  test('mostra erro ao falhar reatribuiÃ§Ã£o de motorista', async ({ page }) => {
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

    const orderCard = page.locator('div', { hasText: '#2231' }).first();
    await orderCard.locator('select').first().selectOption('drv-2');
    await expect(page.getByText('Erro ao reatribuir (teste).')).toBeVisible();
  });

  test('mostra erro ao falhar exclusÃ£o de pedido', async ({ page }) => {
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

    await expect(page.getByText('#2231')).toBeVisible();
    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(page.getByText('Erro ao excluir pedido (teste).')).toBeVisible();
    await expect(page.getByText('#2231')).toBeVisible();
  });

  test('cria cliente, edita e exclui', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await page.getByRole('button', { name: /\+ Adicionar Cliente/i }).click();

    await page.locator('#clientName').fill('CLIENTE E2E');
    await page.locator('#address').fill('Rua Teste');
    await page.locator('#neighborhood').fill('Centro');
    await page.locator('#city').selectOption({ index: 2 });
    await page.locator('#contactName').fill('Contato E2E');
    await page.locator('#contactNumber').fill('(12) 99999-9999');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByText('CLIENTE E2E')).toBeVisible();

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#clientName').fill('CLIENTE E2E EDITADO');
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.getByText('CLIENTE E2E EDITADO')).toBeVisible();

    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(page.getByText('CLIENTE E2E EDITADO')).toHaveCount(0);
  });

  test('filtra clientes por busca textual', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Clientes' }).click();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toBeVisible();

    await page.getByTestId('clients-search-input').fill('PFF INOVA');

    await expect(page.getByText('PFF INOVA IND E COM DE MAQ OBRA 1')).toBeVisible();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toHaveCount(0);
  });

  test('filtra clientes na aba fechamento por período aplicado', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-16');
    await page.locator('#closure-end-date').fill('2026-05-16');
    await page.getByRole('button', { name: 'Aplicar Filtro' }).click();
    await expect(page.getByText('Nenhum cliente com retirada concluída encontrado no período selecionado.')).toBeVisible();
  });

  test('fechamento: cliente listado sempre abre modal com retirada concluÃ­da', async ({ page, isMobile }) => {
    await page.route('**/clients?**closure=true**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'cli-katu',
            clientName: 'Katu ParticipaÃ§Ãµes Ltda OBRA 1',
            cnpjCpf: '',
            contactName: 'Contato',
            contactNumber: '(12) 99999-9999',
            address: 'Rua A',
            addressNumber: '100',
            neighborhood: 'Centro',
            city: 'JacareÃ­',
            cep: '12345-000',
          },
        ]),
      });
    });

    await page.route('**/clients/cli-katu/orders?**closure=true**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'ord-katu-1',
            orderNumber: 4001,
            clientId: 'cli-katu',
            clientName: 'Katu ParticipaÃ§Ãµes Ltda OBRA 1',
            cnpjCpf: '',
            city: 'JacareÃ­',
            cep: '12345-000',
            contactName: 'Contato',
            contactNumber: '(12) 99999-9999',
            neighborhood: 'Centro',
            address: 'Rua A',
            addressNumber: '100',
            placa: 'ABC1D23',
            type: 'retirada',
            priority: 0,
            status: 'concluido',
            motorista: { _id: 'drv-1', username: 'adalberto' },
            cacambas: [],
            imageUrls: [],
            createdAt: '2026-05-16T08:00:00.000Z',
            updatedAt: '2026-05-16T12:00:00.000Z',
          },
        ]),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await expect(page.getByRole('heading', { name: 'Fechamento' })).toBeVisible();

    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: 'Aplicar Filtro' }).click();

    await expect(page.getByRole('button', { name: 'Ver pedidos' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Ver pedidos' }).first().click();

    await expect(page.getByText('Pedido #4001')).toBeVisible();
    await expect(page.getByText('Quantidade total de pedidos: 1')).toBeVisible();
    await expect(page.getByText('Nenhum pedido encontrado para os filtros selecionados.')).toHaveCount(0);
  });

  test('nÃ£o envia criaÃ§Ã£o de cliente sem campos obrigatÃ³rios', async ({ page, isMobile }) => {
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

  test('mantÃ©m cliente quando criaÃ§Ã£o falha (500)', async ({ page, isMobile }) => {
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
    await page.locator('#city').selectOption({ index: 2 });
    await page.locator('#contactName').fill('Contato');
    await page.locator('#contactNumber').fill('(12) 99999-9999');
    await page.getByRole('button', { name: 'Cadastrar' }).click();

    await expect(page.getByText('CLIENTE COM ERRO')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Gerenciamento de Clientes' }).first()).toBeVisible();
  });

  test('mantÃ©m cliente quando ediÃ§Ã£o falha (500)', async ({ page, isMobile }) => {
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

  test('mantÃ©m cliente quando exclusÃ£o falha (500)', async ({ page, isMobile }) => {
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
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(page.getByText('motorista-e2e-editado')).toHaveCount(0);
  });

  test('nÃ£o envia criaÃ§Ã£o de motorista sem campos obrigatÃ³rios', async ({ page, isMobile }) => {
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

  test('mostra erro ao falhar criaÃ§Ã£o de motorista (500)', async ({ page, isMobile }) => {
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

    await page.locator('#driver-username').fill('motorista-erro');
    await page.locator('#driver-password').fill('123456');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.getByText('Erro ao cadastrar motorista (teste).')).toBeVisible();
  });

  test('mostra erro ao falhar ediÃ§Ã£o de motorista (500)', async ({ page, isMobile }) => {
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

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.locator('#driver-username').fill('driver-erro');
    await page.getByRole('button', { name: 'Atualizar' }).click();
    await expect(page.getByText('Erro ao atualizar motorista (teste).')).toBeVisible();
  });

  test('mostra erro ao falhar exclusÃ£o de motorista (500)', async ({ page, isMobile }) => {
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

    await page.getByRole('button', { name: 'Excluir' }).first().click();
    await page.getByRole('button', { name: 'Excluir' }).last().click();
    await expect(page.getByText('Erro ao excluir motorista (teste).')).toBeVisible();
  });

  test('logout limpa sessÃ£o e volta para login', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('button', { name: 'Sair' }).last().click();
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

