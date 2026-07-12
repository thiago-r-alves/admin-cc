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
type AutoTableCellHookData = {
  section?: string;
  column?: { index?: number };
  row?: { index?: number; raw?: unknown };
  cell?: { styles?: { textColor?: number[] } };
};

const projectRed: [number, number, number] = [227, 6, 19];

const colorOrderNumberValue = (data: AutoTableCellHookData) => {
  if (data.section !== 'body' || data.row?.index !== 0 || data.column?.index !== 1 || !data.cell) return;

  data.cell.styles = {
    ...(data.cell.styles || {}),
    textColor: projectRed,
  };
};

const colorCacambaNumberValues = (data: AutoTableCellHookData) => {
  const raw = Array.isArray(data.row?.raw) ? data.row.raw : [];
  if (data.section !== 'body' || data.column?.index !== 1 || raw[0] !== 'Número' || !data.cell) return;

  data.cell.styles = {
    ...(data.cell.styles || {}),
    textColor: projectRed,
  };
};

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
    head: [['Campo', 'Valor']],
    body: [
      ['Número do Pedido', String(orderNumber)],
      ['Tipo', order.type || '-'],
      ['Status', order.status || '-'],
      ['Cliente', legacyOrder.client?.clientName || order.clientName || '-'],
      ['Contato', `${order.contactName || ''} ${order.contactNumber || ''}`.trim()],
      [
        'Endereço',
        `${order.address || ''}, ${order.addressNumber || ''} - ${order.neighborhood || ''}`
      ],
      ['Motorista', typeof order.motorista === 'string' ? '-' : order.motorista?.username || '-'],
      ['Criado em', fmt(order.createdAt)],
      ['Finalizado em', fmt(order.updatedAt)]
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { top: 12, right: 10, left: 10 },
    didParseCell: colorOrderNumberValue,
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
      doc.setFontSize(11);
      doc.text('Detalhes Individuais', 10, detailsTitleY);

      const detailsBody: string[][] = [];
      order.cacambas.forEach((c: ICacamba, i) => {
        detailsBody.push([`Caçamba ${i + 1}`, '']);
        detailsBody.push(['Número', c.numero || '-']);
        detailsBody.push(['Registrada em', fmt(c.createdAt)]);
        detailsBody.push(['Local', c.local || '-']);
        detailsBody.push(['Tipo', c.tipo || '-']);
        detailsBody.push(['', '']);
      });

      const estimatedHeight = detailsBody.length * 4;
      const tableStartY = detailsTitleY + 4; // inicia tabela abaixo do título com espaçamento
      if (tableStartY + estimatedHeight < 295) {
        autoTable(doc, {
          startY: tableStartY,
          head: [['Campo', 'Valor']],
          body: detailsBody,
          styles: { fontSize: fontSize - 1 <= 6 ? 6 : fontSize - 1, cellPadding: 1 },
          headStyles: { fillColor: [99, 102, 241] },
          margin: { right: 10, left: 10 },
          pageBreak: 'avoid',
          didParseCell: colorCacambaNumberValues,
        });
      } else {
        doc.setFontSize(8);
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
      proof?.driverNameSnapshot ||
      (typeof order.motorista === 'string' ? '' : order.motorista?.username) ||
      '-';
    const proofBody = !proof
      ? [['Comprovante', 'Sem comprovante digital']]
      : proof.type === 'signed'
        ? [
            ['Comprovante', 'Assinatura pelo recebimento da locação'],
            ['Data/Hora', fmt(proof.capturedAt)],
            ['Motorista', driverName],
          ]
        : [
            ['Comprovante', 'Sem responsável no local'],
            ['Data/Hora', fmt(proof.capturedAt)],
            ['Motorista', driverName],
            ['Observação', proof.note || '-'],
          ];

    autoTable(doc, {
      startY: proofStartY,
      head: [['Comprovante da locação', 'Valor']],
      body: proofBody,
      styles: { fontSize: 8, cellPadding: 1.4 },
      headStyles: { fillColor: projectRed },
      margin: { right: 10, left: 10 },
    });

    if (proof?.type === 'signed' && proof.signatureImageUrl) {
      const imageDataUrl = await fetchImageDataUrl(proof.signatureImageUrl);
      if (imageDataUrl) {
        const imageY = (doc.lastAutoTable?.finalY || proofStartY) + 7;
        if (imageY > 248) {
          doc.addPage();
          doc.setFontSize(10);
          doc.text('Assinatura pelo recebimento da locação', 10, 18);
          doc.addImage(imageDataUrl, 'PNG', 10, 22, 88, 34);
        } else {
          doc.setFontSize(10);
          doc.text('Assinatura pelo recebimento da locação', 10, imageY);
          doc.addImage(imageDataUrl, 'PNG', 10, imageY + 4, 88, 34);
        }
      }
    }
  }

  doc.save(`pedido_${orderNumber}.pdf`);
}
