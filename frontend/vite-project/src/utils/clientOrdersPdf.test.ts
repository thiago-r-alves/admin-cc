import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildClientOrdersPdf } from './clientOrdersPdf';

type AutoTableOptions = {
  willDrawPage?: (input: { pageNumber: number }) => void;
  didParseCell?: (input: AutoTableCellHookInput) => void;
  head?: string[][];
  body?: string[][];
  headStyles?: { fillColor?: number[] };
  tableWidth?: number;
  columnStyles?: Record<string, { cellWidth?: number }>;
  margin?: { top?: number };
};

type AutoTableCellHookInput = {
  section?: string;
  column?: { index?: number };
  cell?: { styles: { textColor?: number[] } };
};

type MockPdfDoc = {
  lastAutoTable?: { finalY?: number };
  internal: { pageSize: { getWidth: () => number } };
  getCurrentPageInfo: () => { pageNumber: number };
  addImage: ReturnType<typeof vi.fn>;
  setFont: ReturnType<typeof vi.fn>;
  setTextColor: ReturnType<typeof vi.fn>;
  setFontSize: ReturnType<typeof vi.fn>;
  text: ReturnType<typeof vi.fn>;
  setDrawColor: ReturnType<typeof vi.fn>;
  setLineWidth: ReturnType<typeof vi.fn>;
  line: ReturnType<typeof vi.fn>;
  output: ReturnType<typeof vi.fn>;
};

const autoTableMock = vi.fn((doc: MockPdfDoc, options: AutoTableOptions) => {
  options.willDrawPage?.({ pageNumber: 1 });
  doc.lastAutoTable = { finalY: 30 };
});

const addImageMock = vi.fn();
const textMock = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    lastAutoTable: { finalY: 20 },
    internal: {
      pageSize: {
        getWidth: vi.fn(() => 297),
      },
    },
    getCurrentPageInfo: vi.fn(() => ({ pageNumber: 1 })),
    addImage: addImageMock,
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    text: textMock,
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    output: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' })),
  })),
}));

vi.mock('jspdf-autotable', () => ({
  default: autoTableMock,
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(async (text: string) => `data:image/png;base64,qr-${text}`),
}));

describe('buildClientOrdersPdf', () => {
  beforeEach(() => {
    autoTableMock.mockClear();
    addImageMock.mockClear();
    textMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      })),
    );
  });

  const baseOrder = {
    _id: 'ord-2',
    orderNumber: 20,
    clientId: 'cli-1',
    clientName: 'Cliente Teste',
    contactName: '',
    contactNumber: '',
    neighborhood: '',
    address: '',
    addressNumber: '',
    type: 'retirada' as const,
    priority: 0,
    status: 'concluido' as const,
    motorista: { _id: 'drv-1', username: 'Retirador' },
    placa: 'RET1A23',
    cacambas: [
      {
        _id: 'cac-1',
        numero: '101',
        tipo: 'retirada' as const,
        paymentStatus: 'pendente' as const,
        contentType: 'Entulho limpo' as const,
        price: 120,
        local: 'via_publica',
        orderId: 'ord-2',
        createdAt: '2026-05-10T15:00:00.000Z',
        horaServicoDigitos: '123',
        closureDelivery: {
          date: '2026-05-01T10:00:00.000Z',
          driverName: 'Entregador',
          placa: 'ENT1A23',
          orderNumber: 10,
        },
        closureWithdrawal: {
          date: '2026-05-10T15:00:00.000Z',
          driverName: 'Retirador',
          placa: 'RET1A23',
          orderNumber: 20,
        },
      },
    ],
  };

  it('gera PDF de fechamento com campos de entrega/retirada e sem labels removidas', async () => {
    await buildClientOrdersPdf(
      {
        client: {
          _id: 'cli-1',
          clientName: 'Cliente Teste',
          address: 'Rua Central',
          addressNumber: '123',
          neighborhood: 'Centro',
          city: 'Sao Jose dos Campos',
          cep: '12200-000',
        },
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        clientTotal: 120,
        orders: [baseOrder],
      },
      { output: 'blob' },
    );

    expect(autoTableMock).toHaveBeenCalledTimes(2);
    const summary = autoTableMock.mock.calls[0]?.[1];
    const details = autoTableMock.mock.calls[1]?.[1];
    if (!summary || !details) throw new Error('PDF tables were not rendered.');
    const allPdfText = JSON.stringify([summary.head, summary.body, details.head, details.body]);

    expect(summary.head).toEqual([['Resumo do Relatorio', '']]);
    expect(summary.body).toContainEqual([
      'Endereco',
      'Rua Central, 123 - Centro - Sao Jose dos Campos - CEP 12200-000',
    ]);
    expect(summary.headStyles?.fillColor).toEqual([227, 6, 19]);
    expect(details.headStyles?.fillColor).toEqual([227, 6, 19]);
    expect(details.tableWidth).toBe(277);
    expect(
      Object.values(details.columnStyles ?? {}).reduce(
        (sum, column) => sum + Number(column.cellWidth || 0),
        0,
      ),
    ).toBe(277);
    expect(allPdfText).not.toContain('Tipo aplicado');
    expect(allPdfText).not.toContain('(Retiradas)');
    expect(allPdfText).not.toContain('Conteudo');
    expect(allPdfText).not.toContain('Pagamento via Pix');
    expect(allPdfText).not.toContain('Pix copia e cola');
    const firstDetailsRow = details.body?.[0] ?? [];
    expect(firstDetailsRow[0]).toBe('101');
    expect(details.head?.[0]).toEqual([
      'Cacamba',
      'Local',
      'OS',
      'Valor',
      'Data entrega',
      'Motorista entrega',
      'Placa entrega',
      'Pedido entrega',
      'Data retirada',
      'Motorista retirada',
      'Placa retirada',
      'Pedido retirada',
    ]);
    expect(firstDetailsRow).toHaveLength(12);
    expect(firstDetailsRow[5]).toBe('Entregador');
    expect(firstDetailsRow[6]).toBe('ENT1A23');
    expect(firstDetailsRow[7]).toBe('10');
    expect(firstDetailsRow[9]).toBe('Retirador');
    expect(firstDetailsRow[10]).toBe('RET1A23');
    expect(firstDetailsRow[11]).toBe('20');

    const getBodyTextColorForColumn = (columnIndex: number) => {
      const cell: NonNullable<AutoTableCellHookInput['cell']> = { styles: {} };
      details.didParseCell?.({ section: 'body', column: { index: columnIndex }, cell });
      return cell.styles.textColor;
    };

    expect(getBodyTextColorForColumn(0)).toEqual([227, 6, 19]);
    expect(getBodyTextColorForColumn(7)).toEqual([227, 6, 19]);
    expect(getBodyTextColorForColumn(11)).toEqual([227, 6, 19]);
    expect(getBodyTextColorForColumn(6)).toBeUndefined();
    expect(getBodyTextColorForColumn(10)).toBeUndefined();
    expect(addImageMock).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'PNG',
      10,
      8,
      49,
      49 / (300 / 110),
    );
    expect(addImageMock).toHaveBeenCalledWith(
      expect.stringContaining('data:image/png;base64,qr-'),
      'PNG',
      253,
      7,
      34,
      34,
    );
    expect(textMock.mock.calls.map(([text]) => text)).toEqual(
      expect.arrayContaining([
        'Dados Bancarios',
        'Banco: Sicredi',
        'Ag.: 0710  C/C: 58930-2',
        'PIX CNPJ: 14.071.560/0001-41',
      ]),
    );
    expect(summary.margin?.top).toBe(46);
    expect(details.margin?.top).toBe(46);
  });

  it('omite a linha de periodo quando o periodo nao foi definido', async () => {
    await buildClientOrdersPdf(
      {
        client: { _id: 'cli-1', clientName: 'Cliente Teste' },
        type: 'retirada',
        clientTotal: 120,
        orders: [baseOrder],
      },
      { output: 'blob' },
    );

    const summary = autoTableMock.mock.calls[0]?.[1];
    if (!summary) throw new Error('Summary table was not rendered.');
    expect(summary.body?.some((row) => row[0] === 'Periodo')).toBe(false);
    expect(summary.body).toContainEqual(['Endereco', '-']);
  });

  it('desenha o cabecalho uma unica vez em cada pagina do PDF', async () => {
    let currentPage = 1;
    const pageInfoMock = vi.fn(() => ({ pageNumber: currentPage }));
    const { jsPDF } = await import('jspdf');
    vi.mocked(jsPDF).mockImplementationOnce(
      () =>
        ({
          lastAutoTable: { finalY: 20 },
          internal: {
            pageSize: { getWidth: vi.fn(() => 297) },
          },
          getCurrentPageInfo: pageInfoMock,
          addImage: addImageMock,
          setFont: vi.fn(),
          setTextColor: vi.fn(),
          setFontSize: vi.fn(),
          text: textMock,
          setDrawColor: vi.fn(),
          setLineWidth: vi.fn(),
          line: vi.fn(),
          output: vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' })),
        }) as unknown as InstanceType<typeof jsPDF>,
    );
    autoTableMock
      .mockImplementationOnce((doc: MockPdfDoc, options: AutoTableOptions) => {
        options.willDrawPage?.({ pageNumber: 1 });
        doc.lastAutoTable = { finalY: 30 };
      })
      .mockImplementationOnce((_doc: MockPdfDoc, options: AutoTableOptions) => {
        options.willDrawPage?.({ pageNumber: 1 });
        currentPage = 2;
        options.willDrawPage?.({ pageNumber: 2 });
      });

    await buildClientOrdersPdf(
      {
        client: { _id: 'cli-1', clientName: 'Cliente Teste' },
        clientTotal: 120,
        orders: [baseOrder],
      },
      { output: 'blob' },
    );

    expect(addImageMock).toHaveBeenCalledTimes(4);
  });
});
