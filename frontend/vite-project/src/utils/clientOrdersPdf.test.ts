import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildClientOrdersPdf } from './clientOrdersPdf';

const autoTableMock = vi.fn((doc: any, _options: any) => {
  _options.willDrawPage?.({ pageNumber: 1 });
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
    motorista: { username: 'Retirador' },
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
        client: { _id: 'cli-1', clientName: 'Cliente Teste' },
        startDate: '2026-05-01',
        endDate: '2026-05-31',
        type: 'retirada',
        clientTotal: 120,
        orders: [baseOrder],
      },
      { output: 'blob' },
    );

    expect(autoTableMock).toHaveBeenCalledTimes(2);
    const summary = autoTableMock.mock.calls[0]?.[1]!;
    const details = autoTableMock.mock.calls[1]?.[1]!;
    expect(summary).toBeDefined();
    expect(details).toBeDefined();
    const allPdfText = JSON.stringify([summary.head, summary.body, details.head, details.body]);

    expect(summary.head).toEqual([['Resumo do Relatorio', '']]);
    expect(summary.headStyles.fillColor).toEqual([227, 6, 19]);
    expect(details.headStyles.fillColor).toEqual([227, 6, 19]);
    expect(details.tableWidth).toBe(277);
    expect(
      Object.values(details.columnStyles).reduce(
        (sum: number, column: any) => sum + Number(column.cellWidth || 0),
        0,
      ),
    ).toBe(277);
    expect(allPdfText).not.toContain('Tipo aplicado');
    expect(allPdfText).not.toContain('(Retiradas)');
    expect(allPdfText).not.toContain('Conteudo');
    expect(details.body[0][0]).toBe('101');
    expect(details.head[0]).toEqual([
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
    expect(details.body[0]).toHaveLength(12);
    expect(details.body[0][5]).toBe('Entregador');
    expect(details.body[0][6]).toBe('ENT1A23');
    expect(details.body[0][7]).toBe('10');
    expect(details.body[0][9]).toBe('Retirador');
    expect(details.body[0][10]).toBe('RET1A23');
    expect(details.body[0][11]).toBe('20');
    expect(addImageMock).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'PNG',
      10,
      8,
      49,
      49 / (300 / 110),
    );
    expect(textMock.mock.calls.map(([text]) => text)).toEqual(
      expect.arrayContaining([
        'Dados Bancarios',
        'Banco: Sicredi',
        'Ag.: 0710  C/C: 58930-2',
        'PIX CNPJ: 14.071.560/0001-41',
      ]),
    );
    expect(summary.margin.top).toBe(38);
    expect(details.margin.top).toBe(38);
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

    const summary = autoTableMock.mock.calls[0]?.[1]!;
    expect(summary.body.some((row: string[]) => row[0] === 'Periodo')).toBe(false);
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
        }) as any,
    );
    autoTableMock
      .mockImplementationOnce((doc: any, options: any) => {
        options.willDrawPage?.({ pageNumber: 1 });
        doc.lastAutoTable = { finalY: 30 };
      })
      .mockImplementationOnce((_doc: any, options: any) => {
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

    expect(addImageMock).toHaveBeenCalledTimes(2);
  });
});
