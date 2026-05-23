import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClientOrdersModal } from './useClientOrdersModal';

vi.mock('../../utils/clientOrdersPdf', () => ({
  downloadClientOrdersPdf: vi.fn(async () => undefined),
}));

const client = { _id: 'cli-1', clientName: 'Cliente Teste' };

describe('useClientOrdersModal', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token-test');
    vi.restoreAllMocks();
  });

  it('carrega pedidos com query de fechamento e paymentStatus', async () => {
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
        paymentStatus: 'pending',
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
});
