import type { IClient, IOrder } from '../interfaces';

type DownloadClientOrdersPdfInput = {
  client: IClient;
  orders: IOrder[];
  startDate?: string;
  endDate?: string;
  type?: 'entrega' | 'retirada';
  clientTotal: number;
  paymentMethod?: 'invoice' | 'pix';
  pixCopyPaste?: string;
};

type BuildClientOrdersPdfOptions = {
  output?: 'blob';
};

type BuiltPdfDownload = { filename: string };
type BuiltPdfBlob = { filename: string; blob: Blob };
type JsPdfDocument = InstanceType<typeof import('jspdf').jsPDF>;
type JsPdfWithAutoTable = JsPdfDocument & { lastAutoTable?: { finalY?: number } };
type AutoTableFn = (doc: JsPdfDocument, options: Record<string, unknown>) => void;
type AutoTableCellHookData = {
  section?: string;
  column?: { index?: number };
  cell?: { styles?: { textColor?: number[] } };
};

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('pt-BR') : '-');

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatClientAddress = (client: IClient) => {
  const streetLine = [client.address, client.addressNumber]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
  const addressParts = [
    streetLine,
    client.neighborhood,
    client.city,
    client.cep ? `CEP ${client.cep}` : '',
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return addressParts.join(' - ') || '-';
};

const projectRed: [number, number, number] = [227, 6, 19];
const detailsIdentifierColumns = new Set([0, 7, 11]);
const companyLogoUrl = '/logo-central-cacambas-pdf.png';
const companyLogoWidth = 49;
const companyLogoAspectRatio = 300 / 110;
const pdfHeaderTop = 8;
const pdfHeaderBottom = 46;
const pixQrSize = 34;
const bankDetails = [
  'Dados Bancarios',
  'Banco: Sicredi',
  'Ag.: 0710  C/C: 58930-2',
  'PIX CNPJ: 14.071.560/0001-41',
];

const field = (id: string, value: string) =>
  `${id}${String(new TextEncoder().encode(value).length).padStart(2, '0')}${value}`;

const normalizePixText = (value: string, maxLength: number) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLength);

const crc16Ccitt = (value: string) => {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

const buildPixCopyPaste = (amount: number) => {
  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', '14071560000141');
  const additionalData = field('05', 'FECHAMENTO');
  const payloadWithoutCrc = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    field('54', Math.max(amount, 0).toFixed(2)),
    field('58', 'BR'),
    field('59', normalizePixText('CENTRAL CACAMBAS', 25)),
    field('60', normalizePixText('SAO JOSE CAMPOS', 15)),
    field('62', additionalData),
    '6304',
  ].join('');
  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
};

const loadCompanyLogo = async () => {
  const response = await fetch(companyLogoUrl);
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a logo da empresa.');
  }
  return new Uint8Array(await response.arrayBuffer());
};

const formatFilterDate = (value?: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const formatFileDate = (value?: string) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return '';
  return `${day}-${month}-${year}`;
};

const isObjectIdLike = (value: string) => /^[a-f0-9]{24}$/i.test(value);

const getDriverName = (order: IOrder) => {
  if (!order.motorista) return 'Nao informado';
  if (typeof order.motorista === 'string') {
    return isObjectIdLike(order.motorista) ? 'Nao informado' : order.motorista;
  }
  if (typeof order.motorista === 'object' && 'username' in order.motorista) {
    return String((order.motorista as { username?: string }).username || 'Nao informado');
  }
  return 'Nao informado';
};

const getActionColumns = (
  action:
    | {
        date?: string;
        driverName?: string;
        placa?: string;
        orderNumber?: number | null;
      }
    | null
    | undefined,
) => {
  if (!action) return ['-', '-', '-', '-'];
  const date = formatDateTime(action.date);
  const driver = action.driverName || 'Nao informado';
  const placa = action.placa ? action.placa.toUpperCase() : '-';
  const orderNumber = action.orderNumber ?? '-';
  return [date, driver, placa, String(orderNumber)];
};

const mapLocalLabel = (local?: string) => {
  if (local === 'via_publica') return 'Via publica';
  if (local === 'canteiro_obra') return 'Canteiro de obra';
  return local || '-';
};

const colorDetailsIdentifiers = (data: AutoTableCellHookData) => {
  const columnIndex = data.column?.index;
  if (data.section !== 'body' || !data.cell || typeof columnIndex !== 'number') return;
  if (!detailsIdentifierColumns.has(columnIndex)) return;

  data.cell.styles = {
    ...(data.cell.styles || {}),
    textColor: projectRed,
  };
};

export async function buildClientOrdersPdf(
  input: DownloadClientOrdersPdfInput,
  options: { output: 'blob' }
): Promise<BuiltPdfBlob>;
export async function buildClientOrdersPdf(
  input: DownloadClientOrdersPdfInput,
  options?: BuildClientOrdersPdfOptions
): Promise<BuiltPdfDownload>;
export async function buildClientOrdersPdf(
  input: DownloadClientOrdersPdfInput,
  options?: BuildClientOrdersPdfOptions
): Promise<BuiltPdfDownload | BuiltPdfBlob> {
  const { client, orders, startDate, endDate, clientTotal } = input;
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = ('default' in autoTableModule ? autoTableModule.default : autoTableModule) as AutoTableFn;
  const doc = new jsPDF('l', 'mm', 'a4') as JsPdfWithAutoTable;
  const horizontalMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableTableWidth = pageWidth - horizontalMargin * 2;
  const companyLogo = await loadCompanyLogo();
  const { toDataURL: toQrDataUrl } = await import('qrcode');
  const pixQrCode = await toQrDataUrl(buildPixCopyPaste(clientTotal), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
  });
  const renderedHeaderPages = new Set<number>();

  const drawPageHeader = () => {
    const pageNumber = doc.getCurrentPageInfo().pageNumber;
    if (renderedHeaderPages.has(pageNumber)) return;
    renderedHeaderPages.add(pageNumber);

    doc.addImage(
      companyLogo,
      'PNG',
      horizontalMargin,
      pdfHeaderTop,
      companyLogoWidth,
      companyLogoWidth / companyLogoAspectRatio,
    );
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    const qrX = pageWidth - horizontalMargin - pixQrSize;
    const qrY = pdfHeaderTop - 1;
    const bankDetailsRight = qrX - 5;
    doc.text(bankDetails[0], bankDetailsRight, pdfHeaderTop + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    bankDetails.slice(1).forEach((line, index) => {
      doc.text(line, bankDetailsRight, pdfHeaderTop + 8 + index * 4.8, {
        align: 'right',
      });
    });
    doc.addImage(pixQrCode, 'PNG', qrX, qrY, pixQrSize, pixQrSize);
    doc.setDrawColor(...projectRed);
    doc.setLineWidth(0.4);
    doc.line(horizontalMargin, pdfHeaderBottom - 4, pageWidth - horizontalMargin, pdfHeaderBottom - 4);
  };

  const startLabel = formatFilterDate(startDate);
  const endLabel = formatFilterDate(endDate);
  const periodText = startLabel && endLabel ? `${startLabel} ate ${endLabel}` : '';
  const totalCacambas = orders.reduce((sum, order) => sum + (order.cacambas?.length || 0), 0);
  const summaryBody = [
    ['Cliente', client.clientName || '-'],
    ['Endereco', formatClientAddress(client)],
    ...(periodText ? [['Periodo', periodText]] : []),
    ['Total do cliente', formatCurrency(clientTotal)],
    ['Pedidos no relatorio', String(orders.length)],
    ['Cacambas no relatorio', String(totalCacambas)],
  ];

  autoTable(doc, {
    head: [['Resumo do Relatorio', '']],
    body: summaryBody,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: projectRed },
    margin: { top: pdfHeaderBottom, right: horizontalMargin, left: horizontalMargin },
    willDrawPage: drawPageHeader,
  });

  const flattenedCacambas = orders.flatMap((order) =>
    (order.cacambas || []).map((cacamba) => {
      const fallbackWithdrawal =
        cacamba.tipo === 'retirada'
          ? {
              date: cacamba.createdAt,
              driverName: getDriverName(order),
              placa: order.placa || '',
              orderNumber: order.orderNumber,
            }
          : null;

      const deliveryColumns = getActionColumns(cacamba.closureDelivery);
      const withdrawalColumns = getActionColumns(cacamba.closureWithdrawal || fallbackWithdrawal);

      return [
        cacamba.numero || '-',
        mapLocalLabel(cacamba.local),
        cacamba.horaServicoDigitos || '-',
        typeof cacamba.price === 'number' && Number.isFinite(cacamba.price) ? formatCurrency(cacamba.price) : '-',
        ...deliveryColumns,
        ...withdrawalColumns,
      ];
    })
  );

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY || 20) + 6,
    head: [[
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
    ]],
    body: flattenedCacambas.length ? flattenedCacambas : [['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    tableWidth: availableTableWidth,
    styles: { fontSize: 6.4, cellPadding: 1.2, valign: 'middle' },
    headStyles: { fillColor: projectRed },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 24 },
      2: { cellWidth: 16 },
      3: { cellWidth: 22 },
      4: { cellWidth: 30 },
      5: { cellWidth: 28 },
      6: { cellWidth: 18 },
      7: { cellWidth: 25 },
      8: { cellWidth: 30 },
      9: { cellWidth: 28 },
      10: { cellWidth: 18 },
      11: { cellWidth: 24 },
    },
    margin: { top: pdfHeaderBottom, right: horizontalMargin, left: horizontalMargin },
    willDrawPage: drawPageHeader,
    didParseCell: colorDetailsIdentifiers,
  });

  const safeName = (client.clientName || 'cliente').replace(/[^\w-]+/g, '_');
  const startFileLabel = formatFileDate(startDate);
  const endFileLabel = formatFileDate(endDate);
  const periodSuffix =
    startFileLabel && endFileLabel ? `_${startFileLabel}_a_${endFileLabel}` : '';
  const filename = `relatorio_pedidos_${safeName}${periodSuffix}.pdf`;
  if (options?.output === 'blob') {
    const blob = doc.output('blob');
    return { filename, blob };
  }
  return { filename };
}

export async function downloadClientOrdersPdf(input: DownloadClientOrdersPdfInput) {
  const { filename, blob } = await buildClientOrdersPdf(input, { output: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
