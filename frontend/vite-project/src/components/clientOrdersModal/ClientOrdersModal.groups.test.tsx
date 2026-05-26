import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientOrdersModal from '../ClientOrdersModal';

vi.mock('./useClientOrdersModal', () => ({
  useClientOrdersModal: () => ({
    orders: [],
    modalImage: null,
    setModalImage: vi.fn(),
    selectedCacambaIds: [],
    closureGroups: [
      {
        _id: 'grp-1',
        clientId: 'client-1',
        // sem clientSequenceNumber para validar fallback visual
        status: 'paga',
        invoiceNumber: '000.111.222',
        startDate: '2026-05-01T00:00:00.000Z',
        endDate: '2026-05-31T23:59:59.999Z',
        createdAt: '2026-05-10T12:00:00.000Z',
        updatedAt: '2026-05-20T12:00:00.000Z',
        cacambaIds: [
          {
            _id: 'cac-1',
            numero: '101',
            tipo: 'retirada',
            paymentStatus: 'paga',
            contentType: 'Entulho limpo',
            price: 100,
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
          {
            _id: 'cac-2',
            numero: '102',
            tipo: 'retirada',
            paymentStatus: 'paga',
            contentType: 'Entulho limpo',
            price: 50,
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
        ],
      },
    ],
    selectedGroupId: 'grp-1',
    setSelectedGroupId: vi.fn(),
    selectedGroup: {
      _id: 'grp-1',
      clientId: 'client-1',
      status: 'paga',
      invoiceNumber: '000.111.222',
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-31T23:59:59.999Z',
      createdAt: '2026-05-10T12:00:00.000Z',
      updatedAt: '2026-05-20T12:00:00.000Z',
      cacambaIds: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'retirada',
          paymentStatus: 'paga',
          contentType: 'Entulho limpo',
          price: 100,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
        {
          _id: 'cac-2',
          numero: '102',
          tipo: 'retirada',
          paymentStatus: 'paga',
          contentType: 'Entulho limpo',
          price: 50,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
      ],
    },
    invoiceNumber: '',
    setInvoiceNumber: vi.fn(),
    isSubmittingPayment: false,
    cacambaMetaModal: null,
    setCacambaMetaModal: vi.fn(),
    clientTotal: 0,
    fetchOrders: vi.fn(async () => undefined),
    toggleSelectCacamba: vi.fn(),
    handleUpdateCacambaMeta: vi.fn(async () => undefined),
    handleDownload: vi.fn(async () => undefined),
    saveInvoiceForGroup: vi.fn(async () => undefined),
  }),
}));

describe('ClientOrdersModal (groups mode)', () => {
  it('renderiza detalhes da nota fiscal sem bloco de pedido e com total', () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    expect(screen.getByText('Detalhes da nota fiscal')).toBeInTheDocument();
    expect(screen.getByText(/Grupo #1/)).toBeInTheDocument();
    expect(screen.getByText(/Valor total da nota:/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument();
    expect(screen.queryByText(/Status:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quantidade total de pedidos:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quantidade total de ca.*mbas:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ca.*mbas selecionadas:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pedido #/i)).not.toBeInTheDocument();
  });
});
