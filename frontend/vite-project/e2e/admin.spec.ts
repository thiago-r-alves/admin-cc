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
    await expect(page.getByText('#2231')).toBeVisible();
    await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();
    await expect(page.getByText('Novo Pedido')).toBeVisible();
    await expect(page.getByText('Buscar Cliente (Autocomplete)')).toBeVisible();
  });

  test('corrige tipo e motorista de pedido pendente sem cacambas', async ({ page }) => {
    await expect(page.getByText('Reatribuir motorista')).toHaveCount(0);

    const blockedCard = page.getByTestId('order-card-ord-1');
    await expect(blockedCard.getByRole('button', { name: 'Corrigir Pedido' })).toBeDisabled();

    const editableCard = page.getByTestId('order-card-ord-3');
    await editableCard.getByRole('button', { name: 'Corrigir Pedido' }).click();

    await expect(page.getByTestId('correct-order-modal')).toBeVisible();
    await page.locator('#correct-order-type').selectOption('retirada');
    await page.locator('#correct-order-cacamba-price').fill('180');
    await page.locator('#correct-order-driver').selectOption('drv-2');

    const correctionPatch = page.waitForResponse(
      (response) => response.url().includes('/orders/ord-3/correction') && response.request().method() === 'PATCH',
      { timeout: 15_000 },
    );
    await Promise.all([
      correctionPatch,
      page.getByRole('button', { name: 'Salvar correção' }).click(),
    ]);

    await expect(page.getByTestId('correct-order-modal')).toHaveCount(0);
    await expect(page.getByText('Pedido corrigido com sucesso.')).toBeVisible();
  });

  test('cria pedido com submit completo', async ({ page }) => {
    let orderPostCount = 0;
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.endsWith('/orders') && request.method() === 'POST') {
        orderPostCount += 1;
      }
    });

    await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();

    const clientInput = page.locator('input[id^="react-select-"]').first();
    await expect(clientInput).toBeVisible();
    await clientInput.click();
    await clientInput.fill('3GK');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Nome do Cliente')).toBeVisible();

    const serviceTypeGroup = page.getByRole('radiogroup', { name: 'Tipo de Serviço' });
    const deliveryOption = serviceTypeGroup.getByRole('radio', { name: /Entrega/i });
    const pickupOption = serviceTypeGroup.getByRole('radio', { name: /Retirada/i });
    await expect(deliveryOption).toHaveAttribute('aria-checked', 'false');
    await expect(pickupOption).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('Valor da Caçamba (R$)')).toHaveCount(0);

    await page
      .locator('label', { hasText: 'Placa' })
      .locator('xpath=following::select[1]')
      .selectOption('fto2e29');
    await page
      .locator('label', { hasText: 'Atribuir Motorista' })
      .locator('xpath=following::select[1]')
      .selectOption('drv-1');

    await page.getByRole('button', { name: 'Criar Pedido' }).click();
    await expect(page.getByText('Selecione Entrega ou Retirada para continuar.')).toBeVisible();
    expect(orderPostCount).toBe(0);

    await pickupOption.click();
    await expect(pickupOption).toHaveAttribute('aria-checked', 'true');
    await page
      .locator('label', { hasText: 'Valor da Caçamba (R$)' })
      .locator('xpath=following::input[1]')
      .fill('180');

    const orderPost = page.waitForResponse(
      (response) => response.url().includes('/orders') && response.request().method() === 'POST',
      { timeout: 15_000 },
    );
    await Promise.all([
      orderPost,
      page.getByRole('button', { name: 'Criar Pedido' }).click(),
    ]);

    await expect(page.getByRole('button', { name: 'Criar Pedido' })).toHaveCount(0);
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1').first()).toBeVisible();
  });

  test('navega para fechamento e abre modal com periodo aplicado', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await expect(page.getByRole('heading', { name: 'Fechamento' })).toBeVisible();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await expect(page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first().click();

    await expect(page.getByText(/Total do cliente \(Retiradas\)/i)).toBeVisible();
    await expect(page.getByText(/Pedidos de/i)).toBeVisible();
  });

  test('modal de pedidos do fechamento mostra resumo e selecao de cacambas', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await expect(page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first().click();

    await expect(page.getByText(/Total do cliente \(Retiradas\)/i)).toBeVisible();
    await expect(page.getByText(/Selecionar para pagamento/i).first()).toBeVisible();
  });

  test('no fechamento nao permite selecionar pagamento para cacamba sem valor e exibe aviso', async ({ page, isMobile }) => {
    await page.route('**/clients/cli-1/orders**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'ord-fech-sem-valor',
            orderNumber: 9988,
            clientId: 'cli-1',
            clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
            cnpjCpf: '39.003.660/0001-61',
            city: 'Jacarei',
            cep: '12338-500',
            contactName: 'SR SAMIIR',
            contactNumber: '(12) 98195-6675',
            neighborhood: 'Jardim California',
            address: 'Rodovia Geraldo Scavone',
            addressNumber: '4975',
            placa: 'ABC1D23',
            type: 'retirada',
            priority: 0,
            status: 'concluido',
            motorista: { _id: 'drv-1', username: 'adalberto' },
            cacambas: [
              {
                _id: 'cac-sem-valor',
                numero: '999',
                tipo: 'retirada',
                local: 'via_publica',
                orderId: 'ord-fech-sem-valor',
                createdAt: '2026-05-16T10:00:00.000Z',
                paymentStatus: 'pendente',
              },
            ],
            imageUrls: [],
            createdAt: '2026-05-16T08:00:00.000Z',
            updatedAt: '2026-05-16T12:00:00.000Z',
          },
        ]),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first().click();

    await expect(page.getByText(/sem valor.*tipo de conte/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adicionar valor' })).toHaveCount(1);
    await expect(page.getByLabel('Selecionar para pagamento')).toHaveCount(0);
  });

  test('no fechamento nao permite selecionar pagamento para cacamba sem conteudo e exibe aviso', async ({ page, isMobile }) => {
    await page.route('**/clients/cli-1/orders**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'ord-fech-sem-conteudo',
            orderNumber: 9990,
            clientId: 'cli-1',
            clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
            cnpjCpf: '39.003.660/0001-61',
            city: 'Jacarei',
            cep: '12338-500',
            contactName: 'SR SAMIIR',
            contactNumber: '(12) 98195-6675',
            neighborhood: 'Jardim California',
            address: 'Rodovia Geraldo Scavone',
            addressNumber: '4975',
            placa: 'ABC1D23',
            type: 'retirada',
            priority: 0,
            status: 'concluido',
            motorista: { _id: 'drv-1', username: 'adalberto' },
            cacambas: [
              {
                _id: 'cac-sem-conteudo',
                numero: '1000',
                tipo: 'retirada',
                local: 'via_publica',
                orderId: 'ord-fech-sem-conteudo',
                createdAt: '2026-05-16T10:00:00.000Z',
                paymentStatus: 'pendente',
                price: 250,
              },
            ],
            imageUrls: [],
            createdAt: '2026-05-16T08:00:00.000Z',
            updatedAt: '2026-05-16T12:00:00.000Z',
          },
        ]),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first().click();

    await expect(page.getByText(/sem tipo de conte/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Adicionar conte.*do/i })).toHaveCount(1);
    await expect(page.getByLabel('Selecionar para pagamento')).toHaveCount(0);
  });

  test('modal de pedidos do fechamento permite baixar pdf das cacambas selecionadas', async ({ page, isMobile, browserName }) => {
    test.skip(browserName === 'webkit', 'Download no WebKit do CI pode ser inconsistente para jsPDF blob.');
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await expect(page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first().click();
    await page.getByLabel('Selecionar para pagamento').first().check();
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

  test('aba acompanhamentos mostra apenas cacambas pendentes de retirada e campos principais', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByRole('heading', { name: 'Acompanhamentos' })).toBeVisible();
    await expect(page.getByText(/TOTAL:/i)).toBeVisible();
  });

  test('renderiza secao de concluidos sem botao de download quando a feature esta desativada', async ({ page }) => {
    await expect(page.getByText('#1500')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Baixar Pedido' })).toHaveCount(0);
  });

  test('mostra data de entrega anterior em retirada na visualizacao admin', async ({ page }) => {
    const withdrawalOrderCard = page.getByTestId('order-card-ord-4');
    await expect(withdrawalOrderCard.getByText('#777')).toBeVisible();
    await expect(withdrawalOrderCard.getByText(/Entregue em:/)).toBeVisible();
  });

  test('filtra clientes na aba fechamento por periodo aplicado', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-16');
    await page.locator('#closure-end-date').fill('2026-05-16');
    await expect(page.getByText('Nenhum cliente com retirada concluida encontrado para os filtros selecionados.')).toBeVisible();
  });

  test('fechamento: cliente listado sempre abre modal com retirada concluida', async ({ page, isMobile }) => {
    await page.route('**/clients?**closure=true**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'cli-katu',
            clientName: 'Katu Participacoes Ltda OBRA 1',
            cnpjCpf: '',
            contactName: 'Contato',
            contactNumber: '(12) 99999-9999',
            address: 'Rua A',
            addressNumber: '100',
            neighborhood: 'Centro',
            city: 'Jacarei',
            cep: '12345-000',
            hasPendingClosureItems: true,
            hasGeneratedClosureGroups: false,
            pendingClosureCount: 1,
            generatedClosureGroupsCount: 0,
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
            clientName: 'Katu Participacoes Ltda OBRA 1',
            cnpjCpf: '',
            city: 'Jacarei',
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

    await expect(page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Gerar fechamento do cliente/i }).first().click();

    await expect(page.getByText('Pedido #4001')).toBeVisible();
    await expect(page.getByText('Quantidade total de pedidos: 1')).toBeVisible();
    await expect(page.getByText('Nenhum pedido encontrado para os filtros selecionados.')).toHaveCount(0);
  });

  test('fechamento: salvar valor pendente no filtro de informações pendentes mantém modal aberto e não reseta a tela', async ({ page, isMobile }) => {
    let clientsFetchCount = 0;
    let patchCount = 0;
    let closureOrdersFetchUrl = '';

    await page.route('**/clients?**closure=true**', async (route) => {
      clientsFetchCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'cli-katu',
            clientName: 'Katu Participacoes Ltda OBRA 1',
            cnpjCpf: '',
            contactName: 'Contato',
            contactNumber: '(12) 99999-9999',
            address: 'Rua A',
            addressNumber: '100',
            neighborhood: 'Centro',
            city: 'Jacarei',
            cep: '12345-000',
            hasPendingClosureItems: true,
            hasGeneratedClosureGroups: false,
            hasPendingClosureMetadata: true,
            pendingClosureCount: 1,
            generatedClosureGroupsCount: 0,
            pendingClosureMetadataCount: 1,
          },
        ]),
      });
    });

    await page.route('**/clients/cli-katu/orders?**closure=true**', async (route) => {
      closureOrdersFetchUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'ord-katu-1',
            orderNumber: 4001,
            clientId: 'cli-katu',
            clientName: 'Katu Participacoes Ltda OBRA 1',
            cnpjCpf: '',
            city: 'Jacarei',
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
            cacambas: [
              {
                _id: 'cac-1',
                numero: '101',
                tipo: 'retirada',
                paymentStatus: 'pendente',
                contentType: 'Entulho limpo',
                orderId: 'ord-katu-1',
                createdAt: '2026-05-16T12:00:00.000Z',
              },
            ],
            imageUrls: [],
            createdAt: '2026-05-16T08:00:00.000Z',
            updatedAt: '2026-05-16T12:00:00.000Z',
          },
        ]),
      });
    });

    await page.route('**/cacambas/cac-1', async (route) => {
      patchCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cacamba: {
            _id: 'cac-1',
            numero: '101',
            tipo: 'retirada',
            paymentStatus: 'pendente',
            contentType: 'Entulho limpo',
            price: 180,
            orderId: 'ord-katu-1',
            createdAt: '2026-05-16T12:00:00.000Z',
          },
        }),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-start-date').fill('2026-05-15');
    await page.locator('#closure-end-date').fill('2026-05-31');
    await page.locator('#closure-payment-status').selectOption('metadata_pending');
    await page.getByRole('button', { name: /Ver caçambas com informações pendentes/i }).first().click();

    await expect(page.getByText('Pedido #4001')).toBeVisible();
    const fetchesBeforeEdit = clientsFetchCount;
    expect(closureOrdersFetchUrl).toContain('paymentStatus=metadata_pending');

    await page.getByRole('button', { name: 'Adicionar valor' }).click();
    await page.locator('#cacamba-price').fill('180');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect.poll(() => patchCount).toBe(1);
    await expect(page.getByTestId('client-orders-modal')).toBeVisible();
    await expect(page.getByText('Nenhuma caçamba com informações pendentes encontrada para este cliente.')).toBeVisible();
    await expect(page.getByText('Pedido #4001')).toHaveCount(0);
    expect(clientsFetchCount).toBe(fetchesBeforeEdit);
  });

  test('fechamento: filtro informações pendentes busca somente clientes com metadados pendentes', async ({ page, isMobile }) => {
    await page.route('**/clients?**closure=true**', async (route) => {
      const url = new URL(route.request().url());
      const currentPaymentStatus = url.searchParams.get('paymentStatus') || 'all';
      const body =
        currentPaymentStatus === 'metadata_pending'
          ? [
              {
                _id: 'cli-pendente',
                clientName: 'Cliente Com Pendencia',
                cnpjCpf: '',
                hasPendingClosureItems: true,
                hasGeneratedClosureGroups: false,
                hasPendingClosureMetadata: true,
                pendingClosureCount: 1,
                generatedClosureGroupsCount: 0,
                pendingClosureMetadataCount: 1,
              },
            ]
          : [
              {
                _id: 'cli-pendente',
                clientName: 'Cliente Com Pendencia',
                cnpjCpf: '',
                hasPendingClosureItems: true,
                hasGeneratedClosureGroups: false,
                hasPendingClosureMetadata: true,
                pendingClosureCount: 1,
                generatedClosureGroupsCount: 0,
                pendingClosureMetadataCount: 1,
              },
              {
                _id: 'cli-ok',
                clientName: 'Cliente Sem Pendencia',
                cnpjCpf: '',
                hasPendingClosureItems: true,
                hasGeneratedClosureGroups: false,
                hasPendingClosureMetadata: false,
                pendingClosureCount: 1,
                generatedClosureGroupsCount: 0,
                pendingClosureMetadataCount: 0,
              },
            ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Fechamento' }).click();
    await page.locator('#closure-payment-status').selectOption('metadata_pending');

    await expect(page.getByText('Cliente Com Pendencia')).toBeVisible();
    await expect(page.getByText('Cliente Sem Pendencia')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Ver caçambas com informações pendentes' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Ver caçambas com informações pendentes' }).click();
    await expect(page.getByTestId('client-orders-modal')).toBeVisible();
    await expect(page.getByTestId('client-orders-modal').getByTestId('closure-stepper')).toHaveCount(0);
    await expect(
      page.getByTestId('client-orders-modal').getByText(/Total do cliente \(Retiradas\)/i),
    ).toHaveCount(0);
    await expect(
      page.getByTestId('client-orders-modal').getByRole('button', { name: 'Gerar fechamento' }),
    ).toHaveCount(0);
  });

  test('logout limpa sessao e volta para login', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Sair' }).click();
    const confirmDialog = page.getByRole('dialog', { name: 'Sair do sistema' });
    await expect(confirmDialog).toBeVisible();
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/'),
      confirmDialog.getByRole('button', { name: 'Sair' }).click(),
    ]);
    await expect(page.getByRole('button', { name: /Entrar|Login|Acessar/i })).toBeVisible();
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
