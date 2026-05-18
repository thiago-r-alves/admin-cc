import type { IClient, IOrder } from '../interfaces';

type DownloadClientOrdersPdfInput = {
  client: IClient;
  orders: IOrder[];
  startDate?: string;
  endDate?: string;
  type?: 'entrega' | 'retirada';
  clientTotal: number;
};

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('pt-BR') : '-');
const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-');
const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

export async function downloadClientOrdersPdf(input: DownloadClientOrdersPdfInput) {
  const { client, orders, startDate, endDate, type, clientTotal } = input;
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;
  const doc = new jsPDF();

  const startLabel = formatFilterDate(startDate);
  const endLabel = formatFilterDate(endDate);
  const periodText =
    startLabel && endLabel ? `${startLabel} até ${endLabel}` : 'Sem período definido';
  const typeText = type === 'retirada' ? 'Retirada' : type === 'entrega' ? 'Entrega' : 'Todos';

  autoTable(doc, {
    head: [['Resumo do Relatório', 'Valor']],
    body: [
      ['Cliente', client.clientName || '-'],
      ['Período', periodText],
      ['Tipo aplicado', typeText],
      ['Total do cliente (Retiradas)', formatCurrency(clientTotal)],
      ['Pedidos no relatório', String(orders.length)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { top: 12, right: 10, left: 10 },
  });

  const getOrderTotal = (order: IOrder) =>
    (order.cacambas || [])
      .filter((c) => c.tipo === 'retirada' && typeof c.price === 'number' && Number.isFinite(c.price))
      .reduce((sum, c) => sum + Number(c.price), 0);

  for (const order of orders) {
    const orderSubtotal = getOrderTotal(order);
    const orderTypeLabel = order.type === 'entrega' ? 'Entrega' : 'Retirada';
    const orderStatusLabel = order.status === 'em_andamento'
      ? 'Em andamento'
      : order.status.charAt(0).toUpperCase() + order.status.slice(1);

    const startY = ((doc as any).lastAutoTable?.finalY || 20) + 6;
    autoTable(doc, {
      startY,
      head: [[`Pedido #${order.orderNumber ?? '-'} (${orderTypeLabel})`, 'Detalhe']],
      body: [
        ['Data do pedido', formatDate(order.createdAt)],
        ['Status', orderStatusLabel],
        ['Cliente', order.clientName || '-'],
        ['Contato', `${order.contactName || '-'} ${order.contactNumber ? `(${order.contactNumber})` : ''}`.trim()],
        ['CNPJ/CPF', order.cnpjCpf || '-'],
        ['Endereço', `${order.address || ''}, ${order.addressNumber || ''} - ${order.neighborhood || ''}${order.city ? ` - ${order.city}` : ''}${order.cep ? ` - CEP ${order.cep}` : ''}`],
        [
          order.status === 'concluido' ? 'Data de conclusão' : 'Atualizado em',
          formatDateTime(order.status === 'concluido' ? (order.updatedAt ?? order.createdAt) : order.updatedAt),
        ],
        ['Subtotal do pedido (Retiradas)', formatCurrency(orderSubtotal)],
      ],
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [55, 65, 81] },
      margin: { right: 10, left: 10 },
    });

    const cacambas = order.cacambas || [];
    if (cacambas.length > 0) {
      const cacambaRows = cacambas.map((c) => [
        `#${c.numero || '-'}`,
        c.tipo === 'entrega' ? 'Entrega' : 'Retirada',
        c.local === 'via_publica' ? 'Via pública' : c.local === 'canteiro_obra' ? 'Canteiro de obra' : (c.local || '-'),
        c.horaServicoDigitos || '-',
        c.contentType || '-',
        typeof c.price === 'number' && Number.isFinite(c.price) ? formatCurrency(c.price) : '-',
        formatDateTime(c.createdAt),
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 4,
        head: [['Caçamba', 'Tipo', 'Local', 'OS', 'Conteúdo', 'Valor', 'Registrada em']],
        body: cacambaRows,
        styles: { fontSize: 8, cellPadding: 1.8 },
        headStyles: { fillColor: [127, 29, 29] },
        margin: { right: 10, left: 10 },
      });
    }
  }

  const safeName = (client.clientName || 'cliente').replace(/[^\w\-]+/g, '_');
  const startFileLabel = formatFileDate(startDate);
  const endFileLabel = formatFileDate(endDate);
  const periodSuffix =
    startFileLabel && endFileLabel ? `_${startFileLabel}_a_${endFileLabel}` : '';
  doc.save(`relatorio_pedidos_${safeName}${periodSuffix}.pdf`);
}
