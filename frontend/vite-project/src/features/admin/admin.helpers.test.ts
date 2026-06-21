import { describe, expect, it } from 'vitest';
import type { IOrder } from '../../interfaces';
import {
  filterAcompanhamentoCacambas,
  formatOrderAddress,
  getAcompanhamentoCacambas,
  getCompletedOrders,
  getPendingCountByDriver,
  getPendingOrders,
  getPendingWithdrawalGroups,
  getSaoJoseBusinessDaysAfter,
  getSaoJoseDueDateAfterBusinessDays,
  sortAcompanhamentoCacambas,
} from './admin.helpers';

const buildOrder = (overrides: Partial<IOrder>): IOrder => ({
  _id: 'ord-1',
  orderNumber: 1,
  clientName: 'Cliente Base',
  contactName: 'Contato',
  contactNumber: '11999999999',
  neighborhood: 'Centro',
  address: 'Rua A',
  addressNumber: '10',
  type: 'entrega',
  priority: 0,
  status: 'pendente',
  ...overrides,
});

describe('admin.helpers', () => {
  it('formata endereco do pedido com dados disponiveis', () => {
    expect(
      formatOrderAddress(
        buildOrder({
          address: 'Rua Januaria',
          addressNumber: '50',
          neighborhood: 'Centro',
          city: 'Sao Jose dos Campos',
          cep: '12200-000',
        }),
      ),
    ).toBe('Rua Januaria, 50 - Centro - Sao Jose dos Campos - CEP 12200-000');
  });

  it('mantem apenas cacambas entregues ainda sem retirada no acompanhamento', () => {
    const orders = [
      buildOrder({
        _id: 'ord-1',
        cacambas: [
          {
            _id: 'cac-1',
            numero: '101',
            tipo: 'entrega',
            orderId: 'ord-1',
            createdAt: '2026-05-01T10:00:00.000Z',
          },
          {
            _id: 'cac-2',
            numero: '102',
            tipo: 'entrega',
            orderId: 'ord-1',
            createdAt: '2026-05-03T10:00:00.000Z',
          },
        ],
      }),
      buildOrder({
        _id: 'ord-2',
        orderNumber: 2,
        cacambas: [
          {
            _id: 'cac-3',
            numero: '101',
            tipo: 'retirada',
            orderId: 'ord-2',
            createdAt: '2026-05-05T10:00:00.000Z',
          },
        ],
      }),
    ];

    expect(getAcompanhamentoCacambas(orders).map((item) => item.numero)).toEqual(['102']);
  });

  it('filtra acompanhamentos por campos normalizados', () => {
    const order = buildOrder({
      clientName: 'Joao Obras',
      city: 'Sao Jose dos Campos',
      cacambas: [
        {
          _id: 'cac-1',
          numero: '401',
          tipo: 'entrega',
          orderId: 'ord-1',
          createdAt: '2026-05-01T10:00:00.000Z',
          horaServicoDigitos: '123',
        },
      ],
    });
    const items = getAcompanhamentoCacambas([order]);

    expect(
      filterAcompanhamentoCacambas(items, {
        numero: '',
        clientName: 'joao',
        cnpjCpf: '',
        contact: '',
        phone: '',
        serviceOrder: '',
        serviceOrderDigital: '',
        address: '',
        neighborhood: '',
        city: 'sao jose',
        cep: '',
      }),
    ).toHaveLength(1);
  });

  it('ordena acompanhamentos por cliente em ordem alfabetica quando solicitado', () => {
    const orders = [
      buildOrder({
        _id: 'ord-beta',
        clientName: 'Beta Obras',
        cacambas: [
          {
            _id: 'cac-beta',
            numero: '201',
            tipo: 'entrega',
            orderId: 'ord-beta',
            createdAt: '2026-05-03T10:00:00.000Z',
          },
        ],
      }),
      buildOrder({
        _id: 'ord-alpha',
        clientName: 'Alpha Obras',
        cacambas: [
          {
            _id: 'cac-alpha',
            numero: '101',
            tipo: 'entrega',
            orderId: 'ord-alpha',
            createdAt: '2026-05-01T10:00:00.000Z',
          },
        ],
      }),
    ];
    const items = getAcompanhamentoCacambas(orders);

    expect(items.map((item) => item.numero)).toEqual(['201', '101']);
    expect(sortAcompanhamentoCacambas(items, 'clientName').map((item) => item.numero)).toEqual(['101', '201']);
  });

  it('desempata a ordenacao alfabetica de acompanhamentos pelo numero da cacamba', () => {
    const orders = [
      buildOrder({
        _id: 'ord-1',
        clientName: 'Cliente Repetido',
        cacambas: [
          {
            _id: 'cac-10',
            numero: '010',
            tipo: 'entrega',
            orderId: 'ord-1',
            createdAt: '2026-05-03T10:00:00.000Z',
          },
        ],
      }),
      buildOrder({
        _id: 'ord-2',
        clientName: 'Cliente Repetido',
        cacambas: [
          {
            _id: 'cac-2',
            numero: '002',
            tipo: 'entrega',
            orderId: 'ord-2',
            createdAt: '2026-05-01T10:00:00.000Z',
          },
        ],
      }),
    ];
    const items = getAcompanhamentoCacambas(orders);

    expect(sortAcompanhamentoCacambas(items, 'clientName').map((item) => item.numero)).toEqual(['002', '010']);
  });

  it('ordena pendentes e concluidos do motorista por data mais recente', () => {
    const older = buildOrder({ _id: 'older', orderNumber: 10, createdAt: '2026-05-01T10:00:00.000Z' });
    const newer = buildOrder({ _id: 'newer', orderNumber: 11, createdAt: '2026-05-02T10:00:00.000Z' });
    const completed = buildOrder({
      _id: 'completed',
      orderNumber: 12,
      status: 'concluido',
      updatedAt: '2026-05-03T10:00:00.000Z',
    });

    expect(getPendingOrders([older, completed, newer]).map((order) => order._id)).toEqual(['newer', 'older']);
    expect(getCompletedOrders([older, completed, newer]).map((order) => order._id)).toEqual(['completed']);
  });

  it('conta pedidos pendentes por motorista populado ou id simples', () => {
    expect(
      getPendingCountByDriver(
        [
          { _id: 'drv-1', username: 'Ana' },
          { _id: 'drv-2', username: 'Beto' },
        ],
        [
          buildOrder({ _id: 'ord-1', motorista: 'drv-1' }),
          buildOrder({ _id: 'ord-2', motorista: { _id: 'drv-1', username: 'Ana' } }),
          buildOrder({ _id: 'ord-3', motorista: 'drv-2', status: 'concluido' }),
        ],
      ),
    ).toEqual({ 'drv-1': 2, 'drv-2': 0 });
  });

  it.each([
    ['fim de semana', '2026-05-08T09:00:00-03:00', '2026-05-15T12:00:00-03:00', '2026-05-15'],
    ['19 de marco', '2026-03-18T09:00:00-03:00', '2026-03-26T12:00:00-03:00', '2026-03-26'],
    ['Corpus Christi', '2026-06-03T09:00:00-03:00', '2026-06-11T12:00:00-03:00', '2026-06-11'],
    ['9 de julho', '2026-07-08T09:00:00-03:00', '2026-07-16T12:00:00-03:00', '2026-07-16'],
    ['27 de julho', '2026-07-24T09:00:00-03:00', '2026-08-03T12:00:00-03:00', '2026-08-03'],
  ])('conta 5 dias uteis de Sao Jose dos Campos ignorando %s', (_label, deliveredAt, today, dueDate) => {
    expect(getSaoJoseBusinessDaysAfter(deliveredAt, new Date(today))).toBe(5);
    expect(getSaoJoseDueDateAfterBusinessDays(deliveredAt)).toBe(dueDate);
  });

  it('mantem cacamba planejada na retirada pendente e remove apenas quando a retirada foi registrada', () => {
    const orders = [
      buildOrder({
        _id: 'delivery-a',
        clientId: 'cli-1',
        clientName: 'Cliente Retirada',
        address: 'Rua A',
        addressNumber: '10',
        neighborhood: 'Centro',
        city: 'São José dos Campos',
        cep: '12200-000',
        cacambas: [
          {
            _id: 'cac-due-1',
            numero: '101',
            tipo: 'entrega',
            orderId: 'delivery-a',
            createdAt: '2026-05-01T09:00:00-03:00',
          },
          {
            _id: 'cac-planned',
            numero: '102',
            tipo: 'entrega',
            orderId: 'delivery-a',
            createdAt: '2026-05-01T09:00:00-03:00',
          },
          {
            _id: 'cac-withdrawn',
            numero: '104',
            tipo: 'entrega',
            orderId: 'delivery-a',
            createdAt: '2026-05-01T09:00:00-03:00',
          },
        ],
      }),
      buildOrder({
        _id: 'delivery-b',
        clientId: 'cli-1',
        clientName: 'Cliente Retirada',
        address: 'Rua B',
        addressNumber: '20',
        neighborhood: 'Centro',
        city: 'São José dos Campos',
        cep: '12200-000',
        cacambas: [
          {
            _id: 'cac-due-2',
            numero: '103',
            tipo: 'entrega',
            orderId: 'delivery-b',
            createdAt: '2026-05-01T09:00:00-03:00',
          },
        ],
      }),
      buildOrder({
        _id: 'planned-withdrawal',
        orderNumber: 77,
        type: 'retirada',
        status: 'pendente',
        plannedWithdrawalCacambaIds: ['cac-planned'],
        cacambas: [],
      }),
      buildOrder({
        _id: 'completed-withdrawal',
        type: 'retirada',
        status: 'concluido',
        cacambas: [
          {
            _id: 'cac-withdrawn-action',
            numero: '104',
            tipo: 'retirada',
            orderId: 'completed-withdrawal',
            createdAt: '2026-05-10T09:00:00-03:00',
          },
        ],
      }),
    ];

    const groups = getPendingWithdrawalGroups(orders, new Date('2026-05-12T12:00:00-03:00'));

    expect(groups).toHaveLength(1);
    expect(groups[0].totalCacambas).toBe(3);
    expect(groups[0].groups).toHaveLength(2);
    const items = groups[0].groups.flatMap((group) => group.items);
    expect(items.map((item) => item.cacamba._id).sort()).toEqual([
      'cac-due-1',
      'cac-due-2',
      'cac-planned',
    ]);
    expect(items.find((item) => item.cacamba._id === 'cac-planned')?.plannedWithdrawal).toMatchObject({
      orderId: 'planned-withdrawal',
      orderNumber: 77,
      status: 'pendente',
    });
    expect(items.some((item) => item.cacamba._id === 'cac-withdrawn')).toBe(false);
    expect(groups[0].groups.find((group) => group.address.includes('Rua A'))?.availableCacambaIds).toEqual([
      'cac-due-1',
    ]);
  });
});
