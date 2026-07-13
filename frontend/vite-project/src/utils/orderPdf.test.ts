import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IOrder } from '../interfaces';
import { downloadOrderPdf } from './orderPdf';

type AutoTableOptions = {
  head?: string[][];
  body?: string[][];
};

type MockPdfDoc = {
  lastAutoTable?: { finalY?: number };
  addImage: ReturnType<typeof vi.fn>;
  addPage: ReturnType<typeof vi.fn>;
  setFontSize: ReturnType<typeof vi.fn>;
  text: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

const autoTableMock = vi.fn((doc: MockPdfDoc, options: AutoTableOptions) => {
  void options;
  doc.lastAutoTable = { finalY: 42 };
});
const addImageMock = vi.fn();
const saveMock = vi.fn();

vi.mock('../services/api', () => ({
  apiUrl: 'http://api.local',
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    lastAutoTable: { finalY: 20 },
    addImage: addImageMock,
    addPage: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: saveMock,
  })),
}));

vi.mock('jspdf-autotable', () => ({
  default: autoTableMock,
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
  motorista: { _id: 'drv-1', username: 'Motorista' },
  cacambas: [],
  imageUrls: [],
  createdAt: '2026-05-16T10:00:00.000Z',
  updatedAt: '2026-05-16T11:00:00.000Z',
};

const findProofTable = () =>
  autoTableMock.mock.calls
    .map((call) => call[1] as AutoTableOptions)
    .find((options) => options.head?.[0]?.[0] === 'Comprovante da locação');

describe('downloadOrderPdf', () => {
  beforeEach(() => {
    autoTableMock.mockClear();
    addImageMock.mockClear();
    saveMock.mockClear();
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
        driverNameSnapshot: 'Motorista',
      },
    });

    expect(findProofTable()?.body).toEqual(expect.arrayContaining([
      ['Comprovante', 'Assinatura pelo recebimento da locação'],
      ['Comprovante coletado por', 'Motorista'],
    ]));
    expect(fetch).toHaveBeenCalledWith('http://api.local/files/signature-1');
    expect(addImageMock).toHaveBeenCalledWith(expect.stringContaining('data:image/png'), 'PNG', expect.any(Number), expect.any(Number), 88, 34);
    expect(saveMock).toHaveBeenCalledWith('pedido_101.pdf');
  });

  it('identifica comprovante reutilizado e a OS digital de origem', async () => {
    await downloadOrderPdf({
      ...baseOrder,
      deliveryProof: {
        type: 'signed',
        signatureImageUrl: '/files/signature-original',
        capturedAt: '2026-05-16T11:00:00.000Z',
        capturedBy: 'drv-1',
        driverNameSnapshot: 'Motorista',
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
        driverNameSnapshot: 'Motorista',
      },
    });

    expect(findProofTable()?.body).toEqual(expect.arrayContaining([
      ['Comprovante', 'Sem responsável no local'],
      ['Observação', 'Portaria fechada.'],
    ]));
    expect(addImageMock).not.toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalledWith('pedido_101.pdf');
  });
});
