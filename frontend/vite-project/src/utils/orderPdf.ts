import type { IOrder, ICacamba } from '../interfaces';
import { apiUrl } from '../services/api';

type JsPdfDocument = InstanceType<typeof import('jspdf').jsPDF>;
type JsPdfWithAutoTable = JsPdfDocument & { lastAutoTable?: { finalY?: number } };
type AutoTableFn = (doc: JsPdfDocument, options: Record<string, unknown>) => void;
type OrderWithLegacyFields = IOrder & {
  numeroPedido?: number | string;
  numero?: number | string;
  client?: {
    clientName?: string;
  };
};

const projectRed: [number, number, number] = [227, 6, 19];
const printableTextStyles = { textColor: [0, 0, 0], fontStyle: 'bold' };
const printableHeadStyles = { fillColor: projectRed, textColor: [255, 255, 255], fontStyle: 'bold' };

const buildOrderFileUrl = (url?: string) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${apiUrl}${url}`;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const fetchImageDataUrl = async (url?: string) => {
  if (!url) return null;
  try {
    const response = await fetch(buildOrderFileUrl(url));
    if (!response.ok) return null;
    return blobToDataUrl(await response.blob());
  } catch {
    return null;
  }
};

const toTitleCase = (value?: string) =>
  String(value || '-')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase()) || '-';

const formatLocal = (local?: string) => {
  if (local === 'via_publica') return 'Via Publica';
  if (local === 'canteiro_obra') return 'Canteiro De Obra';
  return toTitleCase(local);
};

const getDriverDisplayName = (driver: IOrder['motorista']) => {
  if (!driver || typeof driver === 'string') return '-';
  return toTitleCase(driver.username || '-');
};

const formatFileNamePart = (value?: string | number) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'sem_nome';

const setPrintableText = (doc: JsPdfDocument) => {
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
};

export async function downloadOrderPdf(order: IOrder) {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = ('default' in autoTableModule ? autoTableModule.default : autoTableModule) as AutoTableFn;
  const doc = new jsPDF() as JsPdfWithAutoTable;
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '-');
  const legacyOrder = order as OrderWithLegacyFields;

  // Determina número do pedido (fallback)
  const orderNumber =
    legacyOrder.numeroPedido ||
    legacyOrder.numero ||
    order.orderNumber ||
    order._id;

  // Tabela principal (dados do pedido)
  autoTable(doc, {
    body: [
      ['Número do Pedido', String(orderNumber)],
      ['Tipo', toTitleCase(order.type)],
      ['Cliente', legacyOrder.client?.clientName || order.clientName || '-'],
      [
        'Endereço',
        `${order.address || ''}, ${order.addressNumber || ''} - ${order.neighborhood || ''}`
      ],
      ['Motorista', getDriverDisplayName(order.motorista)],
      ['Finalizado em', fmt(order.updatedAt)]
    ],
    styles: { fontSize: 9, cellPadding: 2, ...printableTextStyles },
    margin: { top: 12, right: 10, left: 10 },
  });

  // Resumo das caçambas na MESMA página (sem addPage)
  if (order.cacambas?.length) {
    // Ajuste de fonte se muitas caçambas
    const total = order.cacambas.length;
    const fontSize = total > 12 ? 7 : total > 8 ? 8 : 9;

    // Detalhes individuais condensados em uma tabela só (para não gerar múltiplas)
    const afterSummaryY = (doc.lastAutoTable?.finalY || 20) + 4;
    if (afterSummaryY < 285) {
      // margem extra acima do título (antes era afterSummaryY - 2)
      const detailsTitleY = afterSummaryY + 8; // aumenta o espaço

      const detailsBody: string[][] = [];
      order.cacambas.forEach((c: ICacamba, i) => {
        detailsBody.push([`Caçamba ${i + 1}`, '']);
        detailsBody.push(['Número', c.numero || '-']);
        detailsBody.push(['Registrada em', fmt(c.createdAt)]);
        detailsBody.push(['Local', formatLocal(c.local)]);
        detailsBody.push(['Conteúdo', toTitleCase(c.contentType)]);
        detailsBody.push(['', '']);
      });

      const estimatedHeight = detailsBody.length * 4;
      const tableStartY = detailsTitleY;
      if (tableStartY + estimatedHeight < 295) {
        autoTable(doc, {
          startY: tableStartY,
          head: [['Detalhes Individuais', '']],
          body: detailsBody,
          styles: { fontSize: fontSize - 1 <= 6 ? 6 : fontSize - 1, cellPadding: 1, ...printableTextStyles },
          headStyles: printableHeadStyles,
          margin: { right: 10, left: 10 },
          pageBreak: 'avoid',
        });
      } else {
        doc.setFontSize(8);
        setPrintableText(doc);
        doc.text(
          'Detalhes individuais omitidos para manter em uma única página.',
          10,
          detailsTitleY + 6
        );
      }
    }
  }

  if (order.status === 'concluido') {
    const proof = order.deliveryProof;
    const startY = (doc.lastAutoTable?.finalY || 20) + 10;
    if (startY > 260) doc.addPage();

    const proofStartY = startY > 260 ? 16 : startY;
    const driverName =
      proof?.driverNameSnapshot
        ? toTitleCase(proof.driverNameSnapshot)
        : getDriverDisplayName(order.motorista);
    const proofBody = !proof
      ? [['Comprovante', 'Sem comprovante digital']]
      : proof.type === 'signed'
        ? [
            ['Comprovante', 'Assinatura pelo recebimento da locação'],
            ...(proof.isReused ? [['Reutilização', 'Comprovante reutilizado'], ['OS digital de origem', `#${proof.reusedFromOrderNumber ?? '-'}`]] : []),
            ['Data/Hora', fmt(proof.capturedAt)],
            ['Comprovante coletado por', driverName],
          ]
        : [
            ['Comprovante', 'Sem responsável no local'],
            ...(proof.isReused ? [['Reutilização', 'Comprovante reutilizado'], ['OS digital de origem', `#${proof.reusedFromOrderNumber ?? '-'}`]] : []),
            ['Data/Hora', fmt(proof.capturedAt)],
            ['Comprovante coletado por', driverName],
            ['Observação', proof.note || '-'],
          ];

    autoTable(doc, {
      startY: proofStartY,
      head: [['Comprovante da locação', 'Valor']],
      body: proofBody,
      styles: { fontSize: 8, cellPadding: 1.4, ...printableTextStyles },
      headStyles: printableHeadStyles,
      margin: { right: 10, left: 10 },
    });

    if (proof?.type === 'signed' && proof.signatureImageUrl) {
      const imageDataUrl = await fetchImageDataUrl(proof.signatureImageUrl);
      if (imageDataUrl) {
        const imageY = (doc.lastAutoTable?.finalY || proofStartY) + 7;
        if (imageY > 248) {
          doc.addPage();
          doc.setFontSize(10);
          setPrintableText(doc);
          doc.text('Assinatura pelo recebimento da locação', 10, 18);
          doc.addImage(imageDataUrl, 'PNG', 10, 22, 88, 34);
        } else {
          doc.setFontSize(10);
          setPrintableText(doc);
          doc.text('Assinatura pelo recebimento da locação', 10, imageY);
          doc.addImage(imageDataUrl, 'PNG', 10, imageY + 4, 88, 34);
        }
      }
    }
  }

  const clientName = legacyOrder.client?.clientName || order.clientName || 'cliente';
  doc.save(`${formatFileNamePart(clientName)}_os_digital_${formatFileNamePart(orderNumber)}.pdf`);
}
