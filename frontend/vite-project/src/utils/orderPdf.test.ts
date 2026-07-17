import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../interfaces';
import { downloadOrderPdf } from './orderPdf';

type AutoTableOptions = {
  head?: string[][];
  body?: string[][];
  styles?: { textColor?: number[]; fontStyle?: string };
  headStyles?: { fillColor?: number[]; textColor?: number[]; fontStyle?: string };
};

type MockPdfDoc = {
  lastAutoTable?: { finalY?: number };
  addImage: ReturnType<typeof vi.fn>;
  addPage: ReturnType<typeof vi.fn>;
  setFont: ReturnType<typeof vi.fn>;
  setFontSize: ReturnType<typeof vi.fn>;
  setTextColor: ReturnType<typeof vi.fn>;
  text: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

const autoTableMock = vi.fn((doc: MockPdfDoc, options: AutoTableOptions) => {
  void options;
  doc.lastAutoTable = { finalY: 42 };
});
const addImageMock = vi.fn();
const saveMock = vi.fn();
const textMock = vi.fn();

vi.mock('../services/api', () => ({
  apiUrl: 'http://api.local',
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    lastAutoTable: { finalY: 20 },
    addImage: addImageMock,
    addPage: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: textMock,
    save: saveMock,
  })),
}));

vi.mock('jspdf-autotable', () => ({
  default: autoTableMock,
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(async (text: string) => `data:image/png;base64,qr-${text}`),
}));

const baseOrder: IOrder = {
  _id: 'ord-1',
  orderNumber: 101,
  clientName: 'Cliente Teste',
  contactName: 'Responsável',
  contactNumber: '(12) 99999-0000',
  neighborhood: 'Centro',
  address: 'Rua A',
  addressNumber: '10',
  type: 'entrega',
  priority: 0,
  status: 'concluido',
  motorista: { _id: 'drv-1', username: 'motorista teste' },
  cacambas: [],
  imageUrls: [],
  createdAt: '2026-05-16T10:00:00.000Z',
  updatedAt: '2026-05-16T11:00:00.000Z',
  cacambaPrice: 250,
};

const findProofTable = () =>
  autoTableMock.mock.calls
    .map((call) => call[1] as AutoTableOptions)
    .find((options) => options.head?.[0]?.[0] === 'Comprovante da locação');

const firstTable = () => autoTableMock.mock.calls[0]?.[1] as AutoTableOptions | undefined;

describe('downloadOrderPdf', () => {
  beforeEach(() => {
    autoTableMock.mockClear();
    addImageMock.mockClear();
    saveMock.mockClear();
    textMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        blob: async () => new Blob(['signature'], { type: 'image/png' }),
      })),
    );
  });

  it('inclui comprovante assinado e imagem da assinatura', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      deliveryProof: {
        type: 'signed',
        signatureImageUrl: '/files/signature-1',
        capturedAt: '2026-05-16T11:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'motorista teste',
      },
    });

    expect(findProofTable()?.body).toEqual(expect.arrayContaining([
      ['Comprovante', 'Assinatura pelo recebimento da locação'],
      ['Comprovante coletado por', 'Motorista Teste'],
    ]));
    expect(fetch).toHaveBeenCalledWith('http://api.local/files/signature-1');
    expect(addImageMock).toHaveBeenCalledWith(expect.stringContaining('data:image/png'), 'PNG', expect.any(Number), expect.any(Number), 88, 34);
    expect(saveMock).toHaveBeenCalledWith('Cliente_Teste_os_digital_101.pdf');
  });

  it('remove cabecalho, campos desnecessarios e valor total da tabela principal', async () => {
    await downloadOrderPdf(baseOrder);

    const table = firstTable();
    expect(table?.head).toBeUndefined();
    expect(table?.body).toEqual([
      ['Número do Pedido', '101'],
      ['Tipo', 'Entrega'],
      ['Cliente', 'Cliente Teste'],
      ['Endereço', 'Rua A, 10 - Centro'],
      ['Motorista', 'Motorista Teste'],
      ['Finalizado em', expect.any(String)],
    ]);
    const tableText = JSON.stringify(table?.body);
    expect(tableText).not.toContain('Campo');
    expect(tableText).not.toContain('Status');
    expect(tableText).not.toContain('Contato');
    expect(tableText).not.toContain('Criado em');
    expect(tableText).not.toContain('Valor');
    expect(tableText).not.toContain('R$');
    expect(saveMock).toHaveBeenCalledWith('Cliente_Teste_os_digital_101.pdf');
  });

  it('salva o arquivo com nome do cliente e numero da OS digital', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      clientName: 'Cliente São José / Obra 1',
      orderNumber: 987,
    });

    expect(saveMock).toHaveBeenCalledWith('Cliente_Sao_Jose_Obra_1_os_digital_987.pdf');
  });

  it('inclui QR Code Pix com dados ao lado apos a assinatura sem criar secao de pagamento', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      deliveryProof: {
        type: 'signed',
        signatureImageUrl: '/files/signature-1',
        capturedAt: '2026-05-16T11:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'motorista teste',
      },
    }, { includePaymentQrCode: true });

    const tables = autoTableMock.mock.calls.map((call) => call[1] as AutoTableOptions);
    const tablesText = JSON.stringify(tables);
    expect(tables.some((table) => table.head?.[0]?.[0] === 'Pagamento Pix')).toBe(false);
    expect(tablesText).not.toContain('Valor do pedido');
    expect(tablesText).not.toContain('Pix copia e cola');
    expect(textMock.mock.calls.map(([text]) => text)).toEqual(expect.arrayContaining([
      'QR Code Pix para pagamento',
      'Dados Pix',
      'Banco: Sicredi',
      'Ag.: 0710  C/C: 58930-2',
      'PIX CNPJ: 14.071.560/0001-41',
    ]));
    const textCalls = textMock.mock.calls.map(([text]) => text);
    expect(textCalls.indexOf('Assinatura pelo recebimento da locação')).toBeLessThan(
      textCalls.indexOf('QR Code Pix para pagamento'),
    );
    expect(addImageMock).toHaveBeenCalledWith(
      expect.stringContaining('data:image/png;base64,qr-'),
      'PNG',
      expect.any(Number),
      expect.any(Number),
      42,
      42,
    );
  });

  it('usa vermelho padrao do projeto nos cabecalhos do pdf', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      cacambas: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'entrega',
          paymentStatus: 'pendente',
          local: 'via_publica',
          contentType: 'Entulho limpo',
          price: 120,
          orderId: 'ord-1',
          createdAt: '2026-05-16T10:30:00.000Z',
        },
        {
          _id: 'cac-2',
          numero: '102',
          tipo: 'retirada',
          paymentStatus: 'pendente',
          local: 'canteiro_obra',
          contentType: 'Terra',
          price: 130,
          orderId: 'ord-1',
          createdAt: '2026-05-16T10:35:00.000Z',
        },
      ],
    });

    const tables = autoTableMock.mock.calls.map((call) => call[1] as AutoTableOptions);
    expect(tables[1]?.head).toEqual([['Detalhes Individuais', '']]);
    expect(tables[1]?.body).toEqual(expect.arrayContaining([
      ['Local', 'Via Publica'],
      ['Conteúdo', 'Entulho Limpo'],
      ['Local', 'Canteiro De Obra'],
      ['Conteúdo', 'Terra'],
    ]));
    expect(JSON.stringify(tables[1]?.body)).not.toContain('"Tipo"');
    expect(JSON.stringify(tables[1]?.body)).not.toContain('"Valor"');
    expect(JSON.stringify(tables[1]?.body)).not.toContain('R$');
    expect(tables[1]?.headStyles?.fillColor).toEqual([227, 6, 19]);
    expect(tables[1]?.headStyles?.textColor).toEqual([255, 255, 255]);
    expect(tables[1]?.headStyles?.fontStyle).toBe('bold');
    expect(findProofTable()?.head).toEqual([['Comprovante da locação', '']]);
    expect(findProofTable()?.headStyles?.fillColor).toEqual([227, 6, 19]);
  });

  it('usa texto preto real e mais forte para melhorar impressao', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      cacambas: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'entrega',
          paymentStatus: 'pendente',
          local: 'via_publica',
          contentType: 'Entulho limpo',
          orderId: 'ord-1',
          createdAt: '2026-05-16T10:30:00.000Z',
        },
      ],
      deliveryProof: {
        type: 'signed',
        signatureImageUrl: '/files/signature-1',
        capturedAt: '2026-05-16T11:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'motorista teste',
      },
    });

    const tables = autoTableMock.mock.calls.map((call) => call[1] as AutoTableOptions);
    expect(tables.every((table) => table.styles?.textColor?.join(',') === '0,0,0')).toBe(true);
    expect(tables.every((table) => table.styles?.fontStyle === 'bold')).toBe(true);
  });

  it('mantem numero do pedido e numero da cacamba em preto como o restante', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      cacambas: [
        {
          _id: 'cac-1',
          numero: '101',
          tipo: 'entrega',
          paymentStatus: 'pendente',
          local: 'via_publica',
          contentType: 'Entulho limpo',
          orderId: 'ord-1',
          createdAt: '2026-05-16T10:30:00.000Z',
        },
      ],
    });

    const tables = autoTableMock.mock.calls.map((call) => call[1] as AutoTableOptions);
    expect(tables[0]?.styles?.textColor).toEqual([0, 0, 0]);
    expect(tables[1]?.styles?.textColor).toEqual([0, 0, 0]);
    expect(tables[0]).not.toHaveProperty('didParseCell');
    expect(tables[1]).not.toHaveProperty('didParseCell');
  });

  it('identifica comprovante reutilizado e a OS digital de origem', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      deliveryProof: {
        type: 'signed',
        signatureImageUrl: '/files/signature-original',
        capturedAt: '2026-05-16T11:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'motorista teste',
        isReused: true,
        reusedFromOrderId: 'ord-original',
        reusedFromOrderNumber: 99,
        reusedAt: '2026-05-16T14:00:00.000Z',
      },
    });

    expect(findProofTable()?.body).toEqual(expect.arrayContaining([
      ['Reutilização', 'Comprovante reutilizado'],
      ['OS digital de origem', '#99'],
    ]));
    expect(JSON.stringify(findProofTable()?.body)).not.toContain('Motorista do pedido');
    expect(fetch).toHaveBeenCalledWith('http://api.local/files/signature-original');
  });

  it('inclui comprovante sem responsável', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      deliveryProof: {
        type: 'no_responsible',
        note: 'Portaria fechada.',
        capturedAt: '2026-05-16T11:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'motorista teste',
      },
    });

    expect(findProofTable()?.body).toEqual(expect.arrayContaining([
      ['Comprovante', 'Sem responsável no local'],
      ['Observação', 'Portaria fechada.'],
    ]));
    expect(JSON.stringify(findProofTable()?.body)).not.toContain('Motorista do pedido');
    expect(addImageMock).not.toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith('Cliente_Teste_os_digital_101.pdf');
  });
});
