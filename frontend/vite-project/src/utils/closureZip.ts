import JSZip from 'jszip';
import type { IClient, IOrder } from '../interfaces';
import { buildClientOrdersPdf } from './clientOrdersPdf';

type ClosureClientData = {
  client: IClient;
  orders: IOrder[];
};

type DownloadClosureZipInput = {
  startDate: string;
  endDate: string;
  clientsData: ClosureClientData[];
};

const toDisplayDate = (value: string) => {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
};

const getClientTotal = (orders: IOrder[]) =>
  orders.reduce((sum, order) => {
    const orderTotal = (order.cacambas || [])
      .filter((c) =>
        (c.tipo === 'retirada' || c.tipo === 'entrega') &&
        typeof c.price === 'number' &&
        Number.isFinite(c.price),
      )
      .reduce((localSum, c) => localSum + Number(c.price), 0);
    return sum + orderTotal;
  }, 0);

export async function downloadClosureZip(input: DownloadClosureZipInput) {
  const { startDate, endDate, clientsData } = input;
  const zip = new JSZip();

  for (const item of clientsData) {
    const { client, orders } = item;
    const clientTotal = getClientTotal(orders);
    const { filename, blob } = await buildClientOrdersPdf(
      {
        client,
        orders,
        startDate,
        endDate,
        type: 'retirada',
        clientTotal,
      },
      { output: 'blob' }
    );
    zip.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const start = toDisplayDate(startDate);
  const end = toDisplayDate(endDate);
  const zipName = `Fechamentos - ${start} ate ${end}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
