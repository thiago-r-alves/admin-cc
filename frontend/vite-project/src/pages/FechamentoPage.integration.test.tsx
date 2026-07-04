import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FechamentoPage from './FechamentoPage';

describe('FechamentoPage integration', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    vi.restoreAllMocks();
  });

  it('preserva o modal e evita loading bloqueante ao salvar valor pendente', async () => {
    let patchCount = 0;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/clients?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'cli-1',
              clientName: 'Cliente Pendencia',
              hasPendingClosureItems: true,
              hasPendingClosureMetadata: true,
              hasGeneratedClosureGroups: false,
            },
          ],
        } as Response);
      }

      if (url.includes('/clients/cli-1/orders?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'ord-1',
              orderNumber: 4001,
              clientId: 'cli-1',
              clientName: 'Cliente Pendencia',
              contactName: '',
              contactNumber: '',
              neighborhood: '',
              address: '',
              addressNumber: '',
              type: 'retirada',
              priority: 0,
              status: 'concluido',
              cacambas: [
                {
                  _id: 'cac-1',
                  numero: '101',
                  tipo: 'retirada',
                  paymentStatus: 'pendente',
                  contentType: 'Entulho limpo',
                  orderId: 'ord-1',
                  createdAt: '2026-05-10T10:00:00.000Z',
                },
              ],
            },
          ],
        } as Response);
      }

      if (url.includes('/cacambas/cac-1') && init?.method === 'PATCH') {
        patchCount += 1;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cacamba: {
              _id: 'cac-1',
              numero: '101',
              tipo: 'retirada',
              paymentStatus: 'pendente',
              contentType: 'Entulho limpo',
              price: 180,
              orderId: 'ord-1',
              createdAt: '2026-05-10T10:00:00.000Z',
            },
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    fireEvent.change(screen.getByLabelText('Pagamento'), {
      target: { value: 'metadata_pending' },
    });

    expect(await screen.findByText('Cliente Pendencia')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ver caçambas com informações pendentes' }),
    );

    expect(await screen.findByText('Pedido #4001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar valor' }));
    fireEvent.change(screen.getByLabelText('Valor (R$)'), {
      target: { value: '180' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(patchCount).toBe(1));
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Carregando clientes para fechamento...')).not.toBeInTheDocument();
    expect(
      screen.getByText('Nenhuma caçamba com informações pendentes encontrada para este cliente.'),
    ).toBeInTheDocument();
  });

  it('permite editar caçamba dentro da seleção do fechamento sem perder progresso', async () => {
    let patchBody: BodyInit | null | undefined = null;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/clients?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'cli-1',
              clientName: 'Cliente Fechamento',
              hasPendingClosureItems: true,
              hasPendingClosureMetadata: false,
              hasGeneratedClosureGroups: false,
            },
          ],
        } as Response);
      }

      if (url.includes('/clients/cli-1/orders?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'ord-1',
              orderNumber: 4001,
              clientId: 'cli-1',
              clientName: 'Cliente Fechamento',
              contactName: '',
              contactNumber: '',
              neighborhood: '',
              address: '',
              addressNumber: '',
              type: 'retirada',
              priority: 0,
              status: 'concluido',
              cacambas: [
                {
                  _id: 'cac-1',
                  numero: '101',
                  tipo: 'retirada',
                  paymentStatus: 'pendente',
                  contentType: 'Entulho limpo',
                  price: 180,
                  local: 'via_publica',
                  horaServicoDigitos: '123',
                  orderId: 'ord-1',
                  createdAt: '2026-05-10T10:00:00.000Z',
                },
              ],
            },
          ],
        } as Response);
      }

      if (url.includes('/cacambas/cac-1') && init?.method === 'PATCH') {
        patchBody = init.body;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cacamba: {
              _id: 'cac-1',
              numero: '202',
              tipo: 'retirada',
              paymentStatus: 'pendente',
              contentType: 'Entulho limpo',
              price: 180,
              local: 'via_publica',
              horaServicoDigitos: '456',
              orderId: 'ord-1',
              createdAt: '2026-05-10T10:00:00.000Z',
            },
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    expect(await screen.findByText('Cliente Fechamento')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar fechamento do cliente' }));

    expect(await screen.findByText('Pedido #4001')).toBeInTheDocument();
    const selection = screen.getByLabelText('Selecionar para pagamento');
    fireEvent.click(selection);
    expect(selection).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));
    expect(await screen.findByText('Editar Caçamba #101')).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '202' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => expect(patchBody).toBeInstanceOf(FormData));
    await waitFor(() =>
      expect(screen.getByTestId('client-orders-modal')).toBeInTheDocument(),
    );
    expect(screen.getByText('#202')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecionar para pagamento')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Gerar fechamento' })).toBeEnabled();
  });

  it('permite editar caçamba em nota gerada sem sair do grupo aberto', async () => {
    let patchBody: BodyInit | null | undefined = null;

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/clients?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'cli-1',
              clientName: 'Cliente Nota',
              hasPendingClosureItems: false,
              hasPendingClosureMetadata: false,
              hasGeneratedClosureGroups: true,
            },
          ],
        } as Response);
      }

      if (url.includes('/clients/cli-1/closure-groups?')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              _id: 'grp-1',
              clientId: 'cli-1',
              clientSequenceNumber: 1,
              status: 'paga',
              invoiceNumber: 'NF-100',
              startDate: '2026-05-01T00:00:00.000Z',
              endDate: '2026-05-31T23:59:59.999Z',
              createdAt: '2026-05-10T12:00:00.000Z',
              updatedAt: '2026-05-11T12:00:00.000Z',
              cacambaIds: [
                {
                  _id: 'cac-1',
                  numero: '101',
                  tipo: 'retirada',
                  paymentStatus: 'paga',
                  contentType: 'Entulho limpo',
                  price: 180,
                  local: 'via_publica',
                  horaServicoDigitos: '123',
                  orderId: 'ord-1',
                  createdAt: '2026-05-10T10:00:00.000Z',
                },
              ],
            },
          ],
        } as Response);
      }

      if (url.includes('/cacambas/cac-1') && init?.method === 'PATCH') {
        patchBody = init.body;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cacamba: {
              _id: 'cac-1',
              numero: '303',
              tipo: 'retirada',
              paymentStatus: 'paga',
              contentType: 'Entulho limpo',
              price: 180,
              local: 'via_publica',
              horaServicoDigitos: '789',
              orderId: 'ord-1',
              createdAt: '2026-05-10T10:00:00.000Z',
            },
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<FechamentoPage />);

    expect(await screen.findByText('Cliente Nota')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver notas geradas' }));

    expect(await screen.findByText('Detalhes da nota fiscal')).toBeInTheDocument();
    expect(screen.getByText('NF atual: NF-100')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));
    expect(await screen.findByText('Editar Caçamba #101')).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '303' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '789' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => expect(patchBody).toBeInstanceOf(FormData));
    expect(screen.getByTestId('closure-groups-list')).toBeInTheDocument();
    expect(screen.getByText('NF atual: NF-100')).toBeInTheDocument();
    expect(screen.getByText('#303')).toBeInTheDocument();
  });
});
