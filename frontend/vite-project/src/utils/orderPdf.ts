import type { IOrder, ICacamba } from '../interfaces';

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
    margin: { top: 12, right: 10, left: 10 }
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
          pageBreak: 'avoid'
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
  doc.save(`pedido_${orderNumber}.pdf`);
}
