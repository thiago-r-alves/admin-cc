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

const mapLocalLabel = (local?: string) => {
  if (local === 'via_publica') return 'Via publica';
  if (local === 'canteiro_obra') return 'Canteiro de obra';
  return local || '-';
};

export async function downloadClientOrdersPdf(input: DownloadClientOrdersPdfInput) {
  const { client, orders, startDate, endDate, type, clientTotal } = input;
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;
  const doc = new jsPDF('l', 'mm', 'a4');

  const startLabel = formatFilterDate(startDate);
  const endLabel = formatFilterDate(endDate);
  const periodText =
    startLabel && endLabel ? `${startLabel} ate ${endLabel}` : 'Sem periodo definido';
  const typeText = type === 'retirada' ? 'Retirada' : type === 'entrega' ? 'Entrega' : 'Todos';
  const totalCacambas = orders.reduce((sum, order) => sum + (order.cacambas?.length || 0), 0);

  autoTable(doc, {
    head: [['Resumo do Relatorio', 'Valor']],
    body: [
      ['Cliente', client.clientName || '-'],
      ['Periodo', periodText],
      ['Tipo aplicado', typeText],
      ['Total do cliente (Retiradas)', formatCurrency(clientTotal)],
      ['Pedidos no relatorio', String(orders.length)],
      ['Cacambas no relatorio', String(totalCacambas)],
    ],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { top: 12, right: 10, left: 10 },
  });

  const flattenedCacambas = orders.flatMap((order) =>
    (order.cacambas || []).map((cacamba) => [
      `#${cacamba.numero || '-'}`,
      cacamba.tipo === 'entrega' ? 'Entrega' : 'Retirada',
      mapLocalLabel(cacamba.local),
      cacamba.horaServicoDigitos || '-',
      cacamba.contentType || '-',
      typeof cacamba.price === 'number' && Number.isFinite(cacamba.price) ? formatCurrency(cacamba.price) : '-',
      getDriverName(order),
      (order.placa || '-').toUpperCase(),
      `#${order.orderNumber ?? '-'}`,
      formatDateTime(cacamba.createdAt),
    ])
  );

  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY || 20) + 6,
    head: [[
      'Cacamba',
      'Tipo',
      'Local',
      'OS',
      'Conteudo',
      'Valor',
      'Motorista',
      'Placa',
      'Pedido',
      'Registrada em',
    ]],
    body: flattenedCacambas.length ? flattenedCacambas : [['-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [127, 29, 29] },
    margin: { right: 10, left: 10 },
  });

  const safeName = (client.clientName || 'cliente').replace(/[^\w\-]+/g, '_');
  const startFileLabel = formatFileDate(startDate);
  const endFileLabel = formatFileDate(endDate);
  const periodSuffix =
    startFileLabel && endFileLabel ? `_${startFileLabel}_a_${endFileLabel}` : '';
  doc.save(`relatorio_pedidos_${safeName}${periodSuffix}.pdf`);
}
