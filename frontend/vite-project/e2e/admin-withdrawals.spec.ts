import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
  }
};

test.describe('Admin retiradas pendentes', () => {
  test('exibe badge, agrupa vencidas e cria pedido de retirada pre-preenchido', async ({ page, isMobile }) => {
    await page.clock.setFixedTime('2026-05-12T12:00:00-03:00');
    await setupMockApi(page);
    await seedSession(page, 'admin');

    await page.route('**/orders', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'ord-withdrawal-source',
            orderNumber: 4500,
            clientId: 'cli-1',
            clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
            cnpjCpf: '39.003.660/0001-61',
            city: 'Jacareí',
            cep: '12338-500',
            contactName: 'SR SAMIIR',
            contactNumber: '(12) 98195-6675',
            neighborhood: 'Jardim Califórnia',
            address: 'Rodovia Geraldo Scavone',
            addressNumber: '4975',
            placa: 'ABC1D23',
            type: 'entrega',
            priority: 0,
            status: 'concluido',
            motorista: { _id: 'drv-1', username: 'adalberto' },
            cacambas: [
              {
                _id: 'cac-due-901',
                numero: '901',
                tipo: 'entrega',
                local: 'canteiro_obra',
                orderId: 'ord-withdrawal-source',
                imageUrl: '/uploads/cac-901.jpg',
                createdAt: '2026-05-01T09:00:00-03:00',
                horaServicoDigitos: '901',
              },
              {
                _id: 'cac-due-902',
                numero: '902',
                tipo: 'entrega',
                local: 'canteiro_obra',
                orderId: 'ord-withdrawal-source',
                imageUrl: '/uploads/cac-902.jpg',
                createdAt: '2026-05-01T09:30:00-03:00',
                horaServicoDigitos: '902',
              },
            ],
            imageUrls: [],
            createdAt: '2026-05-01T08:00:00-03:00',
            updatedAt: '2026-05-01T12:00:00-03:00',
          },
          {
            _id: 'ord-planned-withdrawal',
            orderNumber: 4600,
            clientId: 'cli-1',
            clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
            cnpjCpf: '39.003.660/0001-61',
            city: 'Jacareí',
            cep: '12338-500',
            contactName: 'SR SAMIIR',
            contactNumber: '(12) 98195-6675',
            neighborhood: 'Jardim Califórnia',
            address: 'Rodovia Geraldo Scavone',
            addressNumber: '4975',
            placa: 'ABC1D23',
            type: 'retirada',
            priority: 0,
            status: 'pendente',
            motorista: { _id: 'drv-1', username: 'adalberto' },
            plannedWithdrawalCacambaIds: ['cac-due-902'],
            cacambas: [],
            imageUrls: [],
            createdAt: '2026-05-10T08:00:00-03:00',
            updatedAt: '2026-05-10T08:00:00-03:00',
          },
        ]),
      });
    });

    await page.goto('/admin');

    if (isMobile) {
      await expect(page.getByTestId('pending-withdrawals-mobile-badge')).toContainText('2 retiradas pendentes');
    }

    await openMenuIfMobile(page, isMobile);
    await expect(page.getByTestId('pending-withdrawals-sidebar-badge')).toHaveText('2');
    await page.getByRole('button', { name: /Retiradas pendentes/ }).click();

    await expect(page.getByRole('heading', { name: 'Retiradas pendentes' })).toBeVisible();
    await expect(page.getByText('3GK HOLDING E PARTICIPACOES OBRA 1')).toBeVisible();
    await expect(page.getByText('CNPJ/CPF', { exact: true })).toBeVisible();
    await expect(page.getByText('39.003.660/0001-61')).toBeVisible();
    await expect(page.getByText('Maior prazo')).toHaveCount(0);
    await expect(page.getByText('Total no endereço')).toHaveCount(0);
    await expect(page.getByText('1 endereço(s)')).toHaveCount(0);
    await expect(page.getByText('#901')).toBeVisible();
    await expect(page.getByText('#902')).toBeVisible();
    const dueBadge = page.getByTestId('cacamba-status-badge-cac-due-901-0');
    await expect(dueBadge).toContainText('Venceu em 08/05/2026 • vencida há 2 dias úteis');
    await expect(dueBadge).toHaveCSS('color', 'rgb(153, 27, 27)');
    await expect(page.getByTestId('cacamba-status-badge-cac-due-902-1')).toHaveCount(0);
    const plannedWithdrawalOrderBadge = page.getByTestId('withdrawal-order-status-ord-planned-withdrawal');
    await expect(plannedWithdrawalOrderBadge).toContainText(
      'Pedido #4600 criado - aguardando motorista finalizar retirada',
    );
    if (isMobile) {
      const badgeBox = await plannedWithdrawalOrderBadge.boundingBox();
      const viewport = page.viewportSize();

      expect(badgeBox).not.toBeNull();
      expect(badgeBox!.x).toBeGreaterThanOrEqual(0);
      expect(badgeBox!.x + badgeBox!.width).toBeLessThanOrEqual((viewport?.width ?? 390) + 1);
    }
    await expect(page.getByText('Local: Canteiro de obra')).toHaveCount(2);
    await expect(page.getByText('Ordem de serviço: 901')).toBeVisible();
    await expect(page.getByText('Ordem de serviço: 902')).toBeVisible();

    await page.getByRole('button', { name: 'Criar pedido de retirada' }).click();
    await expect(page.getByText('Novo Pedido de Retirada')).toBeVisible();
    await expect(page.getByTestId('withdrawal-preset-notice')).toContainText('#901');
    await expect(page.getByTestId('withdrawal-preset-notice')).not.toContainText('#902');

    await page
      .locator('label', { hasText: 'Valor da Caçamba (R$)' })
      .locator('xpath=following::input[1]')
      .fill('250');
    await page
      .locator('label', { hasText: 'Placa' })
      .locator('xpath=following::select[1]')
      .selectOption('fto2e29');
    await page
      .locator('label', { hasText: 'Atribuir Motorista' })
      .locator('xpath=following::select[1]')
      .selectOption('drv-1');

    const orderPost = page.waitForRequest(
      (request) => new URL(request.url()).pathname === '/orders' && request.method() === 'POST',
      { timeout: 15_000 },
    );
    await Promise.all([
      orderPost,
      page.getByRole('button', { name: 'Criar Pedido', exact: true }).click(),
    ]);
    const request = await orderPost;
    const payload = request.postDataJSON();

    expect(payload).toMatchObject({
      clientId: 'cli-1',
      type: 'retirada',
      cacambaPrice: 250,
      motorista: 'drv-1',
      placa: 'fto2e29',
      plannedWithdrawalCacambaIds: ['cac-due-901'],
    });
  });
});
