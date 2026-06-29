import { describe, expect, it } from 'vitest';
import type { IOrder } from '../../interfaces';
import {
  buildSelectedOrders,
  getClosureOrderTotal,
  getWithdrawalOrderTotal,
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
  it('getWithdrawalOrderTotal soma apenas retiradas com preço válido', () => {
    const total = getWithdrawalOrderTotal({
      ...baseOrder,
      cacambas: [
        { _id: '1', numero: '1', tipo: 'retirada', orderId: 'ord-1', createdAt: '', price: 100 },
        { _id: '2', numero: '2', tipo: 'retirada', orderId: 'ord-1', createdAt: '', price: 50 },
        { _id: '3', numero: '3', tipo: 'entrega', orderId: 'ord-1', createdAt: '', price: 80 },
      ],
    });

    expect(total).toBe(150);
  });

  it('getClosureOrderTotal soma retiradas e entregas com preço válido', () => {
    const total = getClosureOrderTotal({
      ...baseOrder,
      cacambas: [
        { _id: '1', numero: '1', tipo: 'retirada', orderId: 'ord-1', createdAt: '', price: 100 },
        { _id: '2', numero: '2', tipo: 'entrega', orderId: 'ord-1', createdAt: '', price: 80 },
        { _id: '3', numero: '3', tipo: 'entrega', orderId: 'ord-1', createdAt: '' },
      ],
    });

    expect(total).toBe(180);
  });

  it('buildSelectedOrders inclui selecionadas válidas para retirada ou entrega em obra', () => {
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
              _id: 'entrega-ok',
              numero: '12',
              tipo: 'entrega',
              orderId: 'ord-1',
              createdAt: '',
              price: 80,
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
      ['ok', 'entrega-ok', 'sem-preco'],
    );

    expect(orders).toHaveLength(1);
    expect(orders[0].cacambas?.map((cacamba) => cacamba._id)).toEqual(['ok', 'entrega-ok']);
  });

  it('isEligibleForClosureSelection valida status, tipo, preço e conteúdo quando necessário', () => {
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
        _id: 'entrega-ok',
        numero: '14',
        tipo: 'entrega',
        orderId: 'ord-1',
        createdAt: '',
        paymentStatus: 'pendente',
        price: 100,
      }),
    ).toBe(true);

    expect(
      isEligibleForClosureSelection({
        _id: 'entrega-sem-preco',
        numero: '15',
        tipo: 'entrega',
        orderId: 'ord-1',
        createdAt: '',
        paymentStatus: 'pendente',
      }),
    ).toBe(false);

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
