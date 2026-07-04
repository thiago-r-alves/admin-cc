import { beforeEach, describe, expect, it, vi } from 'vitest';
import { amountToPortugueseWords, buildClosureReceiptPdf } from './receiptPdf';

const addImageMock = vi.fn();
const setFontMock = vi.fn();
const textMock = vi.fn();
const lineMock = vi.fn();
const outputMock = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    internal: {
      pageSize: {
        getWidth: vi.fn(() => 210),
      },
    },
    addImage: addImageMock,
    setFont: setFontMock,
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: lineMock,
    getTextWidth: vi.fn((text: string) => text.length * 2),
    text: textMock,
    output: outputMock,
  })),
}));

const client = {
  _id: 'cli-1',
  clientName: 'Álvaro Obra Av Central',
  address: 'Av Central',
  addressNumber: '952',
  neighborhood: 'Chácaras Reunidas',
  city: 'São José dos Campos',
};

const baseGroup = {
  _id: 'grp-1',
  clientId: 'cli-1',
  clientSequenceNumber: 87,
  status: 'paga' as const,
  invoiceNumber: 'NF-0001',
  totalAmount: 2900,
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-31T23:59:59.999Z',
  updatedAt: '2026-07-03T12:00:00.000Z',
  cacambaIds: [
    {
      _id: 'cac-1',
      numero: '101',
      tipo: 'retirada' as const,
      paymentStatus: 'paga' as const,
      price: 1800,
      orderId: 'ord-1',
      createdAt: '2026-07-01T10:00:00.000Z',
    },
    {
      _id: 'cac-2',
      numero: '102',
      tipo: 'retirada' as const,
      paymentStatus: 'paga' as const,
      price: 1100,
      orderId: 'ord-2',
      createdAt: '2026-07-02T10:00:00.000Z',
    },
  ],
};

describe('buildClosureReceiptPdf', () => {
  beforeEach(() => {
    addImageMock.mockClear();
    setFontMock.mockClear();
    textMock.mockClear();
    lineMock.mockClear();
    outputMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      })),
    );
  });

  it('gera recibo com nome, valor, data, descrição e arquivo do cliente/grupo', async () => {
    const result = await buildClosureReceiptPdf({
      client,
      group: baseGroup,
      recipientName: 'Maria Cliente Completo',
    });

    const allText = textMock.mock.calls
      .map(([text]) => (Array.isArray(text) ? text.join(' ') : String(text)))
      .join('\n');

    expect(result.filename).toBe('recibo_fechamento_alvaro_obra_av_central_87.pdf');
    expect(addImageMock).toHaveBeenCalledWith(expect.any(Uint8Array), 'PNG', 12, 17, 70, 70 / (300 / 110));
    expect(addImageMock).toHaveBeenCalledWith(expect.any(Uint8Array), 'PNG', 50, 199, 48, 21.6);
    expect(allText).not.toContain('Cod.:');
    expect(textMock).toHaveBeenCalledWith('TIM : (12) 3937-7100', 170, 21, { align: 'right' });
    expect(textMock).toHaveBeenCalledWith('Dados Bancários', 116, 50);
    expect(textMock).toHaveBeenCalledWith('R E C I B O', 105, 84, { align: 'center' });
    expect(allText).toContain('Maria');
    expect(allText).toContain('Cliente');
    expect(allText).toContain('Completo');
    expect(allText).toContain('R$');
    expect(allText).toContain('2.900,00');
    expect(allText).toContain('novecentos');
    expect(setFontMock).toHaveBeenCalledWith('helvetica', 'bold');
    expect(allText).toContain('REFERENTE');
    expect(allText).toContain('LOCAÇÕES');
    expect(allText).toContain('CAÇAMBAS');
    expect(allText).not.toContain('NF-0001');
    expect(allText).toContain('São José dos Campos, 03 julho, 2026');
    expect(outputMock).toHaveBeenCalledWith('blob');
  });

  it('usa soma das caçambas quando totalAmount não existe', async () => {
    await buildClosureReceiptPdf({
      client,
      group: {
        ...baseGroup,
        totalAmount: undefined,
        invoiceNumber: undefined,
      },
      recipientName: 'João Recebedor',
    });

    const allText = textMock.mock.calls
      .map(([text]) => (Array.isArray(text) ? text.join(' ') : String(text)))
      .join('\n');

    expect(allText).toContain('R$');
    expect(allText).toContain('2.900,00');
    expect(allText).toContain('João');
    expect(allText).toContain('Recebedor');
  });

  it('formata valores por extenso com reais e centavos', () => {
    expect(amountToPortugueseWords(120.5)).toBe('cento e vinte reais e cinquenta centavos');
    expect(amountToPortugueseWords(1)).toBe('um real');
  });
});
