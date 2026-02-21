import type { IOrder, ICacamba } from '../interfaces';

export async function downloadOrderPdf(order: IOrder) {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;
  const doc = new jsPDF();
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '-');

  // Determina número do pedido (fallback)
  const orderNumber =
    (order as any).numeroPedido ||
    (order as any).numero ||
    (order as any).orderNumber ||
    order._id;

  // Tabela principal (dados do pedido)
  autoTable(doc, {
    head: [['Campo', 'Valor']],
    body: [
      ['Número do Pedido', String(orderNumber)],
      ['Tipo', order.type || '-'],
      ['Status', order.status || '-'],
      ['Cliente', (order as any).client?.clientName || (order as any).clientName || '-'],
      ['Contato', `${(order as any).contactName || ''} ${(order as any).contactNumber || ''}`.trim()],
      [
        'Endereço',
        `${(order as any).address || ''}, ${(order as any).addressNumber || ''} - ${(order as any).neighborhood || ''}`
      ],
      ['Motorista', (order as any).motorista?.username || '-'],
      ['Criado em', fmt(order.createdAt as any)],
      ['Finalizado em', fmt(order.updatedAt as any)]
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
    const afterSummaryY = (doc as any).lastAutoTable.finalY + 4;
    if (afterSummaryY < 285) {
      // margem extra acima do título (antes era afterSummaryY - 2)
      const detailsTitleY = afterSummaryY + 8; // aumenta o espaço
      doc.setFontSize(11);
      doc.text('Detalhes Individuais', 10, detailsTitleY);

      const detailsBody: string[][] = [];
      order.cacambas.forEach((c: ICacamba, i) => {
        detailsBody.push([`Caçamba ${i + 1}`, '']);
        detailsBody.push(['Número', c.numero || '-']);
        detailsBody.push(['Registrada em', fmt(c.createdAt as any)]);
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