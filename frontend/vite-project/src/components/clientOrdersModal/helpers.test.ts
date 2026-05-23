import { describe, expect, it } from 'vitest';
import type { IOrder } from '../../interfaces';
import {
  buildSelectedOrders,
  getOrderTotal,
  isEligibleForClosureSelection,
} from './helpers';

const baseOrder: IOrder = {
  _id: 'ord-1',
  orderNumber: 10,
  clientName: 'Cliente',
  contactName: 'Contato',
  contactNumber: '123',
  neighborhood: 'Bairro',
  address: 'Rua',
  addressNumber: '1',
  type: 'retirada',
  priority: 0,
  status: 'concluido',
  cacambas: [],
};

describe('clientOrdersModal helpers', () => {
  it('getOrderTotal soma apenas retiradas com preço válido', () => {
    const total = getOrderTotal({
      ...baseOrder,
      cacambas: [
        { _id: '1', numero: '1', tipo: 'retirada', orderId: 'ord-1', createdAt: '', price: 100 },
        { _id: '2', numero: '2', tipo: 'retirada', orderId: 'ord-1', createdAt: '', price: 50 },
        { _id: '3', numero: '3', tipo: 'entrega', orderId: 'ord-1', createdAt: '', price: 80 },
      ],
    });

    expect(total).toBe(150);
  });

  it('buildSelectedOrders inclui apenas caçambas selecionadas com valor e conteúdo válidos', () => {
    const orders = buildSelectedOrders(
      [
        {
          ...baseOrder,
          cacambas: [
            {
              _id: 'ok',
              numero: '10',
              tipo: 'retirada',
              orderId: 'ord-1',
              createdAt: '',
              contentType: 'Terra',
              price: 120,
            },
            {
              _id: 'sem-preco',
              numero: '11',
              tipo: 'retirada',
              orderId: 'ord-1',
              createdAt: '',
              contentType: 'Terra',
            },
          ],
        },
      ],
      ['ok', 'sem-preco'],
    );

    expect(orders).toHaveLength(1);
    expect(orders[0].cacambas).toHaveLength(1);
    expect(orders[0].cacambas?.[0]._id).toBe('ok');
  });

  it('isEligibleForClosureSelection valida status, tipo, preço e conteúdo', () => {
    expect(
      isEligibleForClosureSelection({
        _id: 'ok',
        numero: '12',
        tipo: 'retirada',
        orderId: 'ord-1',
        createdAt: '',
        paymentStatus: 'pendente',
        contentType: 'Terra',
        price: 100,
      }),
    ).toBe(true);

    expect(
      isEligibleForClosureSelection({
        _id: 'paid',
        numero: '13',
        tipo: 'retirada',
        orderId: 'ord-1',
        createdAt: '',
        paymentStatus: 'paga',
        contentType: 'Terra',
        price: 100,
      }),
    ).toBe(false);
  });
});
