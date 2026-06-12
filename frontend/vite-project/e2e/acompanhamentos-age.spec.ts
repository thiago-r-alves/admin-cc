import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Acompanhamentos - dias na obra', () => {
  const openMenuIfMobile = async (page: Page, isMobile: boolean) => {
    if (isMobile) {
      await page.getByRole('button', { name: 'Abrir menu' }).click();
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime('2026-05-16T12:00:00-03:00');
    await setupMockApi(page);
    await seedSession(page, 'admin');

    await page.route('**/orders', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      const baseOrder = {
        clientId: 'cli-1',
        clientName: 'Cliente Acompanhamento',
        cnpjCpf: '11.222.333/0001-44',
        city: 'Jacarei',
        cep: '12345-000',
        contactName: 'Contato',
        contactNumber: '(12) 99999-0000',
        neighborhood: 'Centro',
        address: 'Rua Teste',
        addressNumber: '10',
        placa: 'ABC1D23',
        type: 'entrega',
        priority: 0,
        status: 'pendente',
        motorista: { _id: 'drv-1', username: 'adalberto' },
        imageUrls: [],
      };

      const deliveries = [
        { id: 'today', number: '101', createdAt: '2026-05-16T09:00:00-03:00', phone: '(12) 99999-0101', serviceOrder: '111' },
        { id: 'one-day', number: '102', createdAt: '2026-05-15T09:00:00-03:00', phone: '(12) 99999-0102', serviceOrder: '222' },
        { id: 'medium', number: '103', createdAt: '2026-05-12T09:00:00-03:00', phone: '(12) 99999-0103', serviceOrder: '333' },
        { id: 'high', number: '104', createdAt: '2026-05-08T09:00:00-03:00', phone: '(12) 99999-0104', serviceOrder: '444' },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          deliveries.map((delivery, index) => ({
            ...baseOrder,
            _id: `ord-age-${delivery.id}`,
            orderNumber: 7000 + index,
            contactNumber: delivery.phone,
            cacambas: [
              {
                _id: `cac-age-${delivery.id}`,
                numero: delivery.number,
                tipo: 'entrega',
                local: 'via_publica',
                orderId: `ord-age-${delivery.id}`,
                createdAt: delivery.createdAt,
                horaServicoDigitos: delivery.serviceOrder,
              },
            ],
            createdAt: delivery.createdAt,
            updatedAt: delivery.createdAt,
          }))
        ),
      });
    });

    await page.goto('/admin');
  });

  test('mostra tempo na obra com pluralizacao e faixas visuais', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await expect(page.getByRole('heading', { name: 'Acompanhamentos' })).toBeVisible();

    const todayBadge = page.getByTestId('cacamba-age-badge').filter({ hasText: 'Na obra: Hoje' });
    const oneDayBadge = page.getByTestId('cacamba-age-badge').filter({ hasText: 'Na obra h\u00e1 1 dia' });
    const mediumBadge = page.getByTestId('cacamba-age-badge').filter({ hasText: 'Na obra h\u00e1 4 dias' });
    const highBadge = page.getByTestId('cacamba-age-badge').filter({ hasText: 'Na obra h\u00e1 8 dias' });

    await expect(todayBadge).toHaveAttribute('data-age-tone', 'low');
    await expect(oneDayBadge).toHaveAttribute('data-age-tone', 'low');
    await expect(mediumBadge).toHaveAttribute('data-age-tone', 'medium');
    await expect(highBadge).toHaveAttribute('data-age-tone', 'high');
  });

  test('filtra por telefone e ordem de servico', async ({ page, isMobile }) => {
    await openMenuIfMobile(page, isMobile);
    await page.getByRole('button', { name: 'Acompanhamentos' }).click();

    await page.getByLabel('Telefone').fill('0104');
    await expect(page.getByText('Caçamba #104')).toBeVisible();
    await expect(page.getByText('Caçamba #103')).toHaveCount(0);

    await page.getByLabel('Telefone').fill('');
    await page.locator('#filtro-ordem-servico').fill('333');
    await expect(page.getByText('Caçamba #103')).toBeVisible();
    await expect(
      page.getByTestId('acompanhamento-card-cac-age-medium').getByText('333', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Caçamba #104')).toHaveCount(0);
  });
});
