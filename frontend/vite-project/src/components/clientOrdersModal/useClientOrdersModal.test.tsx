import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClientOrdersModal } from './useClientOrdersModal';
import { downloadClientOrdersPdf } from '../../utils/clientOrdersPdf';

vi.mock('../../utils/clientOrdersPdf', () => ({
  downloadClientOrdersPdf: vi.fn(async () => undefined),
}));

const client = { _id: 'cli-1', clientName: 'Cliente Teste' };

describe('useClientOrdersModal', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token-test');
    vi.restoreAllMocks();
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
});
