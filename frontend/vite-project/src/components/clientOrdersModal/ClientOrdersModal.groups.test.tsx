import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
const downloadClosureReceiptMock = vi.fn(async () => undefined);
const saveInvoiceForGroupMock = vi.fn(async () => undefined);
const savePixInfoForGroupMock = vi.fn(async () => undefined);
const returnCacambaToPendingMock = vi.fn(async () => undefined);
const shareClosureGroupOnWhatsAppMock = vi.fn(async () => undefined);
const shareClosureGroupByEmailMock = vi.fn(async () => undefined);
const markPixGroupPaidMock = vi.fn(async () => undefined);
const handleUpdateCacambaFullMock = vi.fn(async () => undefined);
const setInvoiceNumberMock = vi.fn();
const setPixInfoMock = vi.fn();
const setIsEditingInvoiceMock = vi.fn();
const hookOverrides: { current: Record<string, unknown> } = { current: {} };

vi.mock('./useClientOrdersModal', () => ({
  useClientOrdersModal: () => {
    const base = {
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
    pixInfo: '',
    setPixInfo: setPixInfoMock,
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
    handleUpdateCacambaFull: handleUpdateCacambaFullMock,
    handleDownload: handleDownloadMock,
    downloadExistingClosureGroup: downloadExistingClosureGroupMock,
    downloadClosureReceipt: downloadClosureReceiptMock,
    shareClosureGroupOnWhatsApp: shareClosureGroupOnWhatsAppMock,
    shareClosureGroupByEmail: shareClosureGroupByEmailMock,
    saveInvoiceForGroup: saveInvoiceForGroupMock,
    savePixInfoForGroup: savePixInfoForGroupMock,
    markPixGroupPaid: markPixGroupPaidMock,
    returnCacambaToPending: returnCacambaToPendingMock,
    };
    return { ...base, ...hookOverrides.current };
  },
}));

describe('ClientOrdersModal (closure flow)', () => {
  beforeEach(() => {
    hookOverrides.current = {};
    vi.clearAllMocks();
  });

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
    expect(screen.getByTestId('closure-group-receipt-download')).toBeInTheDocument();
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

  it('abre modal de recibo, exige nome e confirma download do grupo pago', async () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    fireEvent.click(screen.getByTestId('closure-group-receipt-download'));

    expect(screen.getByTestId('closure-receipt-modal')).toBeInTheDocument();
    expect(screen.getByTestId('closure-receipt-confirm')).toBeDisabled();

    fireEvent.change(screen.getByTestId('closure-receipt-recipient-input'), {
      target: { value: 'Maria Cliente Completo' },
    });
    expect(screen.getByTestId('closure-receipt-confirm')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('closure-receipt-confirm'));

    await waitFor(() =>
      expect(downloadClosureReceiptMock).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'grp-1' }),
        'Maria Cliente Completo',
      ),
    );
  });

  it('exibe envio por WhatsApp e email para grupo de NF quando existem contato e email', async () => {
    render(
      <ClientOrdersModal
        client={{
          _id: 'client-1',
          clientName: 'Cliente Teste',
          contactNumber: '(12) 98195-6675',
          email: 'cliente@example.com',
        }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    expect(screen.getByText('Detalhes da nota fiscal')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-share-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-share-email')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('closure-group-share-whatsapp'));
    fireEvent.click(screen.getByTestId('closure-group-share-email'));

    await waitFor(() => expect(shareClosureGroupOnWhatsAppMock).toHaveBeenCalled());
    await waitFor(() => expect(shareClosureGroupByEmailMock).toHaveBeenCalled());
  });

  it('não exibe envio por email quando o cliente não tem email salvo', () => {
    render(
      <ClientOrdersModal
        client={{
          _id: 'client-1',
          clientName: 'Cliente Teste',
          contactNumber: '(12) 98195-6675',
        }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    expect(screen.getByTestId('closure-group-share-whatsapp')).toBeInTheDocument();
    expect(screen.queryByTestId('closure-group-share-email')).not.toBeInTheDocument();
  });

  it('exibe WhatsApp, email e informações em grupo Pix mantendo ações Pix', async () => {
    const pixGroup = {
      _id: 'grp-pix',
      clientId: 'client-1',
      status: 'pix_pendente' as const,
      paymentMethod: 'pix' as const,
      invoiceNumber: '',
      totalAmount: 100,
      pixCopyPaste: 'PIX-COPIA-E-COLA',
      pixInfo: 'Comprovante enviado pelo cliente',
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-31T23:59:59.999Z',
      createdAt: '2026-05-10T12:00:00.000Z',
      updatedAt: '2026-05-11T12:00:00.000Z',
      cacambaIds: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'retirada' as const,
          paymentStatus: 'pix_pendente' as const,
          contentType: 'Entulho limpo',
          price: 100,
          orderId: 'ord-1',
          createdAt: '2026-05-10T10:00:00.000Z',
        },
      ],
    };
    hookOverrides.current = {
      currentClosureGroup: pixGroup,
      closureGroups: [pixGroup],
      selectedGroupId: 'grp-pix',
      selectedGroup: pixGroup,
      pixInfo: 'Comprovante enviado pelo cliente',
    };

    render(
      <ClientOrdersModal
        client={{
          _id: 'client-1',
          clientName: 'Cliente Teste',
          contactNumber: '(12) 98195-6675',
          email: 'cliente@example.com',
        }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="pix_pending"
      />,
    );

    expect(screen.getByText('Detalhes do Pix')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-copy-pix')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código do Pix' })).toBeInTheDocument();
    expect(screen.queryByTestId('closure-group-edit-pix-info')).not.toBeInTheDocument();
    expect(screen.getByTestId('closure-group-mark-pix-paid')).toBeInTheDocument();
    expect(screen.queryByText('Informações do Pix: Comprovante enviado pelo cliente')).not.toBeInTheDocument();
    expect(screen.queryByText(/Valor total do Pix/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Pix copia e cola')).not.toBeInTheDocument();
    const pixGroupItem = screen.getByTestId('closure-group-item-grp-pix');
    expect(within(pixGroupItem).getByText('Pix: Comprovante enviado pelo cliente')).toBeInTheDocument();
    expect(within(pixGroupItem).queryByText('Pix')).not.toBeInTheDocument();
    expect(screen.queryByText('NF: -')).not.toBeInTheDocument();
    expect(screen.getByTestId('closure-group-pix-info-input')).toHaveValue(
      'Comprovante enviado pelo cliente',
    );
    fireEvent.change(screen.getByTestId('closure-group-pix-info-input'), {
      target: { value: 'Pix recebido em 12/05' },
    });
    expect(setPixInfoMock).toHaveBeenCalledWith('Pix recebido em 12/05');
    fireEvent.click(screen.getByTestId('closure-group-save-pix-info'));
    await waitFor(() =>
      expect(savePixInfoForGroupMock).toHaveBeenCalledWith('grp-pix', 'Comprovante enviado pelo cliente'),
    );
    expect(screen.getByTestId('closure-group-share-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-share-email')).toBeInTheDocument();
    expect(screen.queryByTestId('closure-group-receipt-download')).not.toBeInTheDocument();
  });

  it('usa modal para editar informações do Pix quando o grupo está finalizado', async () => {
    const pixGroup = {
      _id: 'grp-pix-paid',
      clientId: 'client-1',
      status: 'paga' as const,
      paymentMethod: 'pix' as const,
      invoiceNumber: '',
      totalAmount: 100,
      pixCopyPaste: 'PIX-COPIA-E-COLA',
      pixInfo: 'Pix identificado no banco',
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-31T23:59:59.999Z',
      createdAt: '2026-05-10T12:00:00.000Z',
      updatedAt: '2026-05-11T12:00:00.000Z',
      cacambaIds: [],
    };
    hookOverrides.current = {
      currentClosureGroup: pixGroup,
      closureGroups: [pixGroup],
      selectedGroupId: 'grp-pix-paid',
      selectedGroup: pixGroup,
      pixInfo: 'Pix identificado no banco',
    };

    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    expect(screen.getByTestId('closure-group-copy-pix')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código do Pix' })).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-edit-pix-info')).toBeInTheDocument();
    expect(screen.queryByTestId('closure-group-pix-info-input')).not.toBeInTheDocument();
    expect(screen.queryByText(/Valor total do Pix/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Pix copia e cola')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('closure-group-edit-pix-info'));
    expect(screen.getByTestId('closure-group-pix-info-modal')).toBeInTheDocument();
    expect(screen.getByTestId('closure-group-pix-info-input')).toHaveValue('Pix identificado no banco');

    fireEvent.click(screen.getByTestId('closure-group-save-pix-info'));
    await waitFor(() =>
      expect(savePixInfoForGroupMock).toHaveBeenCalledWith('grp-pix-paid', 'Pix identificado no banco'),
    );
  });

  it('confirma volta da caçamba do grupo para pendente', async () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Voltar para pendente' })[0]);
    expect(screen.getByText('Voltar caçamba para pendente')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Voltar para pendente' })[1]);

    await waitFor(() =>
      expect(returnCacambaToPendingMock).toHaveBeenCalledWith('grp-1', 'cac-1'),
    );
  });

  it('permite editar caçamba em grupo pago sem sair da etapa atual', async () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="paid"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar caçamba' }));
    expect(await screen.findByText('Editar Caçamba #101')).toBeInTheDocument();

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '202' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: '456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(handleUpdateCacambaFullMock).toHaveBeenCalledWith(
        'cac-1',
        expect.objectContaining({
          numero: '202',
          horaServicoDigitos: '456',
          tipo: 'retirada',
          contentType: 'Entulho limpo',
        }),
      ),
    );
    expect(screen.getByTestId('closure-groups-list')).toBeInTheDocument();
  });

  it('avança para a etapa de NF no mesmo modal após gerar o fechamento', async () => {
    hookOverrides.current = {
      clientTotal: 100,
      selectedTotal: 40,
    };
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

    expect(screen.getByText(/Total do fechamento:/i)).toHaveTextContent('R$ 40,00');

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

  it('oculta stepper e resumo no modo de informações pendentes', () => {
    render(
      <ClientOrdersModal
        client={{ _id: 'client-1', clientName: 'Cliente Teste' }}
        onClose={vi.fn()}
        closureMode
        paymentStatus="metadata_pending"
      />,
    );

    expect(screen.queryByTestId('closure-stepper')).not.toBeInTheDocument();
    expect(screen.queryByText(/Total do cliente \(Retiradas\):/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quantidade total de pedidos:/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('client-orders-download')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Gerar fechamento' })).not.toBeInTheDocument();
  });
});
