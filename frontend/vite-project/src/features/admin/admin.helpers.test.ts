import { describe, expect, it } from 'vitest';
import type { IOrder } from '../../interfaces';
import {
  filterAcompanhamentoCacambas,
  formatOrderAddress,
  getAcompanhamentoCacambas,
  getCompletedOrders,
  getPendingCountByDriver,
  getPendingOrders,
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
});
