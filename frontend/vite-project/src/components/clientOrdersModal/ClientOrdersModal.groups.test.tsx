import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientOrdersModal from '../ClientOrdersModal';

const handleDownloadMock = vi.fn(async () => ({
  _id: 'grp-1',
  clientId: 'client-1',
  status: 'nota_fiscal_pendente' as const,
  invoiceNumber: '',
  startDate: '2026-05-01T00:00:00.000Z',
  endDate: '2026-05-31T23:59:59.999Z',
  createdAt: '2026-05-10T12:00:00.000Z',
  updatedAt: '2026-05-10T12:00:00.000Z',
  cacambaIds: [
    {
      _id: 'cac-1',
      numero: '101',
      tipo: 'retirada' as const,
      paymentStatus: 'nota_fiscal_pendente' as const,
      contentType: 'Entulho limpo',
      price: 100,
      orderId: 'ord-1',
      createdAt: '2026-05-10T10:00:00.000Z',
    },
    {
      _id: 'cac-2',
      numero: '102',
      tipo: 'retirada' as const,
      paymentStatus: 'nota_fiscal_pendente' as const,
      contentType: 'Entulho limpo',
      price: 50,
      orderId: 'ord-1',
      createdAt: '2026-05-10T10:00:00.000Z',
    },
  ],
}));

const downloadExistingClosureGroupMock = vi.fn(async () => undefined);
const saveInvoiceForGroupMock = vi.fn(async () => undefined);
const setInvoiceNumberMock = vi.fn();
const setIsEditingInvoiceMock = vi.fn();

vi.mock('./useClientOrdersModal', () => ({
  useClientOrdersModal: () => ({
    orders: [
      {
        _id: 'ord-1',
        orderNumber: 4001,
        clientId: 'client-1',
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
            price: 100,
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
        ],
      },
    ],
    currentClosureGroup: {
      _id: 'grp-1',
      clientId: 'client-1',
      status: 'paga',
      invoiceNumber: 'NF-0001',
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
          price: 100,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
      ],
    },
    closureGroups: [
      {
        _id: 'grp-1',
        clientId: 'client-1',
        status: 'paga',
        invoiceNumber: 'NF-0001',
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
            price: 100,
            orderId: 'ord-1',
            createdAt: '2026-05-10T10:00:00.000Z',
          },
        ],
      },
      {
        _id: 'grp-0',
        clientId: 'client-1',
        status: 'paga',
        invoiceNumber: 'NF-0000',
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-04-30T23:59:59.999Z',
        createdAt: '2026-04-10T12:00:00.000Z',
        updatedAt: '2026-04-11T12:00:00.000Z',
        cacambaIds: [],
      },
    ],
    selectedGroupId: 'grp-1',
    setSelectedGroupId: vi.fn(),
    selectedGroup: {
      _id: 'grp-1',
      clientId: 'client-1',
      status: 'paga',
      invoiceNumber: 'NF-0001',
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
          price: 100,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
      ],
    },
    invoiceNumber: 'NF-0001',
    setInvoiceNumber: setInvoiceNumberMock,
    isEditingInvoice: false,
    setIsEditingInvoice: setIsEditingInvoiceMock,
    modalImage: null,
    setModalImage: vi.fn(),
    selectedCacambaIds: ['cac-1'],
    isSubmittingPayment: false,
    isLoadingHistory: false,
    cacambaMetaModal: null,
    setCacambaMetaModal: vi.fn(),
    selectedOrders: [],
    clientTotal: 100,
    selectedTotal: 100,
    fetchOrders: vi.fn(async () => undefined),
    fetchEligibleOrders: vi.fn(async () => undefined),
    fetchExistingClosureGroups: vi.fn(async () => undefined),
    toggleSelectCacamba: vi.fn(),
    handleUpdateCacambaMeta: vi.fn(async () => undefined),
    handleDownload: handleDownloadMock,
    downloadExistingClosureGroup: downloadExistingClosureGroupMock,
    saveInvoiceForGroup: saveInvoiceForGroupMock,
  }),
}));

describe('ClientOrdersModal (closure flow)', () => {
  it('exibe ações de baixar novamente e editar NF em grupo pago', async () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    expect(screen.getByTestId('closure-stepper')).toBeInTheDocument();
    expect(screen.getByText('Detalhes da nota fiscal')).toBeInTheDocument();
    expect(screen.getByTestId('closure-groups-list')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-download')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-edit-invoice')).toBeInTheDocument();
    expect(screen.queryByTestId('closure-group-save-invoice')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver grupos anteriores/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('closure-group-download')).toHaveStyle({
      background: 'rgb(227, 6, 19)',
      color: 'rgb(255, 255, 255)',
    });

    fireEvent.click(screen.getByTestId('closure-group-download'));
    expect(downloadExistingClosureGroupMock).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('closure-group-edit-invoice'));
    expect(setInvoiceNumberMock).toHaveBeenCalledWith('NF-0001');
    expect(setIsEditingInvoiceMock).toHaveBeenCalledWith(true);
  });

  it('avança para a etapa de NF no mesmo modal após gerar o fechamento', async () => {
    vi.mocked(handleDownloadMock).mockResolvedValueOnce({
      _id: 'grp-2',
      clientId: 'client-1',
      status: 'nota_fiscal_pendente',
      invoiceNumber: '',
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-31T23:59:59.999Z',
      createdAt: '2026-05-10T12:00:00.000Z',
      updatedAt: '2026-05-10T12:00:00.000Z',
      cacambaIds: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'retirada',
          paymentStatus: 'nota_fiscal_pendente',
          contentType: 'Entulho limpo',
          price: 100,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
      ],
    });

    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="pending"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Gerar fechamento' }));

    expect(await screen.findByText('Detalhes da nota fiscal')).toBeInTheDocument();
    expect(handleDownloadMock).toHaveBeenCalled();
  });
  it('abre notas geradas direto na lista de grupos sem CTA de fechamento', () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        viewMode="generated_notes"
      />,
    );

    expect(screen.queryByTestId('closure-stepper')).not.toBeInTheDocument();
    expect(screen.getByTestId('closure-groups-list')).toBeInTheDocument();
    expect(screen.queryByTestId('client-orders-download')).not.toBeInTheDocument();
  });
});
