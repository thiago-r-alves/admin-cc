import { expect, test, type Page } from '@playwright/test';
import { seedSession, setupMockApi } from './support/mockApi';

const openClients = async (page: Page, isMobile: boolean) => {
  if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gerenciamento de Clientes' })).toBeVisible();
};

const editClient = async (page: Page, clientName: string) => {
  const row = page.getByRole('heading', { name: clientName, exact: true }).locator('xpath=../..');
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
};

const selectClientForOrder = async (page: Page) => {
  await page.getByRole('button', { name: /\+ Adicionar Pedido/i }).click();
  const clientInput = page.locator('input[id^="react-select-"]').first();
  await clientInput.fill('3GK');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Referência (opcional)', { exact: true })).toBeVisible();
};

test.describe('Admin referência para o motorista', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await page.route('https://viacep.com.br/ws/12338500/json/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cep: '12338-500',
          logradouro: 'Rodovia Geraldo Scavone',
          bairro: 'Jardim Califórnia',
          localidade: 'Jacareí',
        }),
      });
    });
    await seedSession(page, 'admin');
    await page.goto('/admin');
  });

  test('cadastra cliente com referencia opcional, permite editar e apagar', async ({ page, isMobile }) => {
    await openClients(page, isMobile);
    await page.getByTestId('clients-add-button').click();
    const referenceInput = page.getByLabel('Referência (opcional)', { exact: true });
    await expect(referenceInput).toHaveValue('');
    await expect(referenceInput).not.toHaveAttribute('required');
    await page.getByLabel('Nome do Cliente', { exact: true }).fill('Cliente referência');
    await page.getByLabel('Logradouro', { exact: true }).fill('Rua do motorista');
    await page.getByLabel('Numero', { exact: true }).fill('100');
    await page.getByLabel('Bairro', { exact: true }).fill('Centro');
    await page.getByLabel('Cidade', { exact: true }).selectOption('Jacareí');
    await page.getByLabel('Nome do Contato', { exact: true }).fill('Maria');
    await page.getByLabel('Numero do Contato', { exact: true }).fill('(12) 99999-8888');
    await referenceInput.fill('  Em frente à escola  ');

    const createResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/clients' && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
    const created = await createResponse;
    expect(created.request().postDataJSON().reference).toBe('Em frente à escola');
    expect((await created.json()).reference).toBe('Em frente à escola');

    await editClient(page, 'Cliente referência');
    await expect(referenceInput).toHaveValue('Em frente à escola');
    await referenceInput.fill('  Portão verde ao lado da escola  ');
    const editResponse = page.waitForResponse(
      (response) => /\/clients\/[^/]+$/.test(new URL(response.url()).pathname) && response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
    expect((await (await editResponse).json()).reference).toBe('Portão verde ao lado da escola');

    await editClient(page, 'Cliente referência');
    await expect(referenceInput).toHaveValue('Portão verde ao lado da escola');
    await referenceInput.fill('');
    const clearResponse = page.waitForResponse(
      (response) => /\/clients\/[^/]+$/.test(new URL(response.url()).pathname) && response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
    expect((await (await clearResponse).json()).reference).toBe('');
    await editClient(page, 'Cliente referência');
    await expect(referenceInput).toHaveValue('');
  });

  test('edita cliente antigo sem referencia', async ({ page, isMobile }) => {
    await openClients(page, isMobile);
    await editClient(page, 'PFF INOVA IND E COM DE MAQ OBRA 1');
    const referenceInput = page.getByLabel('Referência (opcional)', { exact: true });
    await expect(referenceInput).toHaveValue('');
    const updateResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/clients/cli-2' && response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
    expect((await (await updateResponse).json()).reference).toBe('');
  });

  for (const reference of ['Entrada pela lateral para este pedido', '']) {
    test(`${reference ? 'personaliza' : 'limpa'} referencia herdada no pedido sem alterar cliente ou maps`, async ({ page }) => {
      let clientPatchCount = 0;
      page.on('request', (request) => {
        if (/\/clients\/[^/]+$/.test(new URL(request.url()).pathname) && request.method() === 'PATCH') {
          clientPatchCount += 1;
        }
      });

      await selectClientForOrder(page);
      const referenceInput = page.getByLabel('Referência (opcional)', { exact: true });
      await expect(referenceInput).toHaveValue('Entrada pela portaria lateral');
      const mapFrame = page.locator('iframe[title="Mapa do endereço do pedido"]');
      const mapsLink = page.getByRole('link', { name: 'Local verificado' });
      const initialEmbed = await mapFrame.getAttribute('src');
      const initialSearch = await mapsLink.getAttribute('href');
      expect(new URL(initialEmbed!).searchParams.get('q')).toBe(
        'Rodovia Geraldo Scavone, 4975, Jardim Califórnia, Jacareí, 12338-500, Brasil',
      );
      expect(new URL(initialSearch!).searchParams.get('query')).toBe(
        'Rodovia Geraldo Scavone, 4975, Jardim Califórnia, Jacareí, 12338-500, Brasil',
      );
      await referenceInput.fill(reference ? `  ${reference}  ` : '');
      await expect(mapFrame).toHaveAttribute('src', initialEmbed!);
      await expect(mapsLink).toHaveAttribute('href', initialSearch!);

      await page.getByRole('radio', { name: /Entrega/i }).click();
      await page.locator('label', { hasText: 'Valor da Caçamba (R$)' }).locator('xpath=following::input[1]').fill('180');
      await page.locator('label', { hasText: 'Placa' }).locator('xpath=following::select[1]').selectOption('fto2e29');
      await page.locator('label', { hasText: 'Atribuir Motorista' }).locator('xpath=following::select[1]').selectOption('drv-1');
      const createResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === '/orders' && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Criar Pedido', exact: true }).click();
      const created = await createResponse;
      expect(created.request().postDataJSON().reference).toBe(reference);
      expect((await created.json()).reference).toBe(reference);
      await expect(page.getByRole('button', { name: 'Criar Pedido', exact: true })).toHaveCount(0);

      await selectClientForOrder(page);
      await expect(referenceInput).toHaveValue('Entrada pela portaria lateral');
      expect(clientPatchCount).toBe(0);
    });
  }
});
