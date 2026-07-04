import type { IClient, IClosureGroup } from '../interfaces';

type ClosureReceiptPdfInput = {
  client: IClient;
  group: IClosureGroup;
  recipientName: string;
};

type BuiltReceiptPdf = {
  filename: string;
  blob: Blob;
};

type JsPdfDocument = InstanceType<typeof import('jspdf').jsPDF>;

const companyLogoUrl = '/logo-central-cacambas-pdf.png';
const receiptSignatureUrl = '/receipt-signature.png';
const projectRed: [number, number, number] = [227, 6, 19];
const textBlack: [number, number, number] = [17, 24, 39];
const receiptCompanyName = 'CENTRAL TRANSPORTES E LOCAÇÕES LTDA - ME';
const receiptCompanyCnpj = '14.071.560/0001-41';
const receiptCompanyAddress = 'Av: Central, 1011 - Chácaras Reunidas - São José dos Campos - São Paulo';

const loadPngAsset = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Não foi possível carregar a imagem do recibo.');
  }
  return new Uint8Array(await response.arrayBuffer());
};

const normalizeFilenamePart = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00a0/g, ' ');

const formatClientAddress = (client: IClient) => {
  const streetLine = [client.address, client.addressNumber]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
  return [streetLine, client.neighborhood, client.city]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' - ');
};

const formatReceiptDate = (value?: string) => {
  const parsed = value ? new Date(value) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  const year = date.getFullYear();
  return `São José dos Campos, ${day} ${month}, ${year}`;
};

const getGroupTotal = (group: IClosureGroup) =>
  group.totalAmount ??
  (group.cacambaIds || []).reduce((sum, cacamba) => {
    const price = Number(cacamba.price);
    return Number.isFinite(price) ? sum + price : sum;
  }, 0);

const unitWords = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
];
const teenWords = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const tenWords = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];
const hundredWords = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

const numberUnderThousandToWords = (value: number): string => {
  if (value === 0) return 'zero';
  if (value === 100) return 'cem';

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;
  const parts: string[] = [];

  if (hundreds) parts.push(hundredWords[hundreds]);
  if (remainder >= 10 && remainder < 20) {
    parts.push(teenWords[remainder - 10]);
  } else {
    if (tens) parts.push(tenWords[tens]);
    if (units) parts.push(unitWords[units]);
  }

  return parts.filter(Boolean).join(' e ');
};

const integerToWords = (value: number): string => {
  if (value === 0) return 'zero';
  if (value < 1000) return numberUnderThousandToWords(value);

  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1000);
  const remainder = value % 1000;
  const parts: string[] = [];

  if (millions) {
    parts.push(`${integerToWords(millions)} ${millions === 1 ? 'milhão' : 'milhões'}`);
  }
  if (thousands) {
    parts.push(thousands === 1 ? 'mil' : `${numberUnderThousandToWords(thousands)} mil`);
  }
  if (remainder) {
    parts.push(numberUnderThousandToWords(remainder));
  }

  return parts.join(' ');
};

export const amountToPortugueseWords = (amount: number) => {
  const centsTotal = Math.round(Math.max(amount, 0) * 100);
  const reais = Math.floor(centsTotal / 100);
  const cents = centsTotal % 100;
  const reaisText = `${integerToWords(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  if (!cents) return reaisText;
  return `${reaisText} e ${integerToWords(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`;
};

const buildReceiptDescription = (client: IClient, group: IClosureGroup) => {
  const cacambaCount = group.cacambaIds?.length || 0;
  const address = formatClientAddress(client);
  const countLabel = `${cacambaCount || 0} ${cacambaCount === 1 ? 'locação' : 'locações'} de caçambas`;
  const addressLabel = address ? ` obra ${address}` : ` ${client.clientName}`;
  return `REFERENTE A ${countLabel}${addressLabel}.`.toUpperCase();
};

const drawRichWrappedText = (
  doc: JsPdfDocument,
  tokens: Array<{ text: string; bold?: boolean }>,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  let currentX = x;
  let currentY = y;
  const spaceWidth = doc.getTextWidth(' ');

  const moveToNextLine = () => {
    currentX = x;
    currentY += lineHeight;
  };

  tokens.forEach((token) => {
    doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
    token.text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        if (currentX !== x) currentX += spaceWidth;
        return;
      }

      const partWidth = doc.getTextWidth(part);
      if (currentX !== x && currentX + partWidth > x + maxWidth) {
        moveToNextLine();
      }
      doc.text(part, currentX, currentY);
      currentX += partWidth;
    });
  });
};

const drawCenteredUnderlinedTitle = (doc: JsPdfDocument, pageWidth: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('R E C I B O', pageWidth / 2, 84, { align: 'center' });
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(pageWidth / 2 - 26, 86, pageWidth / 2 + 26, 86);
};

const drawSignature = (doc: JsPdfDocument, signatureImage: Uint8Array) => {
  doc.addImage(signatureImage, 'PNG', 50, 199, 48, 21.6);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(16, 223, 151, 223);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(receiptCompanyName, 16, 228);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`C.N.P.J n ${receiptCompanyCnpj}`, 16, 234);
};

export async function buildClosureReceiptPdf(input: ClosureReceiptPdfInput): Promise<BuiltReceiptPdf> {
  const { client, group } = input;
  const recipientName = input.recipientName.trim();
  const totalAmount = getGroupTotal(group);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const companyLogo = await loadPngAsset(companyLogoUrl);
  const signatureImage = await loadPngAsset(receiptSignatureUrl);

  doc.addImage(companyLogo, 'PNG', 12, 17, 70, 70 / (300 / 110));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...projectRed);
  doc.text('TIM : (12) 3937-7100', 170, 21, { align: 'right' });
  doc.text('CLARO: (12) 97411-0998', 170, 27, { align: 'right' });
  doc.text('OI: (12) 99121-2306', 170, 33, { align: 'right' });
  doc.text('E-mail: contato@centralcacambatransportes.com.br', 185, 40, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Dados Bancários', 116, 50);
  doc.text('Banco : Sicredi', 116, 56);
  doc.text('Ag.: 0710  C/C: 58930-2', 116, 62);
  doc.text('PIX CNPJ: 14.071.560/0001-41', 116, 68);
  doc.text('Obs.: Enviar comprovante', 116, 74);

  drawCenteredUnderlinedTitle(doc, pageWidth);

  const amountText = amountToPortugueseWords(totalAmount);
  const description = buildReceiptDescription(client, group);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(...textBlack);
  drawRichWrappedText(
    doc,
    [
      { text: `Nós da ${receiptCompanyName}, com C.N.P.J n ${receiptCompanyCnpj}, localizada ${receiptCompanyAddress}, recebemos da(o) ` },
      { text: recipientName, bold: true },
      { text: ' a quantia de ' },
      { text: `${formatCurrency(totalAmount)} (${amountText})`, bold: true },
      { text: ' referente a : a caçamba(s) ' },
      { text: description, bold: true },
    ],
    16,
    122,
    180,
    7,
  );

  doc.setFontSize(14);
  doc.text(formatReceiptDate(group.updatedAt), 16, 181);
  drawSignature(doc, signatureImage);

  const safeClient = normalizeFilenamePart(client.clientName || 'cliente') || 'cliente';
  const filename = `recibo_fechamento_${safeClient}_${group.clientSequenceNumber || group._id}.pdf`;
  return { filename, blob: doc.output('blob') };
}

export async function downloadClosureReceiptPdf(input: ClosureReceiptPdfInput) {
  const { filename, blob } = await buildClosureReceiptPdf(input);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
