import type { IClient, IOrder } from '../interfaces';

type DownloadClientOrdersPdfInput = {
  client: IClient;
  orders: IOrder[];
  startDate?: string;
  endDate?: string;
  type?: 'entrega' | 'retirada';
  clientTotal: number;
};

type BuildClientOrdersPdfOptions = {
  output?: 'blob';
};

type BuiltPdfDownload = { filename: string };
type BuiltPdfBlob = { filename: string; blob: Blob };

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('pt-BR') : '-');

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const projectRed: [number, number, number] = [227, 6, 19];
const companyLogoUrl = '/logo-central-cacambas-pdf.png';
const companyLogoWidth = 49;
const companyLogoAspectRatio = 300 / 110;
const pdfHeaderTop = 8;
const pdfHeaderBottom = 38;
const bankDetails = [
  'Dados Bancarios',
  'Banco: Sicredi',
  'Ag.: 0710  C/C: 58930-2',
  'PIX CNPJ: 14.071.560/0001-41',
];

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
  const autoTable = (autoTableModule as any).default || autoTableModule;
  const doc = new jsPDF('l', 'mm', 'a4');
  const horizontalMargin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableTableWidth = pageWidth - horizontalMargin * 2;
  const companyLogo = await loadCompanyLogo();
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
    doc.text(bankDetails[0], pageWidth - horizontalMargin, pdfHeaderTop + 2, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    bankDetails.slice(1).forEach((line, index) => {
      doc.text(line, pageWidth - horizontalMargin, pdfHeaderTop + 7 + index * 4.5, {
        align: 'right',
      });
    });
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
    startY: ((doc as any).lastAutoTable?.finalY || 20) + 6,
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
  });

  const safeName = (client.clientName || 'cliente').replace(/[^\w\-]+/g, '_');
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
