import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClientOrdersModal } from './useClientOrdersModal';
import { buildClientOrdersPdf, downloadClientOrdersPdf } from '../../utils/clientOrdersPdf';
import { downloadClosureReceiptPdf } from '../../utils/receiptPdf';
import type { ClientOrdersHistoryFilters } from './types';

vi.mock('../../utils/clientOrdersPdf', () => ({
  buildClientOrdersPdf: vi.fn(async () => ({
    filename: 'fechamento.pdf',
    blob: new Blob(['pdf'], { type: 'application/pdf' }),
  })),
  downloadClientOrdersPdf: vi.fn(async () => undefined),
}));

vi.mock('../../utils/receiptPdf', () => ({
  downloadClosureReceiptPdf: vi.fn(async () => undefined),
}));

const client = { _id: 'cli-1', clientName: 'Cliente Teste' };

const paidGroup = {
  _id: 'grp-1',
  clientId: 'cli-1',
  clientSequenceNumber: 1,
  status: 'paga' as const,
  invoiceNumber: 'NF-0001',
  startDate: '2026-05-01T00:00:00.000Z',
  endDate: '2026-05-31T23:59:59.999Z',
  createdAt: '2026-05-10T12:00:00.000Z',
  updatedAt: '2026-05-11T12:00:00.000Z',
  cacambaIds: [
    {
      _id: 'cac-1',
      numero: '101',
      tipo: 'retirada' as const,
      paymentStatus: 'paga' as const,
      contentType: 'Entulho limpo' as const,
      price: 120,
      orderId: 'ord-1',
      createdAt: '2026-05-10T10:00:00.000Z',
    },
  ],
};

const pixGroup = {
  ...paidGroup,
  paymentMethod: 'pix' as const,
  invoiceNumber: '',
  totalAmount: 120,
  pixCopyPaste: 'PIX-COPIA-E-COLA',
  status: 'pix_pendente' as const,
};

describe('useClientOrdersModal', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token-test');
    vi.restoreAllMocks();
    vi.mocked(buildClientOrdersPdf).mockResolvedValue({
      filename: 'fechamento.pdf',
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
    } as never);
    vi.mocked(downloadClientOrdersPdf).mockResolvedValue(undefined);
    vi.mocked(downloadClosureReceiptPdf).mockResolvedValue(undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:fechamento'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('carrega pedidos elegíveis de fechamento sempre com paymentStatus pending', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        closureMode: true,
        paymentStatus: 'paid',
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstCallUrl = String((fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0]);
    expect(firstCallUrl).toContain('/clients/cli-1/orders?');
    expect(firstCallUrl).toContain('closure=true');
    expect(firstCallUrl).toContain('paymentStatus=pending');
    expect(firstCallUrl).toContain('paginated=true');
    expect(firstCallUrl).toContain('pageSize=25');
  });

  it('usa filtros dinâmicos no modo histórico operacional', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetchMock);
    const initialFilters: ClientOrdersHistoryFilters = {
      type: 'retirada',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      status: 'concluido',
      local: 'via_publica',
      q: '401',
    };

    const { rerender } = renderHook(
      ({ filters }: { filters: ClientOrdersHistoryFilters }) =>
        useClientOrdersModal({
          client,
          closureMode: false,
          historyFilters: filters,
        }),
      {
        initialProps: {
          filters: initialFilters,
        },
      },
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const firstCallUrl = String((fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0]);
    expect(firstCallUrl).toContain('startDate=2026-05-01');
    expect(firstCallUrl).toContain('endDate=2026-05-31');
    expect(firstCallUrl).toContain('type=retirada');
    expect(firstCallUrl).toContain('status=concluido');
    expect(firstCallUrl).toContain('local=via_publica');
    expect(firstCallUrl).toContain('q=401');

    rerender({
      filters: {
        type: 'entrega',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        status: 'all',
        local: 'all',
        q: 'CAC-9',
      },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondCallUrl = String((fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[1][0]);
    expect(secondCallUrl).toContain('startDate=2026-06-01');
    expect(secondCallUrl).toContain('endDate=2026-06-30');
    expect(secondCallUrl).toContain('type=entrega');
    expect(secondCallUrl).toContain('q=CAC-9');
    expect(secondCallUrl).not.toContain('status=');
    expect(secondCallUrl).not.toContain('local=');
  });

  it('atualiza seleção sem duplicar ids', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await act(async () => {
      result.current.toggleSelectCacamba(
        { _id: 'cac-1', numero: '1', tipo: 'retirada', orderId: 'ord-1', createdAt: '' },
        true,
      );
      result.current.toggleSelectCacamba(
        { _id: 'cac-1', numero: '1', tipo: 'retirada', orderId: 'ord-1', createdAt: '' },
        true,
      );
    });

    expect(result.current.selectedCacambaIds).toEqual(['cac-1']);
  });

  it('gera grupo atual localmente e mantém o fluxo no mesmo modal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'ord-1',
            orderNumber: 5001,
            clientId: 'cli-1',
            clientName: 'Cliente Teste',
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
                price: 120,
                orderId: 'ord-1',
                createdAt: '2026-05-10T10:00:00.000Z',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          closureGroup: {
            _id: 'grp-1',
            clientId: 'cli-1',
            clientSequenceNumber: 1,
            status: 'nota_fiscal_pendente',
            invoiceNumber: '',
            startDate: '2026-05-01T00:00:00.000Z',
            endDate: '2026-05-31T23:59:59.999Z',
          },
          updatedCacambaIds: ['cac-1'],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.toggleSelectCacamba(
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'retirada',
          paymentStatus: 'pendente',
          contentType: 'Entulho limpo',
          price: 120,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
        true,
      );
    });

    await act(async () => {
      await result.current.handleDownload();
    });

    expect(downloadClientOrdersPdf).toHaveBeenCalled();
    expect(result.current.currentClosureGroup?._id).toBe('grp-1');
    expect(result.current.currentClosureGroup?.cacambaIds).toHaveLength(1);
    expect(result.current.currentClosureGroup?.cacambaIds[0].paymentStatus).toBe(
      'nota_fiscal_pendente',
    );
  });

  it('atualiza caçamba editada no grupo atual e na lista de grupos', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'ord-1',
            orderNumber: 4001,
            clientId: 'cli-1',
            clientName: 'Cliente Teste',
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
                price: 120,
                local: 'via_publica',
                horaServicoDigitos: '123',
                orderId: 'ord-1',
                createdAt: '2026-05-10T10:00:00.000Z',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          closureGroup: {
            _id: 'grp-1',
            clientId: 'cli-1',
            clientSequenceNumber: 1,
            status: 'nota_fiscal_pendente',
            invoiceNumber: '',
            startDate: '2026-05-01T00:00:00.000Z',
            endDate: '2026-05-31T23:59:59.999Z',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cacamba: {
            _id: 'cac-1',
            numero: '202',
            tipo: 'retirada',
            paymentStatus: 'nota_fiscal_pendente',
            contentType: 'Terra',
            price: 120,
            local: 'canteiro_obra',
            horaServicoDigitos: '456',
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.toggleSelectCacamba(
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'retirada',
          paymentStatus: 'pendente',
          contentType: 'Entulho limpo',
          price: 120,
          local: 'via_publica',
          horaServicoDigitos: '123',
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
        true,
      );
    });

    await act(async () => {
      await result.current.handleDownload();
    });

    await act(async () => {
      await result.current.handleUpdateCacambaFull('cac-1', {
        numero: '202',
        tipo: 'retirada',
        local: 'canteiro_obra',
        horaServicoDigitos: '456',
        contentType: 'Terra',
      });
    });

    expect(result.current.currentClosureGroup?.cacambaIds[0]).toMatchObject({
      _id: 'cac-1',
      numero: '202',
      local: 'canteiro_obra',
      horaServicoDigitos: '456',
      contentType: 'Terra',
    });
    expect(result.current.closureGroups[0]?.cacambaIds[0]).toMatchObject({
      _id: 'cac-1',
      numero: '202',
      local: 'canteiro_obra',
      horaServicoDigitos: '456',
      contentType: 'Terra',
    });
  });

  it('permite reimprimir grupo pago e editar NF sem alterar o status local', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          closureGroup: {
            _id: 'grp-1',
            status: 'paga',
            invoiceNumber: 'NF-ATUALIZADA',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const paidGroup = {
      _id: 'grp-1',
      clientId: 'cli-1',
      clientSequenceNumber: 1,
      status: 'paga' as const,
      invoiceNumber: 'NF-0001',
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-31T23:59:59.999Z',
      createdAt: '2026-05-10T12:00:00.000Z',
      updatedAt: '2026-05-11T12:00:00.000Z',
      cacambaIds: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'retirada' as const,
          paymentStatus: 'paga' as const,
          contentType: 'Entulho limpo' as const,
          price: 120,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
      ],
    };

    await act(async () => {
      await result.current.downloadExistingClosureGroup(paidGroup);
    });

    expect(downloadClientOrdersPdf).toHaveBeenCalled();

    await act(async () => {
      await result.current.saveInvoiceForGroup('grp-1', 'NF-ATUALIZADA');
    });

    expect(result.current.selectedGroupId).toBe('grp-1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/closure-groups/grp-1/invoice'),
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('salva informações do Pix sem alterar o status local', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          closureGroup: {
            _id: 'grp-1',
            status: 'pix_pendente',
            paymentMethod: 'pix',
            pixInfo: 'Pix identificado no banco',
          },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.savePixInfoForGroup('grp-1', 'Pix identificado no banco');
    });

    expect(result.current.pixInfo).toBe('Pix identificado no banco');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/closure-groups/grp-1/pix-info'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ pixInfo: 'Pix identificado no banco' }),
      }),
    );
  });

  it('baixa recibo do grupo pago sem chamar endpoints ou alterar status local', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.downloadClosureReceipt(paidGroup, 'Maria Cliente');
    });

    expect(downloadClosureReceiptPdf).toHaveBeenCalledWith({
      client,
      group: paidGroup,
      recipientName: 'Maria Cliente',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.currentClosureGroup).toBeNull();
  });

  it('compartilha NF por WhatsApp baixando o PDF e abrindo mensagem pronta', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    const openedWindow = {
      location: { href: '' },
      close: vi.fn(),
    };
    const windowOpenMock = vi.spyOn(window, 'open').mockReturnValue(openedWindow as unknown as Window);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client: {
          ...client,
          contactName: 'Contato Cliente',
          contactNumber: '(12) 98195-6675',
        },
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.shareClosureGroupOnWhatsApp(paidGroup);
    });

    expect(buildClientOrdersPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        orders: expect.any(Array),
        clientTotal: 120,
        paymentMethod: undefined,
      }),
      { output: 'blob' },
    );
    expect(windowOpenMock).toHaveBeenCalledWith('', '_blank');
    expect(openedWindow.location.href).toContain('https://wa.me/5512981956675?text=');
    expect(decodeURIComponent(openedWindow.location.href)).toContain('NF: NF-0001');
  });

  it('compartilha Pix por email baixando o PDF e abrindo mailto', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    const openedWindow = {
      location: { href: '' },
      close: vi.fn(),
    };
    const windowOpenMock = vi.spyOn(window, 'open').mockReturnValue(openedWindow as unknown as Window);
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client: {
          ...client,
          email: 'cliente@example.com',
        },
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.shareClosureGroupByEmail(pixGroup);
    });

    expect(buildClientOrdersPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        clientTotal: 120,
        paymentMethod: 'pix',
        pixCopyPaste: 'PIX-COPIA-E-COLA',
      }),
      { output: 'blob' },
    );
    expect(windowOpenMock).toHaveBeenCalledWith('', '_blank');
    expect(openedWindow.location.href).toContain('mailto:cliente%40example.com?subject=');
    expect(decodeURIComponent(openedWindow.location.href)).toContain('Pix copia e cola');
    expect(decodeURIComponent(openedWindow.location.href)).toContain('PIX-COPIA-E-COLA');
  });

  it('impede envio por email quando o email cadastrado é inválido', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    const windowOpenMock = vi.spyOn(window, 'open');
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client: {
          ...client,
          email: 'cliente-invalido',
        },
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await expect(result.current.shareClosureGroupByEmail(paidGroup)).rejects.toThrow(
      'O cliente não possui um e-mail válido cadastrado.',
    );
    expect(buildClientOrdersPdf).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
  });

  it('mantém erro de telefone inválido ao compartilhar por WhatsApp', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    const windowOpenMock = vi.spyOn(window, 'open');
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client: {
          ...client,
          contactNumber: '123',
        },
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await expect(result.current.shareClosureGroupOnWhatsApp(paidGroup)).rejects.toThrow(
      'O telefone do cliente é inválido para abrir o WhatsApp.',
    );
    expect(buildClientOrdersPdf).not.toHaveBeenCalled();
    expect(windowOpenMock).not.toHaveBeenCalled();
  });

  it('na consulta de notas geradas não carrega pedidos elegíveis na abertura', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        closureMode: true,
        viewMode: 'generated_notes',
      }),
    );

    await waitFor(() => expect(result.current.orders).toEqual([]));
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('atualiza metadados da caçamba localmente sem disparar refresh global', async () => {
    const onClosureStateChanged = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'ord-1',
            orderNumber: 5001,
            clientId: 'cli-1',
            clientName: 'Cliente Teste',
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
                contentType: '',
                price: undefined,
                orderId: 'ord-1',
                createdAt: '2026-05-10T10:00:00.000Z',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
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
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        closureMode: true,
        onClosureStateChanged,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.handleUpdateCacambaMeta('cac-1', {
        contentType: 'Entulho limpo',
        price: 180,
      });
    });

    expect(onClosureStateChanged).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.orders[0]?.cacambas?.[0]).toMatchObject({
      _id: 'cac-1',
      contentType: 'Entulho limpo',
      price: 180,
    });
  });

  it('atualiza dados completos da caçamba com FormData e preserva estado local', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'ord-1',
            orderNumber: 4001,
            clientId: 'cli-1',
            clientName: 'Cliente Teste',
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cacamba: {
            _id: 'cac-1',
            numero: '202',
            tipo: 'retirada',
            paymentStatus: 'pendente',
            contentType: 'Terra',
            price: 180,
            local: 'canteiro_obra',
            horaServicoDigitos: '456',
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        closureMode: true,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.handleUpdateCacambaFull('cac-1', {
        numero: '202',
        tipo: 'retirada',
        local: 'canteiro_obra',
        horaServicoDigitos: '456',
        contentType: 'Terra',
      });
    });

    const [, patchOptions] = fetchMock.mock.calls[1];
    expect(patchOptions.body).toBeInstanceOf(FormData);
    expect((patchOptions.body as FormData).get('numero')).toBe('202');
    expect((patchOptions.headers as Record<string, string>)['Content-Type']).toBeUndefined();
    expect(result.current.orders[0]?.cacambas?.[0]).toMatchObject({
      _id: 'cac-1',
      numero: '202',
      local: 'canteiro_obra',
      horaServicoDigitos: '456',
      contentType: 'Terra',
    });
  });

  it('usa paymentStatus metadata_pending no modal de informações pendentes', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        closureMode: true,
        paymentStatus: 'metadata_pending',
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstCallUrl = String((fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0]);
    expect(firstCallUrl).toContain('/clients/cli-1/orders?');
    expect(firstCallUrl).toContain('closure=true');
    expect(firstCallUrl).toContain('paymentStatus=metadata_pending');
  });

  it('envia data inicial sem exigir data final no modal de informações pendentes', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() =>
      useClientOrdersModal({
        client,
        startDate: '2026-05-15',
        type: 'retirada',
        closureMode: true,
        paymentStatus: 'metadata_pending',
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstCallUrl = String((fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0]);
    const url = new URL(firstCallUrl, 'http://localhost');
    expect(url.searchParams.get('startDate')).toBe('2026-05-15');
    expect(url.searchParams.has('endDate')).toBe(false);
    expect(url.searchParams.get('paymentStatus')).toBe('metadata_pending');
  });

  it('remove localmente a caçamba do modo metadata_pending quando a pendência é resolvida', async () => {
    const onClosureStateChanged = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'ord-1',
            orderNumber: 5001,
            clientId: 'cli-1',
            clientName: 'Cliente Teste',
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
                contentType: '',
                price: undefined,
                orderId: 'ord-1',
                createdAt: '2026-05-10T10:00:00.000Z',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
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
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        closureMode: true,
        paymentStatus: 'metadata_pending',
        onClosureStateChanged,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.handleUpdateCacambaMeta('cac-1', {
        contentType: 'Entulho limpo',
        price: 180,
      });
    });

    expect(onClosureStateChanged).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.orders).toEqual([]);
  });

  it('volta caçamba de grupo para pendente e remove do grupo local', async () => {
    const onClosureStateChanged = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            _id: 'grp-1',
            clientId: 'cli-1',
            clientSequenceNumber: 1,
            status: 'paga',
            invoiceNumber: 'NF-1',
            startDate: '2026-05-01T00:00:00.000Z',
            endDate: '2026-05-31T23:59:59.999Z',
            cacambaIds: [
              {
                _id: 'cac-1',
                numero: '101',
                tipo: 'retirada',
                paymentStatus: 'paga',
                price: 120,
                orderId: 'ord-1',
                createdAt: '2026-05-10T10:00:00.000Z',
              },
              {
                _id: 'cac-2',
                numero: '102',
                tipo: 'retirada',
                paymentStatus: 'paga',
                price: 80,
                orderId: 'ord-1',
                createdAt: '2026-05-10T10:00:00.000Z',
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cacamba: {
            _id: 'cac-1',
            numero: '101',
            tipo: 'retirada',
            paymentStatus: 'pendente',
            price: 120,
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
          deletedGroup: false,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useClientOrdersModal({
        client,
        closureMode: true,
        onClosureStateChanged,
      }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.fetchExistingClosureGroups('all');
    });

    expect(result.current.closureGroups[0]?.cacambaIds).toHaveLength(2);

    await act(async () => {
      await result.current.returnCacambaToPending('grp-1', 'cac-1');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/closure-groups/grp-1/cacambas/cac-1/reopen'),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(onClosureStateChanged).toHaveBeenCalledTimes(1);
    expect(result.current.closureGroups[0]?.cacambaIds.map((cacamba) => cacamba._id)).toEqual([
      'cac-2',
    ]);
  });
});
