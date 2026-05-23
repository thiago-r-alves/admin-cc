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
  paymentStatus?: 'pendente' | 'paga';
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

    if (pathname === '/clients' && method === 'GET') {
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const closure = searchParams.get('closure') === 'true';
      const type = searchParams.get('type');

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const concludedClientIds = new Set(
          orders
            .filter((o) => o.status === 'concluido')
            .filter((o) => (closure ? o.type === 'retirada' : true))
            .filter((o) => (type ? o.type === type : true))
            .filter((o) => {
              const updated = new Date(o.updatedAt).getTime();
              return updated >= start.getTime() && updated <= end.getTime();
            })
            .map((o) => o.clientId),
        );

        return json(route, clients.filter((c) => concludedClientIds.has(c._id)));
      }

      return json(route, clients);
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
              if (paymentStatus === 'pending') return (c.paymentStatus || 'pendente') !== 'paga';
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

    if (pathname === '/closures/download' && method === 'POST') {
      const body = req.postDataJSON() as { selectedCacambaIds?: string[] };
      const ids = body.selectedCacambaIds || [];
      orders.forEach((o) => {
        o.cacambas = o.cacambas.map((c) => (ids.includes(c._id) ? { ...c, paymentStatus: 'paga' } : c));
      });
      return json(route, { paidCacambaIds: ids });
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
