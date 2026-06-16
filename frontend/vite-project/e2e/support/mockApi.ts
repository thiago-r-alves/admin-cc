import type { Page, Route } from '@playwright/test';

type Role = 'admin' | 'motorista';

const API_ORIGIN = 'http://api.local';

const nowIso = new Date('2026-05-16T12:00:00.000Z').toISOString();

type Driver = { _id: string; username: string };
type Cacamba = {
  _id: string;
  numero: string;
  tipo: 'entrega' | 'retirada';
  contentType?: string;
  paymentStatus?: 'pendente' | 'nota_fiscal_pendente' | 'paga';
  closureGroupId?: string;
  price?: number;
  local: 'via_publica' | 'canteiro_obra';
  orderId: string;
  imageUrl?: string;
  createdAt: string;
  horaServicoDigitos?: string;
};
type Order = {
  _id: string;
  orderNumber: number;
  clientId: string;
  clientName: string;
  cnpjCpf: string;
  city: string;
  cep: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  placa?: string;
  type: 'entrega' | 'retirada';
  priority: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista: string | { _id: string; username: string };
  cacambas: Cacamba[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  price?: number;
};

type BillingBucket = {
  label: string;
  start: string;
  end: string;
  revenue: number;
  count: number;
};

const initialDrivers: Driver[] = [
  { _id: 'drv-1', username: 'adalberto' },
  { _id: 'drv-2', username: 'jhonatan' },
];

const initialClients = [
  {
    _id: 'cli-1',
    clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
    cnpjCpf: '39.003.660/0001-61',
    contactName: 'SR SAMIIR',
    contactNumber: '(12) 98195-6675',
    address: 'Rodovia Geraldo Scavone',
    addressNumber: '4975',
    neighborhood: 'Jardim Califórnia',
    city: 'Jacareí',
    cep: '12338-500',
    createdAt: nowIso,
  },
  {
    _id: 'cli-2',
    clientName: 'PFF INOVA IND E COM DE MAQ OBRA 1',
    cnpjCpf: '11.222.333/0001-44',
    contactName: 'ENG BRUNO',
    contactNumber: '(12) 98147-0969',
    address: 'Rua Januaria',
    addressNumber: '821',
    neighborhood: 'Chácaras Reunidas',
    city: 'São José dos Campos',
    cep: '12238-500',
    createdAt: nowIso,
  },
];

const initialOrders: Order[] = [
  {
    _id: 'ord-1',
    orderNumber: 2231,
    clientId: 'cli-2',
    clientName: 'PFF INOVA IND E COM DE MAQ, EQUIPE FERRAMENTAL LTDA OBRA 1',
    cnpjCpf: '39003660000161',
    city: 'São José dos Campos',
    cep: '12238-500',
    contactName: 'ENG BRUNO',
    contactNumber: '(12) 98147-0969',
    neighborhood: 'Chácaras Reunidas',
    address: 'Rua Januaria',
    addressNumber: '821',
    placa: 'FT02E29',
    type: 'retirada',
    priority: 0,
    status: 'pendente',
    motorista: { _id: 'drv-1', username: 'adalberto' },
    cacambas: [
      {
        _id: 'cac-1',
        numero: '435',
        tipo: 'retirada',
        local: 'via_publica',
        orderId: 'ord-1',
        imageUrl: '/uploads/cac-1.jpg',
        createdAt: nowIso,
        horaServicoDigitos: '345',
      },
    ],
    imageUrls: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    price: 150.5,
  },
  {
    _id: 'ord-2',
    orderNumber: 1500,
    clientId: 'cli-1',
    clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
    cnpjCpf: '39.003.660/0001-61',
    city: 'Jacareí',
    cep: '12338-500',
    contactName: 'SR SAMIIR',
    contactNumber: '(12) 98195-6675',
    neighborhood: 'Jardim Califórnia',
    address: 'Rodovia Geraldo Scavone',
    addressNumber: '4975',
    placa: 'ABC1D23',
    type: 'entrega',
    priority: 0,
    status: 'concluido',
    motorista: { _id: 'drv-1', username: 'adalberto' },
    cacambas: [
      {
        _id: 'cac-2',
        numero: '415',
        tipo: 'entrega',
        local: 'canteiro_obra',
        orderId: 'ord-2',
        imageUrl: '/uploads/cac-2.jpg',
        createdAt: nowIso,
        horaServicoDigitos: '670',
      },
    ],
    imageUrls: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    price: 220.0,
  },
  {
    _id: 'ord-3',
    orderNumber: 2232,
    clientId: 'cli-1',
    clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
    cnpjCpf: '39.003.660/0001-61',
    city: 'Jacareí',
    cep: '12338-500',
    contactName: 'SR SAMIIR',
    contactNumber: '(12) 98195-6675',
    neighborhood: 'Jardim Califórnia',
    address: 'Rodovia Geraldo Scavone',
    addressNumber: '4975',
    placa: 'ZZZ9Z99',
    type: 'entrega',
    priority: 0,
    status: 'pendente',
    motorista: { _id: 'drv-1', username: 'adalberto' },
    cacambas: [],
    imageUrls: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    _id: 'ord-4',
    orderNumber: 2233,
    clientId: 'cli-1',
    clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
    cnpjCpf: '39.003.660/0001-61',
    city: 'JacareÃ­',
    cep: '12338-500',
    contactName: 'SR SAMIIR',
    contactNumber: '(12) 98195-6675',
    neighborhood: 'Jardim CalifÃ³rnia',
    address: 'Rodovia Geraldo Scavone',
    addressNumber: '4975',
    placa: 'XYZ1A23',
    type: 'retirada',
    priority: 0,
    status: 'concluido',
    motorista: { _id: 'drv-1', username: 'adalberto' },
    cacambas: [
      {
        _id: 'cac-4',
        numero: '777',
        tipo: 'retirada',
        contentType: 'Entulho limpo',
        local: 'via_publica',
        orderId: 'ord-4',
        imageUrl: '/uploads/cac-4.jpg',
        createdAt: nowIso,
        horaServicoDigitos: '777',
        paymentStatus: 'pendente',
        price: 320,
      },
    ],
    imageUrls: [],
    createdAt: '2026-05-15T09:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    price: 320.0,
  },
  {
    _id: 'ord-5',
    orderNumber: 2234,
    clientId: 'cli-1',
    clientName: '3GK HOLDING E PARTICIPACOES OBRA 1',
    cnpjCpf: '39.003.660/0001-61',
    city: 'JacareÃ­',
    cep: '12338-500',
    contactName: 'SR SAMIIR',
    contactNumber: '(12) 98195-6675',
    neighborhood: 'Jardim CalifÃ³rnia',
    address: 'Rodovia Geraldo Scavone',
    addressNumber: '4975',
    placa: 'QWE1R23',
    type: 'retirada',
    priority: 0,
    status: 'concluido',
    motorista: { _id: 'drv-2', username: 'jhonatan' },
    cacambas: [
      {
        _id: 'cac-5',
        numero: '778',
        tipo: 'retirada',
        contentType: 'Entulho limpo',
        local: 'via_publica',
        orderId: 'ord-5',
        imageUrl: '/uploads/cac-5.jpg',
        createdAt: nowIso,
        horaServicoDigitos: '778',
        paymentStatus: 'paga',
        closureGroupId: 'grp-existing-1',
        price: 280,
      },
    ],
    imageUrls: [],
    createdAt: '2026-05-14T09:00:00.000Z',
    updatedAt: '2026-05-14T12:00:00.000Z',
    price: 280.0,
  },
];

const createJwt = (role: Role) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      userId: role === 'admin' ? 'admin-1' : 'drv-1',
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  ).toString('base64url');
  return `${header}.${payload}.signature`;
};

const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });

const getOrderMotoristaId = (order: Order) =>
  typeof order.motorista === 'string' ? order.motorista : order.motorista._id;

const parseInputDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const buildPreviousRange = (start: Date, end: Date) => {
  const duration = end.getTime() - start.getTime() + 1;
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration + 1);
  return { previousStart, previousEnd };
};

const buildBuckets = (start: Date, end: Date, granularity: string): BillingBucket[] => {
  const buckets: BillingBucket[] = [];
  const buildBucket = (label: string, bucketStart: Date, bucketEnd: Date) => ({
    label,
    start: bucketStart.toISOString(),
    end: bucketEnd.toISOString(),
    revenue: 0,
    count: 0,
  });

  if (granularity === 'annual') {
    let cursor = new Date(start.getFullYear(), 0, 1, 0, 0, 0, 0);
    while (cursor <= end) {
      const year = cursor.getFullYear();
      buckets.push(buildBucket(String(year), new Date(year, 0, 1, 0, 0, 0, 0), new Date(year, 11, 31, 23, 59, 59, 999)));
      cursor = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    }
    return buckets;
  }

  if (granularity === 'semiannual') {
    let cursor = new Date(start.getFullYear(), start.getMonth() < 6 ? 0 : 6, 1, 0, 0, 0, 0);
    while (cursor <= end) {
      const firstHalf = cursor.getMonth() < 6;
      buckets.push(
        buildBucket(
          `${firstHalf ? '1o' : '2o'} sem/${cursor.getFullYear()}`,
          new Date(cursor),
          new Date(cursor.getFullYear(), firstHalf ? 5 : 11, firstHalf ? 30 : 31, 23, 59, 59, 999),
        ),
      );
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 6, 1, 0, 0, 0, 0);
    }
    return buckets;
  }

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
  while (cursor <= end) {
    const label = `${String(cursor.getMonth() + 1).padStart(2, '0')}/${cursor.getFullYear()}`;
    buckets.push(
      buildBucket(
        label,
        new Date(cursor),
        new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999),
      ),
    );
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1, 0, 0, 0, 0);
  }
  return buckets;
};

const roundCurrency = (value: number) => Number(value.toFixed(2));
const getNextClosureGroupSequence = (closureGroups: ClosureGroup[], clientId: string) =>
  closureGroups.reduce((max, group) => {
    if (group.clientId !== clientId) return max;
    const value = Number(group.clientSequenceNumber || 0);
    return value > max ? value : max;
  }, 0) + 1;

export const seedSession = async (page: Page, role: Role) => {
  const token = createJwt(role);
  await page.addInitScript(([tk, rl]) => {
    localStorage.setItem('token', tk);
    localStorage.setItem('role', rl);
    localStorage.setItem('token_expires_at', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  }, [token, role]);
};

export const setupMockApi = async (page: Page) => {
  const drivers: Driver[] = initialDrivers.map((d) => ({ ...d }));
  const clients = initialClients.map((c) => ({ ...c }));
  const orders: Order[] = initialOrders.map((o) => ({
    ...o,
    cacambas: o.cacambas.map((c) => ({ ...c })),
    imageUrls: [...o.imageUrls],
  }));
  const closureGroups: ClosureGroup[] = [
    {
      _id: 'grp-existing-1',
      clientId: 'cli-1',
      clientSequenceNumber: 1,
      startDate: '2026-05-10',
      endDate: '2026-05-14',
      status: 'paga',
      invoiceNumber: 'NF-EXIST-001',
      cacambaIds: orders.find((order) => order._id === 'ord-5')?.cacambas.map((cacamba) => ({ ...cacamba })) || [],
      createdAt: '2026-05-14T12:30:00.000Z',
      updatedAt: '2026-05-14T12:40:00.000Z',
    },
  ];

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const { pathname, searchParams } = url;
    const method = req.method();

    if (pathname === '/sw.js') {
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'self.addEventListener("install",()=>self.skipWaiting());' });
    }

    if (url.origin === 'https://viacep.com.br' && pathname.includes('/ws/')) {
      return json(route, {
        cep: '12238-500',
        logradouro: 'Rua Januaria',
        bairro: 'Chácaras Reunidas',
        localidade: 'São José dos Campos',
      });
    }

    if (pathname === '/login' && method === 'POST') {
      const body = req.postDataJSON() as { username?: string };
      const username = (body?.username || '').toLowerCase();
      if (username.includes('erro')) {
        return json(route, { message: 'Falha no login.' }, 401);
      }
      const role: Role = username.includes('motorista') ? 'motorista' : 'admin';
      return json(route, { token: createJwt(role), role });
    }

    if (pathname === '/orders' && method === 'GET') {
      return json(route, orders);
    }
    if (pathname === '/orders' && method === 'POST') {
      const body = req.postDataJSON() as Partial<Order>;
      const driver = drivers.find((d) => d._id === body.motorista);
      const created: Order = {
        _id: `ord-${orders.length + 10}`,
        orderNumber: 3000 + orders.length,
        clientId: String(body.clientId ?? clients[0]?._id ?? 'cli-1'),
        clientName: String(body.clientName ?? clients[0]?.clientName ?? 'Cliente'),
        cnpjCpf: String(body.cnpjCpf ?? ''),
        city: String(body.city ?? ''),
        cep: String(body.cep ?? ''),
        contactName: String(body.contactName ?? ''),
        contactNumber: String(body.contactNumber ?? ''),
        neighborhood: String(body.neighborhood ?? ''),
        address: String(body.address ?? ''),
        addressNumber: String(body.addressNumber ?? ''),
        placa: String(body.placa ?? ''),
        type: (body.type as 'entrega' | 'retirada') ?? 'entrega',
        priority: Number(body.priority ?? 0),
        status: 'pendente',
        motorista: driver ? { _id: driver._id, username: driver.username } : String(body.motorista ?? 'drv-1'),
        cacambas: [],
        imageUrls: [],
        createdAt: nowIso,
        updatedAt: nowIso,
        price: typeof body.price === 'number' ? body.price : undefined,
      };
      orders.unshift(created);
      return json(route, created, 201);
    }
    if (/^\/orders\/[^/]+$/.test(pathname) && method === 'PATCH') {
      const id = pathname.split('/')[2];
      const body = req.postDataJSON() as Partial<Order>;
      const idx = orders.findIndex((o) => o._id === id);
      if (idx === -1) return json(route, { message: 'Pedido não encontrado' }, 404);
      const next = { ...orders[idx], ...body, updatedAt: nowIso };
      if (body.motorista) {
        const d = drivers.find((driver) => driver._id === body.motorista);
        next.motorista = d ? { _id: d._id, username: d.username } : String(body.motorista);
      }
      orders[idx] = next;
      return json(route, next);
    }
    if (/^\/orders\/[^/]+\/correction$/.test(pathname) && method === 'PATCH') {
      const id = pathname.split('/')[2];
      const body = req.postDataJSON() as Partial<Order>;
      const idx = orders.findIndex((o) => o._id === id);
      if (idx === -1) return json(route, { message: 'Pedido não encontrado' }, 404);
      if (orders[idx].status !== 'pendente') {
        return json(route, { message: 'Apenas pedidos pendentes podem ser corrigidos.' }, 409);
      }
      if (orders[idx].cacambas.length > 0) {
        return json(route, { message: 'Não é possível corrigir um pedido que já possui caçambas cadastradas.' }, 409);
      }
      const driver = drivers.find((d) => d._id === body.motorista);
      if (!driver) return json(route, { message: 'Motorista não encontrado.' }, 404);

      const next = {
        ...orders[idx],
        type: (body.type as 'entrega' | 'retirada') ?? orders[idx].type,
        motorista: { _id: driver._id, username: driver.username },
        updatedAt: nowIso,
      };
      orders[idx] = next;
      return json(route, next);
    }
    if (/^\/orders\/[^/]+\/change-client$/.test(pathname) && method === 'PATCH') {
      const orderId = pathname.split('/')[2];
      const body = req.postDataJSON() as { clientId?: string };
      const targetClientId = String(body.clientId || '').trim();
      const orderIndex = orders.findIndex((order) => order._id === orderId);
      if (orderIndex === -1) return json(route, { message: 'Pedido não encontrado.' }, 404);
      const targetClient = clients.find((client) => client._id === targetClientId);
      if (!targetClient) return json(route, { message: 'Cliente de destino não encontrado.' }, 404);

      const order = orders[orderIndex];
      const groupedCacambas = order.cacambas.filter(
        (cacamba) =>
          cacamba.tipo === 'retirada' &&
          Boolean(cacamba.closureGroupId) &&
          (cacamba.paymentStatus === 'nota_fiscal_pendente' || cacamba.paymentStatus === 'paga'),
      );

      let migratedCacambas = 0;
      let createdClosureGroups = 0;
      let updatedClosureGroups = 0;
      let deletedClosureGroups = 0;

      for (const groupId of Array.from(new Set(groupedCacambas.map((cacamba) => String(cacamba.closureGroupId))))) {
        const groupIndex = closureGroups.findIndex((group) => group._id === groupId);
        if (groupIndex === -1) {
          return json(route, { message: 'Grupo de fechamento relacionado não foi encontrado.' }, 409);
        }
        const group = closureGroups[groupIndex];
        const movingIds = group.cacambaIds
          .map((cacamba) => cacamba._id)
          .filter((cacambaId) => groupedCacambas.some((cacamba) => cacamba._id === cacambaId));
        if (!movingIds.length) continue;

        const newGroupId = `grp-${closureGroups.length + 1}`;
        const nextSequence = getNextClosureGroupSequence(closureGroups, targetClientId);
        const movedGroupCacambas = group.cacambaIds
          .filter((cacamba) => movingIds.includes(cacamba._id))
          .map((cacamba) => ({ ...cacamba, closureGroupId: newGroupId }));

        closureGroups.unshift({
          _id: newGroupId,
          clientId: targetClientId,
          clientSequenceNumber: nextSequence,
          startDate: group.startDate,
          endDate: group.endDate,
          status: group.status,
          invoiceNumber: group.invoiceNumber,
          cacambaIds: movedGroupCacambas,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        createdClosureGroups += 1;
        migratedCacambas += movingIds.length;

        orders.forEach((existingOrder) => {
          existingOrder.cacambas = existingOrder.cacambas.map((cacamba) =>
            movingIds.includes(cacamba._id) ? { ...cacamba, closureGroupId: newGroupId } : cacamba,
          );
        });

        const remainingCacambas = group.cacambaIds.filter((cacamba) => !movingIds.includes(cacamba._id));
        const sourceGroupIndexAfterCreate = closureGroups.findIndex((item) => item._id === groupId);
        if (!remainingCacambas.length) {
          if (sourceGroupIndexAfterCreate >= 0) {
            closureGroups.splice(sourceGroupIndexAfterCreate, 1);
          }
          deletedClosureGroups += 1;
        } else if (sourceGroupIndexAfterCreate >= 0) {
          closureGroups[sourceGroupIndexAfterCreate] = {
            ...group,
            cacambaIds: remainingCacambas,
            updatedAt: nowIso,
          };
          updatedClosureGroups += 1;
        }
      }

      const updatedOrder: Order = {
        ...order,
        clientId: targetClient._id,
        clientName: targetClient.clientName,
        cnpjCpf: targetClient.cnpjCpf || '',
        city: targetClient.city || '',
        cep: targetClient.cep || '',
        contactName: targetClient.contactName || '',
        contactNumber: targetClient.contactNumber || '',
        neighborhood: targetClient.neighborhood || '',
        address: targetClient.address || '',
        addressNumber: targetClient.addressNumber || '',
      };
      orders[orderIndex] = updatedOrder;

      return json(route, {
        order: updatedOrder,
        migration: {
          migratedCacambas,
          createdClosureGroups,
          updatedClosureGroups,
          deletedClosureGroups,
        },
      });
    }
    if (/^\/orders\/[^/]+$/.test(pathname) && method === 'DELETE') {
      const id = pathname.split('/')[2];
      const idx = orders.findIndex((o) => o._id === id);
      if (idx >= 0) orders.splice(idx, 1);
      return json(route, { ok: true });
    }

    if (pathname === '/drivers' && method === 'GET') {
      return json(route, drivers);
    }
    if (/^\/drivers\/[^/]+$/.test(pathname) && method === 'DELETE') {
      const id = pathname.split('/')[2];
      const idx = drivers.findIndex((d) => d._id === id);
      if (idx >= 0) drivers.splice(idx, 1);
      return json(route, { ok: true });
    }
    if (pathname === '/drivers' && method === 'POST') {
      const body = req.postDataJSON() as Partial<Driver> & { password?: string };
      const created = { _id: `drv-${drivers.length + 10}`, username: String(body.username ?? 'novo-motorista') };
      drivers.push(created);
      return json(route, created, 201);
    }
    if (/^\/drivers\/[^/]+$/.test(pathname) && method === 'PATCH') {
      const id = pathname.split('/')[2];
      const body = req.postDataJSON() as Partial<Driver>;
      const idx = drivers.findIndex((d) => d._id === id);
      if (idx === -1) return json(route, { message: 'Motorista não encontrado' }, 404);
      drivers[idx] = { ...drivers[idx], ...body };
      return json(route, drivers[idx]);
    }

    if (pathname === '/cities' && method === 'GET') {
      const uniqueCities = Array.from(new Set(clients.map((client) => client.city).filter(Boolean)));
      return json(
        route,
        uniqueCities.map((name, index) => ({
          _id: `city-${index + 1}`,
          name,
        })),
      );
    }

    if (pathname === '/billing/summary' && method === 'GET') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const granularity = searchParams.get('granularity') || 'monthly';
      const city = searchParams.get('city') || '';
      const clientId = searchParams.get('clientId') || '';
      const contentType = searchParams.get('contentType') || '';

      if (!startDate || !endDate) {
        return json(route, { message: 'startDate e endDate são obrigatórios.' }, 400);
      }

      const start = parseInputDate(startDate);
      const end = parseInputDate(endDate);
      end.setHours(23, 59, 59, 999);
      const { previousStart, previousEnd } = buildPreviousRange(start, end);

      const buildRows = (rangeStart: Date, rangeEnd: Date) =>
        orders
          .filter((order) => order.type === 'retirada' && order.status === 'concluido')
          .filter((order) => !city || order.city === city)
          .filter((order) => !clientId || order.clientId === clientId)
          .filter((order) => {
            const updatedAt = new Date(order.updatedAt).getTime();
            return updatedAt >= rangeStart.getTime() && updatedAt <= rangeEnd.getTime();
          })
          .flatMap((order) =>
            order.cacambas
              .filter((cacamba) => cacamba.tipo === 'retirada')
              .filter((cacamba) => cacamba.paymentStatus === 'paga')
              .filter((cacamba) => typeof cacamba.price === 'number' && cacamba.price > 0)
              .filter((cacamba) => !contentType || cacamba.contentType === contentType)
              .map((cacamba) => ({
                clientId: order.clientId,
                clientName: order.clientName,
                city: order.city || 'Sem cidade',
                contentType: cacamba.contentType || 'Sem tipo',
                price: Number(cacamba.price || 0),
                updatedAt: new Date(order.updatedAt),
              })),
          );

      const currentRows = buildRows(start, end);
      const previousRows = buildRows(previousStart, previousEnd);
      const buckets = buildBuckets(start, end, granularity);
      const totalRevenue = currentRows.reduce((sum, row) => sum + row.price, 0);
      const previousRevenue = previousRows.reduce((sum, row) => sum + row.price, 0);

      currentRows.forEach((row) => {
        const bucket = buckets.find((item) => {
          const bucketStart = new Date(item.start).getTime();
          const bucketEnd = new Date(item.end).getTime();
          const value = row.updatedAt.getTime();
          return value >= bucketStart && value <= bucketEnd;
        });
        if (bucket) {
          bucket.revenue = roundCurrency(bucket.revenue + row.price);
          bucket.count += 1;
        }
      });

      const groupRows = (keySelector: (row: (typeof currentRows)[number]) => string) => {
        const grouped = new Map<string, { revenue: number; cacambaCount: number }>();
        currentRows.forEach((row) => {
          const key = keySelector(row);
          const current = grouped.get(key) || { revenue: 0, cacambaCount: 0 };
          current.revenue += row.price;
          current.cacambaCount += 1;
          grouped.set(key, current);
        });
        return Array.from(grouped.entries())
          .map(([key, value]) => ({
            key,
            revenue: roundCurrency(value.revenue),
            cacambaCount: value.cacambaCount,
            averageTicket: value.cacambaCount ? roundCurrency(value.revenue / value.cacambaCount) : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue || b.cacambaCount - a.cacambaCount || a.key.localeCompare(b.key));
      };

      const topClients = groupRows((row) => row.clientId).map((item) => ({
        clientId: item.key,
        clientName: currentRows.find((row) => row.clientId === item.key)?.clientName || item.key,
        revenue: item.revenue,
        cacambaCount: item.cacambaCount,
        averageTicket: item.averageTicket,
      }));
      const topCities = groupRows((row) => row.city).map((item) => ({
        city: item.key,
        revenue: item.revenue,
        cacambaCount: item.cacambaCount,
      }));
      const topContentTypes = groupRows((row) => row.contentType).map((item) => ({
        contentType: item.key,
        revenue: item.revenue,
        cacambaCount: item.cacambaCount,
      }));
      const bestBucket = buckets.reduce((best, bucket) => (bucket.revenue > best.revenue ? bucket : best), {
        label: '',
        start: '',
        end: '',
        revenue: 0,
        count: 0,
      });
      const delta =
        previousRevenue === 0
          ? (totalRevenue > 0 ? 100 : 0)
          : ((totalRevenue - previousRevenue) / previousRevenue) * 100;

      return json(route, {
        summary: {
          totalRevenue: roundCurrency(totalRevenue),
          totalCacambas: currentRows.length,
          averageTicket: currentRows.length ? roundCurrency(totalRevenue / currentRows.length) : 0,
          activeClients: new Set(currentRows.map((row) => row.clientId)).size,
          previousPeriodRevenue: roundCurrency(previousRevenue),
          revenueDeltaPercent: roundCurrency(delta),
        },
        timeseries: buckets,
        topClients,
        topCities,
        topContentTypes,
        highlights: {
          topClientName: topClients[0]?.clientName || '',
          topClientRevenue: topClients[0]?.revenue || 0,
          bestBucketLabel: bestBucket.label,
          bestBucketRevenue: bestBucket.revenue,
        },
      });
    }

    if (pathname === '/clients' && method === 'GET') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const closure = searchParams.get('closure') === 'true';
      const type = searchParams.get('type');
      const paymentStatus = searchParams.get('paymentStatus') || 'all';

      const buildClosureClientPayload = (range?: { start: Date; end: Date }) => {
        const closureClientMeta = new Map<
          string,
          {
            hasPendingClosureItems: boolean;
            hasGeneratedClosureGroups: boolean;
            hasPendingClosureMetadata: boolean;
            pendingClosureCount: number;
            generatedClosureGroupsCount: number;
            pendingClosureMetadataCount: number;
            pendingClosureMissingPriceCount: number;
            pendingClosureMissingContentTypeCount: number;
            matchesFilter: boolean;
          }
        >();

        orders
          .filter((o) => o.status === 'concluido')
          .filter((o) => (closure ? o.type === 'retirada' : true))
          .filter((o) => (type ? o.type === type : true))
          .filter((o) => {
            if (!range) return true;
            const updated = new Date(o.updatedAt).getTime();
            return updated >= range.start.getTime() && updated <= range.end.getTime();
          })
          .forEach((order) => {
            const retirada = order.cacambas.filter((c) => c.tipo === 'retirada');
            if (closure && retirada.length === 0) return;

            const pendingCount = retirada.filter((c) => (c.paymentStatus || 'pendente') === 'pendente').length;
            const metadataPending = retirada.filter((c) => {
              if ((c.paymentStatus || 'pendente') !== 'pendente') return false;
              const hasValidPrice = typeof c.price === 'number' && Number.isFinite(c.price) && c.price >= 0;
              const hasValidContentType = typeof c.contentType === 'string' && c.contentType.trim().length > 0;
              return !hasValidPrice || !hasValidContentType;
            });
            const generatedCount = retirada.filter((c) =>
              c.paymentStatus === 'nota_fiscal_pendente' || c.paymentStatus === 'paga',
            ).length;
            const invoicePendingCount = retirada.filter((c) => c.paymentStatus === 'nota_fiscal_pendente').length;
            const paidCount = retirada.filter((c) => c.paymentStatus === 'paga').length;
            const metadataPendingCount = metadataPending.length;
            const missingPriceCount = metadataPending.filter((c) =>
              !(typeof c.price === 'number' && Number.isFinite(c.price) && c.price >= 0),
            ).length;
            const missingContentTypeCount = metadataPending.filter((c) =>
              !(typeof c.contentType === 'string' && c.contentType.trim().length > 0),
            ).length;
            const matchesFilter =
              !closure ||
              paymentStatus === 'all' ||
              (paymentStatus === 'pending' && pendingCount > 0) ||
              (paymentStatus === 'metadata_pending' && metadataPendingCount > 0) ||
              (paymentStatus === 'invoice_pending' && invoicePendingCount > 0) ||
              (paymentStatus === 'paid' && paidCount > 0);

            const current = closureClientMeta.get(order.clientId) || {
              hasPendingClosureItems: false,
              hasGeneratedClosureGroups: false,
              hasPendingClosureMetadata: false,
              pendingClosureCount: 0,
              generatedClosureGroupsCount: 0,
              pendingClosureMetadataCount: 0,
              pendingClosureMissingPriceCount: 0,
              pendingClosureMissingContentTypeCount: 0,
              matchesFilter: false,
            };

            current.hasPendingClosureItems = current.hasPendingClosureItems || pendingCount > 0;
            current.hasGeneratedClosureGroups = current.hasGeneratedClosureGroups || generatedCount > 0;
            current.hasPendingClosureMetadata = current.hasPendingClosureMetadata || metadataPendingCount > 0;
            current.pendingClosureCount += pendingCount;
            current.generatedClosureGroupsCount += generatedCount;
            current.pendingClosureMetadataCount += metadataPendingCount;
            current.pendingClosureMissingPriceCount += missingPriceCount;
            current.pendingClosureMissingContentTypeCount += missingContentTypeCount;
            current.matchesFilter = current.matchesFilter || matchesFilter;
            closureClientMeta.set(order.clientId, current);
          });

        return clients
          .filter((client) => {
            if (!closure) return true;
            return Boolean(closureClientMeta.get(client._id)?.matchesFilter);
          })
          .map((client) => ({
            ...client,
            ...(closureClientMeta.get(client._id) || {
              hasPendingClosureItems: false,
              hasGeneratedClosureGroups: false,
              hasPendingClosureMetadata: false,
              pendingClosureCount: 0,
              generatedClosureGroupsCount: 0,
              pendingClosureMetadataCount: 0,
              pendingClosureMissingPriceCount: 0,
              pendingClosureMissingContentTypeCount: 0,
            }),
          }));
      };

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return json(route, buildClosureClientPayload({ start, end }));
      }

      return json(route, closure ? buildClosureClientPayload() : clients);
    }
    if (pathname === '/clients' && method === 'POST') {
      const body = req.postDataJSON() as Record<string, unknown>;
      const created = {
        _id: `cli-${clients.length + 10}`,
        clientName: String(body.clientName ?? 'Novo Cliente'),
        cnpjCpf: String(body.cnpjCpf ?? ''),
        contactName: String(body.contactName ?? ''),
        contactNumber: String(body.contactNumber ?? ''),
        address: String(body.address ?? ''),
        addressNumber: String(body.addressNumber ?? ''),
        neighborhood: String(body.neighborhood ?? ''),
        city: String(body.city ?? ''),
        cep: String(body.cep ?? ''),
        createdAt: nowIso,
      };
      clients.unshift(created);
      return json(route, created, 201);
    }
    if (/^\/clients\/[^/]+$/.test(pathname) && method === 'PATCH') {
      const id = pathname.split('/')[2];
      const body = req.postDataJSON() as Record<string, unknown>;
      const idx = clients.findIndex((c) => c._id === id);
      if (idx === -1) return json(route, { message: 'Cliente não encontrado' }, 404);
      clients[idx] = {
        ...clients[idx],
        ...Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v ?? '')])),
      };
      return json(route, clients[idx]);
    }
    if (/^\/clients\/[^/]+$/.test(pathname) && method === 'DELETE') {
      const id = pathname.split('/')[2];
      const idx = clients.findIndex((c) => c._id === id);
      if (idx >= 0) clients.splice(idx, 1);
      return json(route, { ok: true });
    }
    if (/^\/clients\/[^/]+\/orders$/.test(pathname) && method === 'GET') {
      const clientId = pathname.split('/')[2];
      const closure = searchParams.get('closure') === 'true';
      const paymentStatus = searchParams.get('paymentStatus') || 'all';
      let filtered = orders.filter((o) => o.clientId === clientId);
      if (closure) {
        filtered = filtered.filter((o) => o.type === 'retirada' && o.status === 'concluido');
        filtered = filtered
          .map((o) => ({
            ...o,
            cacambas: o.cacambas.filter((c) => {
              if (c.tipo !== 'retirada') return false;
              if (paymentStatus === 'pending') return (c.paymentStatus || 'pendente') === 'pendente';
              if (paymentStatus === 'metadata_pending') {
                const hasValidPrice = typeof c.price === 'number' && Number.isFinite(c.price) && c.price >= 0;
                const hasValidContentType = typeof c.contentType === 'string' && c.contentType.trim().length > 0;
                return (c.paymentStatus || 'pendente') === 'pendente' && (!hasValidPrice || !hasValidContentType);
              }
              if (paymentStatus === 'invoice_pending') return c.paymentStatus === 'nota_fiscal_pendente';
              if (paymentStatus === 'paid') return c.paymentStatus === 'paga';
              return true;
            }),
          }))
          .filter((o) => o.cacambas.length > 0);
      }
      if (searchParams.get('status')) {
        filtered = filtered.filter((o) => o.status === searchParams.get('status'));
      }
      if (searchParams.get('type')) {
        filtered = filtered.filter((o) => o.type === searchParams.get('type'));
      }
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((o) => {
          const updated = new Date(o.updatedAt).getTime();
          return updated >= start.getTime() && updated <= end.getTime();
        });
      }
      if (searchParams.get('local')) {
        filtered = filtered.map((o) => ({
          ...o,
          cacambas: o.cacambas.filter((c) => c.local === searchParams.get('local')),
        }));
      }
      return json(route, filtered);
    }

    if (/^\/clients\/[^/]+\/closure-groups$/.test(pathname) && method === 'GET') {
      const clientId = pathname.split('/')[2];
      const status = searchParams.get('status') || 'all';
      return json(
        route,
        closureGroups.filter(
          (group) => group.clientId === clientId && (status === 'all' || group.status === status),
        ),
      );
    }

    if (pathname === '/closures/download' && method === 'POST') {
      const body = req.postDataJSON() as { selectedCacambaIds?: string[] };
      const ids = body.selectedCacambaIds || [];
      const selectedCacambas: Cacamba[] = [];
      orders.forEach((o) => {
        o.cacambas = o.cacambas.map((c) => {
          if (!ids.includes(c._id)) return c;
          const next = { ...c, paymentStatus: 'nota_fiscal_pendente' as const };
          selectedCacambas.push(next);
          return next;
        });
      });
      const groupId = `grp-${closureGroups.length + 1}`;
      const clientId = String((req.postDataJSON() as any).clientId || 'cli-1');
      const nextSequence =
        closureGroups.filter((group) => group.clientId === clientId).reduce((max, group) => {
          const value = Number(group.clientSequenceNumber || 0);
          return value > max ? value : max;
        }, 0) + 1;
      closureGroups.unshift({
        _id: groupId,
        clientId,
        clientSequenceNumber: nextSequence,
        startDate: String((req.postDataJSON() as any).startDate || nowIso),
        endDate: String((req.postDataJSON() as any).endDate || nowIso),
        status: 'nota_fiscal_pendente',
        cacambaIds: selectedCacambas,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      return json(route, {
        closureGroup: { _id: groupId, clientId, clientSequenceNumber: nextSequence, status: 'nota_fiscal_pendente' },
        updatedCacambaIds: ids,
      });
    }

    if (/^\/closure-groups\/[^/]+\/invoice$/.test(pathname) && method === 'PATCH') {
      const groupId = pathname.split('/')[2];
      const body = req.postDataJSON() as { invoiceNumber?: string };
      const group = closureGroups.find((item) => item._id === groupId);
      if (!group) return json(route, { message: 'Grupo não encontrado' }, 404);
      group.invoiceNumber = String(body.invoiceNumber || '');
      group.status = 'paga';
      group.updatedAt = nowIso;
      orders.forEach((order) => {
        order.cacambas = order.cacambas.map((cacamba) =>
          group.cacambaIds.some((item) => item._id === cacamba._id)
            ? { ...cacamba, paymentStatus: 'paga' }
            : cacamba,
        );
      });
      return json(route, {
        closureGroup: {
          _id: groupId,
          clientSequenceNumber: group.clientSequenceNumber,
          status: 'paga',
          invoiceNumber: group.invoiceNumber,
        },
      });
    }

    if (pathname === '/driver/orders' && method === 'GET') {
      const driverOrders = orders
        .filter((o) => getOrderMotoristaId(o) === 'drv-1' && o.status !== 'concluido')
        .map(({ price, ...rest }) => rest);
      return json(route, driverOrders);
    }
    if (/^\/driver\/orders\/[^/]+\/complete$/.test(pathname) && method === 'PATCH') {
      const id = pathname.split('/')[3];
      const match = orders.find((o) => o._id === id);
      if (match) {
        match.status = 'concluido';
      }
      return json(route, { ok: true });
    }
    if (/^\/driver\/orders\/[^/]+\/cacambas$/.test(pathname) && method === 'POST') {
      const orderId = pathname.split('/')[3];
      const order = orders.find((o) => o._id === orderId);
      if (!order) return json(route, { message: 'Pedido não encontrado' }, 404);
      const newCacamba: Cacamba = {
        _id: `cac-${Math.floor(Math.random() * 10000)}`,
        numero: '999',
        tipo: order.type,
        local: 'via_publica',
        orderId,
        createdAt: nowIso,
        horaServicoDigitos: '999',
      };
      order.cacambas.push(newCacamba);
      return json(route, { cacamba: newCacamba }, 201);
    }

    if (/^\/cacambas\/[^/]+$/.test(pathname) && method === 'DELETE') {
      const cacambaId = pathname.split('/')[2];
      for (const order of orders) {
        const idx = order.cacambas.findIndex((c) => c._id === cacambaId);
        if (idx >= 0) {
          order.cacambas.splice(idx, 1);
          break;
        }
      }
      return json(route, { ok: true });
    }
    if (/^\/cacambas\/[^/]+$/.test(pathname) && method === 'PATCH') {
      const cacambaId = pathname.split('/')[2];
      const order = orders.find((o) => o.cacambas.some((c) => c._id === cacambaId));
      if (!order) return json(route, { message: 'Caçamba não encontrada' }, 404);
      const found = order.cacambas.find((c) => c._id === cacambaId)!;
      const updated = {
        ...found,
        numero: '436',
        horaServicoDigitos: found.horaServicoDigitos ?? '345',
      };
      order.cacambas = order.cacambas.map((c) => (c._id === cacambaId ? updated : c));
      return json(route, { cacamba: updated });
    }

    if (pathname === '/push/subscribe' && method === 'POST') {
      return json(route, { ok: true }, 201);
    }

    if (pathname.startsWith('/uploads/')) {
      const png1x1 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=';
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(png1x1, 'base64'),
      });
    }

    if (pathname === '/' || pathname.endsWith('.js') || pathname.endsWith('.css') || pathname.endsWith('.html') || pathname.endsWith('.ico') || pathname.endsWith('.webp')) {
      return route.continue();
    }

    if (url.origin !== API_ORIGIN) {
      return route.continue();
    }

    return json(route, { message: `Unhandled mock route: ${method} ${pathname}` }, 500);
  });
};
type ClosureGroup = {
  _id: string;
  clientId: string;
  clientSequenceNumber: number;
  startDate: string;
  endDate: string;
  status: 'nota_fiscal_pendente' | 'paga';
  invoiceNumber?: string;
  cacambaIds: Cacamba[];
  createdAt?: string;
  updatedAt?: string;
};
