import { expect, test } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

test.describe('Nota individual por caçamba', () => {
  test('exibe acao em cada cacamba e baixa arquivo individual', async ({ page }) => {
    await setupMockApi(page);
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
            _id: 'ord-individual',
            orderNumber: 9101,
            clientId: 'cli-1',
            clientName: 'Cliente Nota Individual',
            cnpjCpf: '14.071.560/0001-41',
            city: 'São José dos Campos',
            cep: '12238-500',
            contactName: 'Contato',
            contactNumber: '(12) 99999-0000',
            neighborhood: 'Centro',
            address: 'Rua A',
            addressNumber: '10',
            placa: 'ABC1D23',
            type: 'retirada',
            priority: 0,
            status: 'concluido',
            motorista: { _id: 'drv-1', username: 'adalberto' },
            cacambas: [
              {
                _id: 'cac-ind-1',
                numero: '700',
                tipo: 'retirada',
                local: 'via_publica',
                contentType: 'Entulho limpo',
                orderId: 'ord-individual',
                createdAt: '2026-07-20T10:00:00.000Z',
                price: 120,
              },
              {
                _id: 'cac-ind-2',
                numero: '701',
                tipo: 'retirada',
                local: 'canteiro_obra',
                contentType: 'Terra',
                orderId: 'ord-individual',
                createdAt: '2026-07-20T11:00:00.000Z',
                price: 130,
              },
            ],
            imageUrls: [],
            createdAt: '2026-07-20T09:00:00.000Z',
            updatedAt: '2026-07-20T12:00:00.000Z',
          },
        ]),
      });
    });
    await seedSession(page, 'admin');
    await page.goto('/admin');

    const orderCard = page.getByTestId('order-card-ord-individual');
    await expect(orderCard).toBeVisible();
    await expect(orderCard.getByRole('button', { name: 'Baixar nota individual' })).toHaveCount(2);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('cacamba-card-cac-ind-1').getByRole('button', { name: 'Baixar nota individual' }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('Cliente_Nota_Individual_os_digital_9101_cacamba_700.pdf');
  });
});
