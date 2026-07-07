import request from 'supertest';
import { loadApp, ensureUsers, signToken } from '../helpers/app';
import { ClientModel } from '../../src/models/Client';
import { CityModel } from '../../src/models/City';
import { OrderModel } from '../../src/models/Order';
import { UserModel } from '../../src/models/User';
import { CacambaModel } from '../../src/models/Cacamba';
import { ClosureGroupModel } from '../../src/models/ClosureGroup';

describe('Admin APIs', () => {
  let nextOrderNumber = 1000;
  it('CRUD de pedidos com validações principais', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Cliente A',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua 1',
      addressNumber: '10',
    });

    const missingClientId = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'entrega' });
    expect(missingClientId.status).toBe(400);

    const badType = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clientId: String(client._id), type: 'troca' });
    expect(badType.status).toBe(400);

    const deliveryWithoutPrice = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clientId: String(client._id), type: 'entrega' });
    expect(deliveryWithoutPrice.status).toBe(400);

    const baseOrderPayload = {
      clientId: String(client._id),
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      motorista: String(driver._id),
    };

    const create = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...baseOrderPayload,
        type: 'entrega',
        priority: 2,
        cacambaPrice: 180,
      });
    expect(create.status).toBe(201);
    expect(create.body.orderNumber).toBe(1);
    expect(create.body.cacambaPrice).toBe(180);

    const withdrawalCreate = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...baseOrderPayload,
        type: 'retirada',
      });
    expect(withdrawalCreate.status).toBe(201);
    expect(withdrawalCreate.body.cacambaPrice).toBeUndefined();

    const pricedWithdrawalCreate = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...baseOrderPayload,
        type: 'retirada',
        cacambaPrice: 250,
      });
    expect(pricedWithdrawalCreate.status).toBe(201);
    expect(pricedWithdrawalCreate.body.cacambaPrice).toBe(250);

    const list = await request(app).get('/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body[0].type).toBe('entrega');

    const patchBadType = await request(app)
      .patch(`/orders/${create.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'troca' });
    expect(patchBadType.status).toBe(400);

    const patch = await request(app)
      .patch(`/orders/${create.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'concluido' });
    expect(patch.status).toBe(200);
    expect(patch.body.status).toBe('concluido');

    const patch404 = await request(app)
      .patch(`/orders/${new UserModel()._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'pendente' });
    expect(patch404.status).toBe(404);

    const del = await request(app)
      .delete(`/orders/${create.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const del404 = await request(app)
      .delete(`/orders/${create.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del404.status).toBe(404);
  });

  it('GET /cacambas/track retorna histórico cronológico enriquecido para admin', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const driverToken = signToken(String(driver._id), 'motorista');
    const client = await ClientModel.create({
      clientName: 'Cliente Track',
      cnpjCpf: '12345678000199',
      contactName: 'Ana',
      contactNumber: '11999990000',
      neighborhood: 'Centro',
      address: 'Rua Track',
      addressNumber: '45',
      city: 'Sao Jose dos Campos',
      cep: '12200-000',
    });
    const deliveryOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      cnpjCpf: client.cnpjCpf,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      city: client.city,
      cep: client.cep,
      motorista: driver._id,
      placa: 'abc1234',
      type: 'entrega',
      status: 'concluido',
      priority: 0,
    });
    const withdrawalOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      cnpjCpf: client.cnpjCpf,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      city: client.city,
      cep: client.cep,
      motorista: driver._id,
      placa: 'def5678',
      type: 'retirada',
      status: 'concluido',
      priority: 0,
    });
    const withdrawal = await CacambaModel.create({
      numero: '777',
      tipo: 'retirada',
      orderId: withdrawalOrder._id,
      imageUrl: '/files/retirada',
      local: 'canteiro_obra',
      contentType: 'Entulho limpo',
      price: 210,
      horaServicoDigitos: '002',
      createdAt: new Date('2026-05-04T10:00:00.000Z'),
    });
    const delivery = await CacambaModel.create({
      numero: '777',
      tipo: 'entrega',
      orderId: deliveryOrder._id,
      imageUrl: '/files/entrega',
      local: 'via_publica',
      horaServicoDigitos: '001',
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
    });
    await OrderModel.findByIdAndUpdate(deliveryOrder._id, { $push: { cacambas: delivery._id } });
    await OrderModel.findByIdAndUpdate(withdrawalOrder._id, { $push: { cacambas: withdrawal._id } });

    const noToken = await request(app).get('/cacambas/track?numero=777');
    expect(noToken.status).toBe(401);

    const driverForbidden = await request(app)
      .get('/cacambas/track?numero=777')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverForbidden.status).toBe(403);

    const missingNumero = await request(app)
      .get('/cacambas/track')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missingNumero.status).toBe(400);

    const track = await request(app)
      .get('/cacambas/track?numero=777')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(track.status).toBe(200);
    expect(track.body).toMatchObject({
      numero: '777',
      total: 2,
      currentStatus: 'retirada',
      firstRegisteredAt: '2026-05-01T10:00:00.000Z',
      lastRegisteredAt: '2026-05-04T10:00:00.000Z',
    });
    expect(track.body.events.map((event: any) => event.tipo)).toEqual(['entrega', 'retirada']);
    expect(track.body.events[0]).toMatchObject({
      numero: '777',
      local: 'via_publica',
      horaServicoDigitos: '001',
      order: {
        clientName: 'Cliente Track',
        contactName: 'Ana',
        address: 'Rua Track',
        orderNumber: deliveryOrder.orderNumber,
        type: 'entrega',
        status: 'concluido',
        placa: 'abc1234',
        motorista: { username: 'driver-test' },
      },
    });
    expect(track.body.events[1]).toMatchObject({
      contentType: 'Entulho limpo',
      price: 210,
      order: { orderNumber: withdrawalOrder.orderNumber, type: 'retirada' },
    });

    const empty = await request(app)
      .get('/cacambas/track?numero=999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(empty.status).toBe(200);
    expect(empty.body).toMatchObject({
      numero: '999',
      total: 0,
      currentStatus: null,
      firstRegisteredAt: null,
      lastRegisteredAt: null,
      events: [],
    });
  });

  it('GET /cacambas/tracked-numbers retorna números distintos ordenados para admin', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const driverToken = signToken(String(driver._id), 'motorista');
    const orderId = new OrderModel()._id;
    const duplicateOrderId = new OrderModel()._id;

    await CacambaModel.create([
      {
        numero: '10',
        tipo: 'entrega',
        orderId,
        imageUrl: '/files/10',
        local: 'via_publica',
      },
      {
        numero: '2',
        tipo: 'entrega',
        orderId,
        imageUrl: '/files/2',
        local: 'via_publica',
      },
      {
        numero: '10',
        tipo: 'retirada',
        orderId: duplicateOrderId,
        imageUrl: '/files/10-retirada',
        local: 'canteiro_obra',
      },
      {
        numero: 'A1',
        tipo: 'entrega',
        orderId,
        imageUrl: '/files/a1',
        local: 'via_publica',
      },
    ]);

    const noToken = await request(app).get('/cacambas/tracked-numbers');
    expect(noToken.status).toBe(401);

    const driverForbidden = await request(app)
      .get('/cacambas/tracked-numbers')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(driverForbidden.status).toBe(403);

    const response = await request(app)
      .get('/cacambas/tracked-numbers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ numbers: ['2', '10', 'A1'] });
  });

  it('POST /orders valida caçambas planejadas para retirada', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Cliente Planejado',
      cnpjCpf: '11.111.111/0001-11',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua 1',
      addressNumber: '10',
      city: 'São José dos Campos',
      cep: '12200-000',
    });
    const otherClient = await ClientModel.create({
      clientName: 'Outro Cliente',
      contactName: 'Outro',
      contactNumber: '456',
      neighborhood: 'Centro',
      address: 'Rua 1',
      addressNumber: '10',
      city: 'São José dos Campos',
      cep: '12200-000',
    });

    const createDelivery = async (
      numero: string,
      targetClient: any = client,
      addressOverrides: Record<string, unknown> = {},
    ) => {
      const lastOrder = await OrderModel.findOne({ orderNumber: { $ne: null } })
        .sort({ orderNumber: -1 })
        .select('orderNumber')
        .lean();
      const deliveryOrder = await OrderModel.create({
        orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
        clientId: targetClient._id,
        clientName: targetClient.clientName,
        cnpjCpf: targetClient.cnpjCpf || '',
        contactName: targetClient.contactName,
        contactNumber: targetClient.contactNumber,
        neighborhood: addressOverrides.neighborhood ?? targetClient.neighborhood,
        address: addressOverrides.address ?? targetClient.address,
        addressNumber: addressOverrides.addressNumber ?? targetClient.addressNumber,
        city: addressOverrides.city ?? targetClient.city,
        cep: addressOverrides.cep ?? targetClient.cep,
        type: 'entrega',
        status: 'concluido',
        motorista: driver._id,
      });
      const cacamba = await CacambaModel.create({
        numero,
        tipo: 'entrega',
        orderId: deliveryOrder._id,
        local: 'canteiro_obra',
        horaServicoDigitos: numero,
        imageUrl: `/files/${new UserModel()._id}`,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
      });
      await OrderModel.findByIdAndUpdate(deliveryOrder._id, { $push: { cacambas: cacamba._id } });
      return { deliveryOrder, cacamba };
    };

    const valid = await createDelivery('101');
    const validCreate = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientId: String(client._id),
        clientName: client.clientName,
        cnpjCpf: client.cnpjCpf,
        contactName: client.contactName,
        contactNumber: client.contactNumber,
        neighborhood: client.neighborhood,
        address: client.address,
        addressNumber: client.addressNumber,
        city: client.city,
        cep: client.cep,
        type: 'retirada',
        motorista: String(driver._id),
        placa: 'ABC1D23',
        plannedWithdrawalCacambaIds: [String(valid.cacamba._id)],
      });
    expect(validCreate.status).toBe(201);
    expect(validCreate.body.plannedWithdrawalCacambaIds).toEqual([String(valid.cacamba._id)]);

    const planOnDelivery = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientId: String(client._id),
        clientName: client.clientName,
        type: 'entrega',
        cacambaPrice: 180,
        plannedWithdrawalCacambaIds: [String(valid.cacamba._id)],
      });
    expect(planOnDelivery.status).toBe(400);

    const alreadyWithdrawn = await createDelivery('102');
    await CacambaModel.create({
      numero: '102',
      tipo: 'retirada',
      orderId: validCreate.body._id,
      local: 'via_publica',
      horaServicoDigitos: '102',
      imageUrl: `/files/${new UserModel()._id}`,
      createdAt: new Date('2026-05-02T10:00:00.000Z'),
    });
    const withdrawnPlan = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientId: String(client._id),
        clientName: client.clientName,
        contactName: client.contactName,
        contactNumber: client.contactNumber,
        neighborhood: client.neighborhood,
        address: client.address,
        addressNumber: client.addressNumber,
        city: client.city,
        cep: client.cep,
        type: 'retirada',
        motorista: String(driver._id),
        plannedWithdrawalCacambaIds: [String(alreadyWithdrawn.cacamba._id)],
      });
    expect(withdrawnPlan.status).toBe(400);

    const otherClientDelivery = await createDelivery('103', otherClient);
    const otherClientPlan = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientId: String(client._id),
        clientName: client.clientName,
        contactName: client.contactName,
        contactNumber: client.contactNumber,
        neighborhood: client.neighborhood,
        address: client.address,
        addressNumber: client.addressNumber,
        city: client.city,
        cep: client.cep,
        type: 'retirada',
        motorista: String(driver._id),
        plannedWithdrawalCacambaIds: [String(otherClientDelivery.cacamba._id)],
      });
    expect(otherClientPlan.status).toBe(400);

    const otherAddressDelivery = await createDelivery('104', client, { address: 'Rua 2', addressNumber: '20' });
    const otherAddressPlan = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        clientId: String(client._id),
        clientName: client.clientName,
        contactName: client.contactName,
        contactNumber: client.contactNumber,
        neighborhood: client.neighborhood,
        address: client.address,
        addressNumber: client.addressNumber,
        city: client.city,
        cep: client.cep,
        type: 'retirada',
        motorista: String(driver._id),
        plannedWithdrawalCacambaIds: [String(otherAddressDelivery.cacamba._id)],
      });
    expect(otherAddressPlan.status).toBe(400);
  });

  it('GET /orders inclui a data da entrega anterior em caçambas de retirada', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Cliente Entrega Retirada',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua 1',
      addressNumber: '10',
    });

    const deliveryOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'entrega',
      status: 'concluido',
      motorista: driver._id,
      placa: 'ENT1A23',
    });
    const deliveryCacamba = await CacambaModel.create({
      numero: '801',
      tipo: 'entrega',
      imageUrl: '/files/507f1f77bcf86cd799439081',
      orderId: deliveryOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-10T10:00:00.000Z'),
      horaServicoDigitos: '801',
    });
    await OrderModel.findByIdAndUpdate(deliveryOrder._id, { $push: { cacambas: deliveryCacamba._id } });

    const withdrawalOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      motorista: driver._id,
      placa: 'RET1A23',
    });
    const withdrawalCacamba = await CacambaModel.create({
      numero: '801',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      price: 120,
      imageUrl: '/files/507f1f77bcf86cd799439082',
      orderId: withdrawalOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-15T10:00:00.000Z'),
      horaServicoDigitos: '802',
    });
    await OrderModel.findByIdAndUpdate(withdrawalOrder._id, { $push: { cacambas: withdrawalCacamba._id } });

    const res = await request(app).get('/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const order = res.body.find((item: any) => String(item._id) === String(withdrawalOrder._id));
    expect(order?.cacambas[0]?.closureDelivery).toMatchObject({
      date: '2026-05-10T10:00:00.000Z',
      driverName: driver.username,
      placa: 'ENT1A23',
      orderNumber: deliveryOrder.orderNumber,
    });
  });

  it('PATCH /orders/:id/correction corrige somente pedidos pendentes sem caçambas', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const otherDriver = await UserModel.create({
      username: `driver-correction-${Date.now()}`,
      password: '123',
      role: 'motorista',
    });
    const client = await ClientModel.create({
      clientName: 'Cliente Correcao',
      contactName: 'Contato',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua 1',
      addressNumber: '10',
    });

    const order = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'entrega',
      status: 'pendente',
      motorista: driver._id,
      cacambaPrice: 160,
    });

    const corrected = await request(app)
      .patch(`/orders/${order._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'retirada', motorista: String(otherDriver._id) });

    expect(corrected.status).toBe(200);
    expect(corrected.body.type).toBe('retirada');
    expect(corrected.body.cacambaPrice).toBeUndefined();
    expect(String(corrected.body.motorista._id)).toBe(String(otherDriver._id));

    const pricedWithdrawalCorrectionOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'entrega',
      status: 'pendente',
      motorista: driver._id,
      cacambaPrice: 160,
    });

    const pricedWithdrawalCorrection = await request(app)
      .patch(`/orders/${pricedWithdrawalCorrectionOrder._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'retirada', motorista: String(otherDriver._id), cacambaPrice: 180 });

    expect(pricedWithdrawalCorrection.status).toBe(200);
    expect(pricedWithdrawalCorrection.body.type).toBe('retirada');
    expect(pricedWithdrawalCorrection.body.cacambaPrice).toBe(180);

    const deliveryCorrectionOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'pendente',
      motorista: driver._id,
    });

    const correctionWithoutPrice = await request(app)
      .patch(`/orders/${deliveryCorrectionOrder._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'entrega', motorista: String(otherDriver._id) });
    expect(correctionWithoutPrice.status).toBe(400);

    const correctionWithPrice = await request(app)
      .patch(`/orders/${deliveryCorrectionOrder._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'entrega', motorista: String(otherDriver._id), cacambaPrice: 190 });
    expect(correctionWithPrice.status).toBe(200);
    expect(correctionWithPrice.body.type).toBe('entrega');
    expect(correctionWithPrice.body.cacambaPrice).toBe(190);

    const badType = await request(app)
      .patch(`/orders/${order._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'troca', motorista: String(otherDriver._id) });
    expect(badType.status).toBe(400);

    const completedOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'entrega',
      status: 'concluido',
      motorista: driver._id,
    });

    const completedCorrection = await request(app)
      .patch(`/orders/${completedOrder._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'retirada', motorista: String(otherDriver._id) });
    expect(completedCorrection.status).toBe(409);

    const orderWithCacamba = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'entrega',
      status: 'pendente',
      motorista: driver._id,
    });
    const cacamba = await CacambaModel.create({
      numero: '777',
      tipo: 'entrega',
      orderId: orderWithCacamba._id,
      local: 'canteiro_obra',
      horaServicoDigitos: '777',
      imageUrl: '/files/507f1f77bcf86cd799439077',
    });
    await OrderModel.findByIdAndUpdate(orderWithCacamba._id, { $push: { cacambas: cacamba._id } });

    const withCacambaCorrection = await request(app)
      .patch(`/orders/${orderWithCacamba._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'retirada', motorista: String(otherDriver._id) });
    expect(withCacambaCorrection.status).toBe(409);

    const invalidDriver = await request(app)
      .patch(`/orders/${orderWithCacamba._id}/correction`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'retirada', motorista: String(new UserModel()._id) });
    expect(invalidDriver.status).toBe(404);
  });

  it('PATCH /orders/:id/change-client transfere pedido, fechamento e faturamento para o novo cliente', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');

    const sourceClient = await ClientModel.create({
      clientName: 'Cliente Origem',
      cnpjCpf: '11.111.111/0001-11',
      contactName: 'Contato Origem',
      contactNumber: '1111',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      city: 'Jacarei',
      cep: '12345-000',
    });
    const targetClient = await ClientModel.create({
      clientName: 'Cliente Destino',
      cnpjCpf: '22.222.222/0001-22',
      contactName: 'Contato Destino',
      contactNumber: '2222',
      neighborhood: 'Bairro Novo',
      address: 'Rua B',
      addressNumber: '20',
      city: 'Sao Jose dos Campos',
      cep: '54321-000',
    });

    const orderToMove = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: sourceClient._id,
      clientName: sourceClient.clientName,
      cnpjCpf: sourceClient.cnpjCpf,
      contactName: sourceClient.contactName,
      contactNumber: sourceClient.contactNumber,
      neighborhood: sourceClient.neighborhood,
      address: sourceClient.address,
      addressNumber: sourceClient.addressNumber,
      city: sourceClient.city,
      cep: sourceClient.cep,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-18T10:00:00.000Z'),
      createdAt: new Date('2026-05-18T08:00:00.000Z'),
    });
    const otherSourceOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: sourceClient._id,
      clientName: sourceClient.clientName,
      cnpjCpf: sourceClient.cnpjCpf,
      contactName: sourceClient.contactName,
      contactNumber: sourceClient.contactNumber,
      neighborhood: sourceClient.neighborhood,
      address: sourceClient.address,
      addressNumber: sourceClient.addressNumber,
      city: sourceClient.city,
      cep: sourceClient.cep,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-18T10:30:00.000Z'),
      createdAt: new Date('2026-05-18T08:30:00.000Z'),
    });

    const paidOwnGroup = await ClosureGroupModel.create({
      clientId: sourceClient._id,
      clientSequenceNumber: 1,
      startDate: new Date('2026-05-15T00:00:00.000Z'),
      endDate: new Date('2026-05-19T23:59:59.999Z'),
      cacambaIds: [],
      status: 'paga',
      invoiceNumber: 'NF-ORIGEM-1',
      createdBy: admin._id,
    });
    const mixedInvoicePendingGroup = await ClosureGroupModel.create({
      clientId: sourceClient._id,
      clientSequenceNumber: 2,
      startDate: new Date('2026-05-15T00:00:00.000Z'),
      endDate: new Date('2026-05-19T23:59:59.999Z'),
      cacambaIds: [],
      status: 'nota_fiscal_pendente',
      invoiceNumber: 'NF-ORIGEM-2',
      createdBy: admin._id,
    });

    const paidCacamba = await CacambaModel.create({
      numero: '901',
      tipo: 'retirada',
      paymentStatus: 'paga',
      closureGroupId: paidOwnGroup._id,
      contentType: 'Entulho limpo',
      price: 350,
      imageUrl: '/files/507f1f77bcf86cd799439041',
      orderId: orderToMove._id,
      local: 'via_publica',
      horaServicoDigitos: '901',
    });
    const splitCacamba = await CacambaModel.create({
      numero: '902',
      tipo: 'retirada',
      paymentStatus: 'nota_fiscal_pendente',
      closureGroupId: mixedInvoicePendingGroup._id,
      contentType: 'Terra',
      price: 180,
      imageUrl: '/files/507f1f77bcf86cd799439042',
      orderId: orderToMove._id,
      local: 'via_publica',
      horaServicoDigitos: '902',
    });
    const otherCacamba = await CacambaModel.create({
      numero: '903',
      tipo: 'retirada',
      paymentStatus: 'nota_fiscal_pendente',
      closureGroupId: mixedInvoicePendingGroup._id,
      contentType: 'Terra',
      price: 90,
      imageUrl: '/files/507f1f77bcf86cd799439043',
      orderId: otherSourceOrder._id,
      local: 'via_publica',
      horaServicoDigitos: '903',
    });
    const pendingCacamba = await CacambaModel.create({
      numero: '904',
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 120,
      imageUrl: '/files/507f1f77bcf86cd799439044',
      orderId: orderToMove._id,
      local: 'via_publica',
      horaServicoDigitos: '904',
    });

    await OrderModel.findByIdAndUpdate(orderToMove._id, {
      $push: { cacambas: { $each: [paidCacamba._id, splitCacamba._id, pendingCacamba._id] } },
    });
    await OrderModel.findByIdAndUpdate(otherSourceOrder._id, {
      $push: { cacambas: otherCacamba._id },
    });
    await ClosureGroupModel.findByIdAndUpdate(paidOwnGroup._id, {
      $set: { cacambaIds: [paidCacamba._id] },
    });
    await ClosureGroupModel.findByIdAndUpdate(mixedInvoicePendingGroup._id, {
      $set: { cacambaIds: [splitCacamba._id, otherCacamba._id] },
    });

    const changeClient = await request(app)
      .patch(`/orders/${orderToMove._id}/change-client`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clientId: String(targetClient._id) });

    expect(changeClient.status).toBe(200);
    expect(changeClient.body.order?.clientName).toBe('Cliente Destino');
    expect(changeClient.body.order?.clientId).toBe(String(targetClient._id));
    expect(changeClient.body.migration).toEqual({
      migratedCacambas: 2,
      createdClosureGroups: 2,
      updatedClosureGroups: 1,
      deletedClosureGroups: 1,
    });

    const movedOrder = await OrderModel.findById(orderToMove._id).lean();
    expect(String(movedOrder?.clientId)).toBe(String(targetClient._id));
    expect(movedOrder?.contactName).toBe(targetClient.contactName);
    expect(movedOrder?.address).toBe(targetClient.address);

    const movedPaid = await CacambaModel.findById(paidCacamba._id).lean();
    const movedSplit = await CacambaModel.findById(splitCacamba._id).lean();
    const untouchedPending = await CacambaModel.findById(pendingCacamba._id).lean();
    const untouchedOther = await CacambaModel.findById(otherCacamba._id).lean();
    expect(String(untouchedPending?.closureGroupId || '')).toBe('');
    expect(String(movedPaid?.closureGroupId || '')).not.toBe(String(paidOwnGroup._id));
    expect(String(movedSplit?.closureGroupId || '')).not.toBe(String(mixedInvoicePendingGroup._id));
    expect(String(untouchedOther?.closureGroupId || '')).toBe(String(mixedInvoicePendingGroup._id));

    const sourcePaidGroupAfter = await ClosureGroupModel.findById(paidOwnGroup._id).lean();
    const sourceMixedGroupAfter = await ClosureGroupModel.findById(mixedInvoicePendingGroup._id).lean();
    expect(sourcePaidGroupAfter).toBeNull();
    expect(sourceMixedGroupAfter?.cacambaIds.map((id: any) => String(id))).toEqual([String(otherCacamba._id)]);

    const targetGroups = await ClosureGroupModel.find({
      $or: [{ clientId: targetClient._id }, { clientId: String(targetClient._id) }],
    })
      .sort({ clientSequenceNumber: 1 })
      .lean();
    expect(targetGroups).toHaveLength(2);
    expect(targetGroups[0]?.clientSequenceNumber).toBe(1);
    expect(targetGroups[0]?.invoiceNumber).toBe('NF-ORIGEM-1');
    expect(targetGroups[0]?.status).toBe('paga');
    expect(targetGroups[1]?.clientSequenceNumber).toBe(2);
    expect(targetGroups[1]?.invoiceNumber).toBe('NF-ORIGEM-2');
    expect(targetGroups[1]?.status).toBe('nota_fiscal_pendente');

    const paidSummary = await request(app)
      .get(`/billing/summary?startDate=2026-05-01&endDate=2026-05-31&granularity=monthly&clientId=${targetClient._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(paidSummary.status).toBe(200);
    expect(paidSummary.body.summary.totalRevenue).toBe(350);

    const sourceClosurePaid = await request(app)
      .get(`/clients/${sourceClient._id}/closure-groups?status=all`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(sourceClosurePaid.status).toBe(200);
    expect(sourceClosurePaid.body).toHaveLength(1);

    const targetClosureGroups = await request(app)
      .get(`/clients/${targetClient._id}/closure-groups?status=all`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(targetClosureGroups.status).toBe(200);
    expect(targetClosureGroups.body).toHaveLength(2);
  });

  it('PATCH /orders/:id/change-client move pedido sem fechamento agrupado para o novo cliente', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');

    const sourceClient = await ClientModel.create({
      clientName: 'Cliente Base',
      contactName: 'Contato Base',
      contactNumber: '1000',
      neighborhood: 'Centro',
      address: 'Rua 1',
      addressNumber: '10',
    });
    const targetClient = await ClientModel.create({
      clientName: 'Cliente Novo',
      contactName: 'Contato Novo',
      contactNumber: '2000',
      neighborhood: 'Jardim',
      address: 'Rua 2',
      addressNumber: '20',
      city: 'Caçapava',
      cep: '12222-000',
    });

    const order = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: sourceClient._id,
      clientName: sourceClient.clientName,
      contactName: sourceClient.contactName,
      contactNumber: sourceClient.contactNumber,
      neighborhood: sourceClient.neighborhood,
      address: sourceClient.address,
      addressNumber: sourceClient.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-18T11:00:00.000Z'),
      createdAt: new Date('2026-05-18T08:00:00.000Z'),
    });

    const pendingCacamba = await CacambaModel.create({
      numero: '950',
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 210,
      imageUrl: '/files/507f1f77bcf86cd799439045',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '950',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: pendingCacamba._id } });

    const response = await request(app)
      .patch(`/orders/${order._id}/change-client`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ clientId: String(targetClient._id) });

    expect(response.status).toBe(200);
    expect(response.body.migration).toEqual({
      migratedCacambas: 0,
      createdClosureGroups: 0,
      updatedClosureGroups: 0,
      deletedClosureGroups: 0,
    });

    const updatedOrder = await OrderModel.findById(order._id).lean();
    expect(updatedOrder?.clientName).toBe('Cliente Novo');
    expect(updatedOrder?.city).toBe('Caçapava');

    const closureClients = await request(app)
      .get('/clients?closure=true&startDate=2026-05-01&endDate=2026-05-31&paymentStatus=pending')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(closureClients.status).toBe(200);
    expect(closureClients.body.some((client: any) => String(client._id) === String(targetClient._id))).toBe(true);
    expect(closureClients.body.some((client: any) => String(client._id) === String(sourceClient._id))).toBe(false);
  });

  it('Clientes: filtros, ordenação por período, campos opcionais, patch e delete com bloqueio', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');

    const createClient = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientName: 'Cliente Documentos',
        contactName: 'Contato Docs',
        contactNumber: '999',
        neighborhood: 'Centro',
        address: 'Rua Docs',
        addressNumber: '9',
        email: 'cliente@example.com',
        rgInscricaoEstadual: '12.345.678-9',
      });
    expect(createClient.status).toBe(201);
    expect(createClient.body.email).toBe('cliente@example.com');
    expect(createClient.body.rgInscricaoEstadual).toBe('12.345.678-9');

    const c1 = await ClientModel.create({
      clientName: 'Alpha',
      contactName: 'A',
      contactNumber: '1',
      neighborhood: 'N1',
      address: 'R1',
      addressNumber: '1',
    });
    const c2 = await ClientModel.create({
      clientName: 'Beta',
      contactName: 'B',
      contactNumber: '2',
      neighborhood: 'N2',
      address: 'R2',
      addressNumber: '2',
    });

    const retiradaObjectOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: c1._id,
      clientName: c1.clientName,
      contactName: c1.contactName,
      contactNumber: c1.contactNumber,
      neighborhood: c1.neighborhood,
      address: c1.address,
      addressNumber: c1.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-10T10:00:00Z'),
      createdAt: new Date('2026-05-10T08:00:00Z'),
    });
    const retiradaStringOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: c2._id,
      clientName: c2.clientName,
      contactName: c2.contactName,
      contactNumber: c2.contactNumber,
      neighborhood: c2.neighborhood,
      address: c2.address,
      addressNumber: c2.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-12T10:00:00Z'),
      createdAt: new Date('2026-05-12T08:00:00Z'),
    });

    const all = await request(app).get('/clients').set('Authorization', `Bearer ${token}`);
    expect(all.status).toBe(200);
    expect(all.body[0].clientName).toBe('Alpha');

    const typeOnly = await request(app)
      .get('/clients?type=retirada')
      .set('Authorization', `Bearer ${token}`);
    expect(typeOnly.status).toBe(200);
    expect(typeOnly.body).toHaveLength(2);

    const filtered = await request(app)
      .get('/clients?startDate=2026-05-09&endDate=2026-05-13&type=retirada')
      .set('Authorization', `Bearer ${token}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body[0].clientName).toBe('Beta');

    const badPeriod = await request(app)
      .get('/clients?startDate=abc&endDate=2026-05-13')
      .set('Authorization', `Bearer ${token}`);
    expect(badPeriod.status).toBe(400);

    const patch = await request(app)
      .patch(`/clients/${c1._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'São Paulo', email: 'alpha@example.com', rgInscricaoEstadual: 'IE-ALPHA' });
    expect(patch.status).toBe(200);
    expect(patch.body.city).toBe('São Paulo');
    expect(patch.body.email).toBe('alpha@example.com');
    expect(patch.body.rgInscricaoEstadual).toBe('IE-ALPHA');

    const blockedDelete = await request(app)
      .delete(`/clients/${c1._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(blockedDelete.status).toBe(400);

    const c3 = await ClientModel.create({
      clientName: 'Livre',
      contactName: 'L',
      contactNumber: '3',
      neighborhood: 'N3',
      address: 'R3',
      addressNumber: '3',
    });
    const freeDelete = await request(app)
      .delete(`/clients/${c3._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(freeDelete.status).toBe(200);
  });

  it('Motoristas: CRUD e role filtering', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');

    const create = await request(app)
      .post('/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'novo-driver', password: '123' });
    expect(create.status).toBe(201);

    const duplicate = await request(app)
      .post('/drivers')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'novo-driver', password: '123' });
    expect(duplicate.status).toBe(409);

    const list = await request(app).get('/drivers').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.every((u: any) => u.role === 'motorista')).toBe(true);

    const driverId = create.body.driver.id;
    const patch = await request(app)
      .patch(`/drivers/${driverId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'driver-renomeado' });
    expect(patch.status).toBe(200);

    const del = await request(app)
      .delete(`/drivers/${driverId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
  });

  it('GET /clients/:id/orders aplica filtros combinados', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Filtro',
      contactName: 'Contato',
      contactNumber: '999',
      neighborhood: 'N',
      address: 'Rua',
      addressNumber: '10',
    });

    const order = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      createdAt: new Date('2026-05-15T12:00:00Z'),
    });
    const cacamba = await CacambaModel.create({
      numero: 'CAC-77',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '123',
    });
    const otherLocalCacamba = await CacambaModel.create({
      numero: 'OUT-88',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'canteiro_obra',
      horaServicoDigitos: '124',
    });
    await OrderModel.findByIdAndUpdate(order._id, {
      $push: { cacambas: { $each: [cacamba._id, otherLocalCacamba._id] } },
    });

    const nonMatchingOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      createdAt: new Date('2026-05-15T13:00:00Z'),
    });
    const nonMatchingCacamba = await CacambaModel.create({
      numero: 'OUT-99',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: nonMatchingOrder._id,
      local: 'via_publica',
      horaServicoDigitos: '125',
    });
    await OrderModel.findByIdAndUpdate(nonMatchingOrder._id, { $push: { cacambas: nonMatchingCacamba._id } });

    const wrongLocalOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      createdAt: new Date('2026-05-15T14:00:00Z'),
    });
    const wrongLocalCacamba = await CacambaModel.create({
      numero: 'CAC-77',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: wrongLocalOrder._id,
      local: 'canteiro_obra',
      horaServicoDigitos: '126',
    });
    await OrderModel.findByIdAndUpdate(wrongLocalOrder._id, { $push: { cacambas: wrongLocalCacamba._id } });

    const res = await request(app)
      .get(`/clients/${client._id}/orders?startDate=2026-05-14&endDate=2026-05-16&type=retirada&local=via_publica&status=concluido&q=CAC-77`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(String(order._id));
    expect(res.body[0].cacambas).toHaveLength(1);
    expect(res.body[0].cacambas[0].numero).toBe('CAC-77');
    expect(res.body[0].cacambas[0].local).toBe('via_publica');

    const byOrderNumber = await request(app)
      .get(`/clients/${client._id}/orders?type=retirada&status=concluido&q=${order.orderNumber}`)
      .set('Authorization', `Bearer ${token}`);

    expect(byOrderNumber.status).toBe(200);
    expect(byOrderNumber.body).toHaveLength(1);
    expect(byOrderNumber.body[0]._id).toBe(String(order._id));
  });

  it('role incorreto retorna 403 em rota admin', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const res = await request(app).get('/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('retorna 404 para patch/delete de pedido inexistente', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const missingId = String(new UserModel()._id);

    const patch404 = await request(app)
      .patch(`/orders/${missingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'pendente' });
    expect(patch404.status).toBe(404);

    const delete404 = await request(app)
      .delete(`/orders/${missingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delete404.status).toBe(404);
  });

  it('retorna 404 para patch/delete de recursos inexistentes (clientes e motoristas)', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const missingId = String(new UserModel()._id);

    const patchClient404 = await request(app)
      .patch(`/clients/${missingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'X' });
    expect(patchClient404.status).toBe(404);

    const deleteClient404 = await request(app)
      .delete(`/clients/${missingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteClient404.status).toBe(404);

    const patchDriver404 = await request(app)
      .patch(`/drivers/${missingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'nao-existe' });
    expect(patchDriver404.status).toBe(404);

    const deleteDriver404 = await request(app)
      .delete(`/drivers/${missingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteDriver404.status).toBe(404);
  });

  it('GET /clients/:id/orders retorna 400 para periodo invalido', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Periodo',
      contactName: 'Contato',
      contactNumber: '999',
      neighborhood: 'N',
      address: 'Rua',
      addressNumber: '1',
    });

    const invalidPeriod = await request(app)
      .get(`/clients/${client._id}/orders?startDate=invalid&endDate=2026-05-16`)
      .set('Authorization', `Bearer ${token}`);
    expect(invalidPeriod.status).toBe(400);
  });

  it('Fechamento: lista e modal retornam somente retirada concluída no período (com clientId legado string/ObjectId)', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');

    const onlyEntrega = await ClientModel.create({
      clientName: 'Somente Entrega',
      contactName: 'Contato E',
      contactNumber: '111',
      neighborhood: 'N1',
      address: 'R1',
      addressNumber: '1',
    });
    const hasRetiradaObjectId = await ClientModel.create({
      clientName: 'Retirada ObjectId',
      contactName: 'Contato O',
      contactNumber: '222',
      neighborhood: 'N2',
      address: 'R2',
      addressNumber: '2',
    });
    const hasRetiradaString = await ClientModel.create({
      clientName: 'Retirada String',
      contactName: 'Contato S',
      contactNumber: '333',
      neighborhood: 'N3',
      address: 'R3',
      addressNumber: '3',
    });
    const outOfRange = await ClientModel.create({
      clientName: 'Retirada Fora',
      contactName: 'Contato F',
      contactNumber: '444',
      neighborhood: 'N4',
      address: 'R4',
      addressNumber: '4',
    });

    await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: onlyEntrega._id,
      clientName: onlyEntrega.clientName,
      contactName: onlyEntrega.contactName,
      contactNumber: onlyEntrega.contactNumber,
      neighborhood: onlyEntrega.neighborhood,
      address: onlyEntrega.address,
      addressNumber: onlyEntrega.addressNumber,
      type: 'entrega',
      status: 'concluido',
      updatedAt: new Date('2026-05-16T12:00:00.000Z'),
      createdAt: new Date('2026-05-16T08:00:00.000Z'),
    });

    const retiradaObjectOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: hasRetiradaObjectId._id,
      clientName: hasRetiradaObjectId.clientName,
      contactName: hasRetiradaObjectId.contactName,
      contactNumber: hasRetiradaObjectId.contactNumber,
      neighborhood: hasRetiradaObjectId.neighborhood,
      address: hasRetiradaObjectId.address,
      addressNumber: hasRetiradaObjectId.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-17T10:30:00.000Z'),
      createdAt: new Date('2026-05-17T08:00:00.000Z'),
    });

    const retiradaStringOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: String(hasRetiradaString._id),
      clientName: hasRetiradaString.clientName,
      contactName: hasRetiradaString.contactName,
      contactNumber: hasRetiradaString.contactNumber,
      neighborhood: hasRetiradaString.neighborhood,
      address: hasRetiradaString.address,
      addressNumber: hasRetiradaString.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-18T18:45:00.000Z'),
      createdAt: new Date('2026-05-18T08:00:00.000Z'),
    });

    const retiradaOutOfRangeOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: outOfRange._id,
      clientName: outOfRange.clientName,
      contactName: outOfRange.contactName,
      contactNumber: outOfRange.contactNumber,
      neighborhood: outOfRange.neighborhood,
      address: outOfRange.address,
      addressNumber: outOfRange.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-25T10:00:00.000Z'),
      createdAt: new Date('2026-05-25T08:00:00.000Z'),
    });

    const cacambaObj = await CacambaModel.create({
      numero: '701',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      imageUrl: '/files/507f1f77bcf86cd799439021',
      orderId: retiradaObjectOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-17T10:30:00.000Z'),
      horaServicoDigitos: '701',
    });
    const cacambaStr = await CacambaModel.create({
      numero: '702',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      imageUrl: '/files/507f1f77bcf86cd799439022',
      orderId: retiradaStringOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-18T18:45:00.000Z'),
      horaServicoDigitos: '702',
    });
    const cacambaOut = await CacambaModel.create({
      numero: '703',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      imageUrl: '/files/507f1f77bcf86cd799439023',
      orderId: retiradaOutOfRangeOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-25T10:00:00.000Z'),
      horaServicoDigitos: '703',
    });
    await OrderModel.findByIdAndUpdate(retiradaObjectOrder._id, { $push: { cacambas: cacambaObj._id } });
    await OrderModel.findByIdAndUpdate(retiradaStringOrder._id, { $push: { cacambas: cacambaStr._id } });
    await OrderModel.findByIdAndUpdate(retiradaOutOfRangeOrder._id, { $push: { cacambas: cacambaOut._id } });

    const list = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&endDate=2026-05-19')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    const listNames = list.body.map((c: any) => c.clientName);
    expect(listNames).toContain('Retirada ObjectId');
    expect(listNames).toContain('Retirada String');
    expect(listNames).not.toContain('Somente Entrega');
    expect(listNames).not.toContain('Retirada Fora');
    const objectClient = list.body.find((c: any) => c.clientName === 'Retirada ObjectId');
    const stringClient = list.body.find((c: any) => c.clientName === 'Retirada String');
    expect(objectClient?.hasPendingClosureItems).toBe(true);
    expect(objectClient?.hasGeneratedClosureGroups).toBe(false);
    expect(objectClient?.hasPendingClosureMetadata).toBe(true);
    expect(objectClient?.pendingClosureMetadataCount).toBe(1);
    expect(stringClient?.hasPendingClosureItems).toBe(true);
    expect(stringClient?.hasGeneratedClosureGroups).toBe(false);
    expect(stringClient?.hasPendingClosureMetadata).toBe(true);
    expect(stringClient?.pendingClosureMetadataCount).toBe(1);

    const metadataPendingList = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&endDate=2026-05-19&paymentStatus=metadata_pending')
      .set('Authorization', `Bearer ${token}`);

    expect(metadataPendingList.status).toBe(200);
    const metadataPendingNames = metadataPendingList.body.map((c: any) => c.clientName);
    expect(metadataPendingNames).toContain('Retirada ObjectId');
    expect(metadataPendingNames).toContain('Retirada String');
    expect(metadataPendingNames).not.toContain('Somente Entrega');
    expect(metadataPendingNames).not.toContain('Retirada Fora');

    const modalObjectId = await request(app)
      .get(`/clients/${hasRetiradaObjectId._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19`)
      .set('Authorization', `Bearer ${token}`);
    expect(modalObjectId.status).toBe(200);
    expect(modalObjectId.body.length).toBeGreaterThan(0);
    expect(modalObjectId.body.every((o: any) => o.type === 'retirada' && o.status === 'concluido')).toBe(true);

    const modalString = await request(app)
      .get(`/clients/${hasRetiradaString._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19`)
      .set('Authorization', `Bearer ${token}`);
    expect(modalString.status).toBe(200);
    expect(modalString.body.length).toBeGreaterThan(0);
    expect(modalString.body.every((o: any) => o.type === 'retirada' && o.status === 'concluido')).toBe(true);

    const metadataPendingModal = await request(app)
      .get(
        `/clients/${hasRetiradaObjectId._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19&paymentStatus=metadata_pending`,
      )
      .set('Authorization', `Bearer ${token}`);
    expect(metadataPendingModal.status).toBe(200);
    expect(metadataPendingModal.body).toHaveLength(1);
    expect(metadataPendingModal.body[0]?.cacambas).toHaveLength(1);
    expect(metadataPendingModal.body[0]?.cacambas[0]?.numero).toBe('701');

    const modalEntregaOnly = await request(app)
      .get(`/clients/${onlyEntrega._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19`)
      .set('Authorization', `Bearer ${token}`);
    expect(modalEntregaOnly.status).toBe(200);
    expect(modalEntregaOnly.body).toHaveLength(0);
  });

  it('Fechamento: informações pendentes respeita data inicial pela data da caçamba', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Pendência por data',
      contactName: 'Contato',
      contactNumber: '999',
      neighborhood: 'N',
      address: 'Rua',
      addressNumber: '1',
    });
    const order = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      createdAt: new Date('2026-05-20T08:00:00.000Z'),
    });
    const oldCacamba = await CacambaModel.create({
      numero: '711',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      imageUrl: '/files/507f1f77bcf86cd799439071',
      orderId: order._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-14T12:00:00.000Z'),
      horaServicoDigitos: '711',
    });
    const inRangeCacamba = await CacambaModel.create({
      numero: '712',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      imageUrl: '/files/507f1f77bcf86cd799439072',
      orderId: order._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-16T12:00:00.000Z'),
      horaServicoDigitos: '712',
    });
    await OrderModel.findByIdAndUpdate(order._id, {
      $push: { cacambas: { $each: [oldCacamba._id, inRangeCacamba._id] } },
    });

    const clients = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&paymentStatus=metadata_pending')
      .set('Authorization', `Bearer ${token}`);
    expect(clients.status).toBe(200);
    const listedClient = clients.body.find((item: any) => String(item._id) === String(client._id));
    expect(listedClient?.pendingClosureMetadataCount).toBe(1);

    const modal = await request(app)
      .get(`/clients/${client._id}/orders?closure=true&startDate=2026-05-15&paymentStatus=metadata_pending`)
      .set('Authorization', `Bearer ${token}`);
    expect(modal.status).toBe(200);
    expect(modal.body).toHaveLength(1);
    expect(modal.body[0]?.cacambas.map((cacamba: any) => cacamba.numero)).toEqual(['712']);
  });

  it('Fechamento: inclui entrega ainda em obra no período e evita cobrança duplicada na retirada futura', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');

    const openClient = await ClientModel.create({
      clientName: 'Entrega Aberta',
      contactName: 'Contato A',
      contactNumber: '111',
      neighborhood: 'N1',
      address: 'Rua A',
      addressNumber: '1',
    });
    const missingPriceClient = await ClientModel.create({
      clientName: 'Entrega Sem Valor',
      contactName: 'Contato S',
      contactNumber: '222',
      neighborhood: 'N2',
      address: 'Rua S',
      addressNumber: '2',
    });
    const outOfRangeClient = await ClientModel.create({
      clientName: 'Entrega Fora Periodo',
      contactName: 'Contato F',
      contactNumber: '333',
      neighborhood: 'N3',
      address: 'Rua F',
      addressNumber: '3',
    });
    const withdrawnClient = await ClientModel.create({
      clientName: 'Entrega Ja Retirada',
      contactName: 'Contato R',
      contactNumber: '444',
      neighborhood: 'N4',
      address: 'Rua R',
      addressNumber: '4',
    });

    const createDelivery = async (
      client: any,
      numero: string,
      updatedAt: string,
      price?: number,
    ) => {
      const order = await OrderModel.create({
        orderNumber: nextOrderNumber++,
        clientId: client._id,
        clientName: client.clientName,
        contactName: client.contactName,
        contactNumber: client.contactNumber,
        neighborhood: client.neighborhood,
        address: client.address,
        addressNumber: client.addressNumber,
        type: 'entrega',
        status: 'concluido',
        motorista: driver._id,
        placa: 'ENT1A23',
        updatedAt: new Date(updatedAt),
        createdAt: new Date(updatedAt),
      });
      const cacamba = await CacambaModel.create({
        numero,
        tipo: 'entrega',
        paymentStatus: 'pendente',
        ...(typeof price === 'number' ? { price } : {}),
        imageUrl: `/files/507f1f77bcf86cd799439${numero}`,
        orderId: order._id,
        local: 'canteiro_obra',
        createdAt: new Date(updatedAt),
        horaServicoDigitos: numero,
      });
      await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: cacamba._id } });
      return { order, cacamba };
    };

    const openDelivery = await createDelivery(openClient, '731', '2026-05-16T10:00:00.000Z', 90);
    await createDelivery(missingPriceClient, '732', '2026-05-16T11:00:00.000Z');
    await createDelivery(outOfRangeClient, '733', '2026-05-23T10:00:00.000Z', 100);
    const withdrawnDelivery = await createDelivery(withdrawnClient, '734', '2026-05-16T12:00:00.000Z', 110);
    const alreadyWithdrawnOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: withdrawnClient._id,
      clientName: withdrawnClient.clientName,
      contactName: withdrawnClient.contactName,
      contactNumber: withdrawnClient.contactNumber,
      neighborhood: withdrawnClient.neighborhood,
      address: withdrawnClient.address,
      addressNumber: withdrawnClient.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-25T10:00:00.000Z'),
      createdAt: new Date('2026-05-25T09:00:00.000Z'),
    });
    const alreadyWithdrawnCacamba = await CacambaModel.create({
      numero: withdrawnDelivery.cacamba.numero,
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 110,
      imageUrl: '/files/507f1f77bcf86cd799439734',
      orderId: alreadyWithdrawnOrder._id,
      local: 'canteiro_obra',
      createdAt: new Date('2026-05-25T10:00:00.000Z'),
      horaServicoDigitos: '734',
    });
    await OrderModel.findByIdAndUpdate(alreadyWithdrawnOrder._id, {
      $push: { cacambas: alreadyWithdrawnCacamba._id },
    });

    const list = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&endDate=2026-05-19')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    const names = list.body.map((client: any) => client.clientName);
    expect(names).toContain('Entrega Aberta');
    expect(names).toContain('Entrega Sem Valor');
    expect(names).not.toContain('Entrega Fora Periodo');
    expect(names).not.toContain('Entrega Ja Retirada');
    const openListed = list.body.find((client: any) => String(client._id) === String(openClient._id));
    expect(openListed?.hasPendingClosureItems).toBe(true);
    expect(openListed?.hasPendingClosureMetadata).toBe(false);
    const missingListed = list.body.find((client: any) => String(client._id) === String(missingPriceClient._id));
    expect(missingListed?.hasPendingClosureMetadata).toBe(true);
    expect(missingListed?.pendingClosureMissingPriceCount).toBe(1);
    expect(missingListed?.pendingClosureMissingContentTypeCount).toBe(0);

    const metadataPendingList = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&endDate=2026-05-19&paymentStatus=metadata_pending')
      .set('Authorization', `Bearer ${token}`);
    expect(metadataPendingList.status).toBe(200);
    const metadataNames = metadataPendingList.body.map((client: any) => client.clientName);
    expect(metadataNames).toContain('Entrega Sem Valor');
    expect(metadataNames).not.toContain('Entrega Aberta');

    const modal = await request(app)
      .get(`/clients/${openClient._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19`)
      .set('Authorization', `Bearer ${token}`);
    expect(modal.status).toBe(200);
    expect(modal.body).toHaveLength(1);
    expect(modal.body[0]?.type).toBe('entrega');
    expect(modal.body[0]?.cacambas[0]).toMatchObject({
      numero: '731',
      tipo: 'entrega',
      price: 90,
    });
    expect(modal.body[0]?.cacambas[0]?.closureDelivery).toMatchObject({
      orderNumber: openDelivery.order.orderNumber,
      placa: 'ENT1A23',
      driverName: driver.username,
    });

    const closeDelivery = await request(app)
      .post('/closures/download')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: String(openClient._id),
        startDate: '2026-05-15',
        endDate: '2026-05-19',
        selectedCacambaIds: [String(openDelivery.cacamba._id)],
      });
    expect(closeDelivery.status).toBe(200);
    expect(closeDelivery.body.closureGroup?.totalAmount).toBe(90);

    const openDeliveryAfterClose = await CacambaModel.findById(openDelivery.cacamba._id).lean();
    expect(openDeliveryAfterClose?.paymentStatus).toBe('nota_fiscal_pendente');
    expect(String(openDeliveryAfterClose?.closureGroupId || '')).toBe(closeDelivery.body.closureGroup._id);

    const groups = await request(app)
      .get(`/clients/${openClient._id}/closure-groups?status=all`)
      .set('Authorization', `Bearer ${token}`);
    expect(groups.status).toBe(200);
    expect(groups.body[0]?.cacambaIds[0]?.tipo).toBe('entrega');
    expect(groups.body[0]?.cacambaIds[0]?.closureDelivery).toMatchObject({
      orderNumber: openDelivery.order.orderNumber,
      placa: 'ENT1A23',
    });
    expect(groups.body[0]?.cacambaIds[0]?.closureWithdrawal).toBeNull();

    const futureWithdrawalOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: openClient._id,
      clientName: openClient.clientName,
      contactName: openClient.contactName,
      contactNumber: openClient.contactNumber,
      neighborhood: openClient.neighborhood,
      address: openClient.address,
      addressNumber: openClient.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-20T10:00:00.000Z'),
      createdAt: new Date('2026-05-20T09:00:00.000Z'),
    });
    const futureWithdrawalCacamba = await CacambaModel.create({
      numero: openDelivery.cacamba.numero,
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 90,
      imageUrl: '/files/507f1f77bcf86cd799439731',
      orderId: futureWithdrawalOrder._id,
      local: 'canteiro_obra',
      createdAt: new Date('2026-05-20T10:00:00.000Z'),
      horaServicoDigitos: '731',
    });
    await OrderModel.findByIdAndUpdate(futureWithdrawalOrder._id, {
      $push: { cacambas: futureWithdrawalCacamba._id },
    });

    const duplicatePending = await request(app)
      .get('/clients?closure=true&startDate=2026-05-20&endDate=2026-05-21&paymentStatus=pending')
      .set('Authorization', `Bearer ${token}`);
    expect(duplicatePending.status).toBe(200);
    expect(duplicatePending.body.some((client: any) => String(client._id) === String(openClient._id))).toBe(false);
  });

  it('inclui metadados de entrega e retirada nos dados de fechamento', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Cliente Metadata PDF',
      contactName: 'Contato',
      contactNumber: '999',
      neighborhood: 'N',
      address: 'Rua',
      addressNumber: '1',
    });
    const deliveryOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'entrega',
      status: 'concluido',
      motorista: driver._id,
      placa: 'ENT1A23',
      updatedAt: new Date('2026-05-10T10:00:00.000Z'),
    });
    const deliveryCacamba = await CacambaModel.create({
      numero: '801',
      tipo: 'entrega',
      imageUrl: '/files/507f1f77bcf86cd799439081',
      orderId: deliveryOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-10T10:00:00.000Z'),
      horaServicoDigitos: '801',
    });
    await OrderModel.findByIdAndUpdate(deliveryOrder._id, { $push: { cacambas: deliveryCacamba._id } });

    const withdrawalOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      motorista: driver._id,
      placa: 'RET1A23',
      updatedAt: new Date('2026-05-15T10:00:00.000Z'),
    });
    const withdrawalCacamba = await CacambaModel.create({
      numero: '801',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      price: 120,
      imageUrl: '/files/507f1f77bcf86cd799439082',
      orderId: withdrawalOrder._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-15T10:00:00.000Z'),
      horaServicoDigitos: '802',
    });
    await OrderModel.findByIdAndUpdate(withdrawalOrder._id, { $push: { cacambas: withdrawalCacamba._id } });

    const modal = await request(app)
      .get(`/clients/${client._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19`)
      .set('Authorization', `Bearer ${token}`);
    expect(modal.status).toBe(200);
    expect(modal.body[0]?.cacambas[0]?.closureDelivery).toMatchObject({
      driverName: driver.username,
      placa: 'ENT1A23',
      orderNumber: deliveryOrder.orderNumber,
    });
    expect(modal.body[0]?.cacambas[0]?.closureWithdrawal).toMatchObject({
      driverName: driver.username,
      placa: 'RET1A23',
      orderNumber: withdrawalOrder.orderNumber,
    });

    const close = await request(app)
      .post('/closures/download')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: String(client._id),
        startDate: '2026-05-15',
        endDate: '2026-05-19',
        selectedCacambaIds: [String(withdrawalCacamba._id)],
      });
    expect(close.status).toBe(200);

    const groups = await request(app)
      .get(`/clients/${client._id}/closure-groups?status=all`)
      .set('Authorization', `Bearer ${token}`);
    expect(groups.status).toBe(200);
    expect(groups.body[0]?.cacambaIds[0]?.closureDelivery).toMatchObject({
      driverName: driver.username,
      placa: 'ENT1A23',
    });
    expect(groups.body[0]?.cacambaIds[0]?.closureWithdrawal).toMatchObject({
      driverName: driver.username,
      placa: 'RET1A23',
    });
  });
  it('POST /closures/download cria grupo e marca selecionadas como nota_fiscal_pendente; PATCH invoice finaliza como paga', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Cliente Fechamento',
      contactName: 'Contato',
      contactNumber: '999',
      neighborhood: 'N',
      address: 'Rua',
      addressNumber: '1',
    });
    const order = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-18T10:00:00.000Z'),
      createdAt: new Date('2026-05-18T08:00:00.000Z'),
    });
    const c1 = await CacambaModel.create({
      numero: '910',
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 120,
      imageUrl: '/files/507f1f77bcf86cd799439031',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '910',
    });
    const c2 = await CacambaModel.create({
      numero: '911',
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 80,
      imageUrl: '/files/507f1f77bcf86cd799439032',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '911',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: { $each: [c1._id, c2._id] } } });

    const ok = await request(app)
      .post('/closures/download')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: String(client._id),
        startDate: '2026-05-15',
        endDate: '2026-05-19',
        selectedCacambaIds: [String(c1._id)],
      });
    expect(ok.status).toBe(200);
    expect(ok.body.closureGroup?._id).toBeTruthy();
    expect(ok.body.closureGroup?.clientSequenceNumber).toBe(1);

    const c1After = await CacambaModel.findById(c1._id).lean();
    const c2After = await CacambaModel.findById(c2._id).lean();
    expect(c1After?.paymentStatus).toBe('nota_fiscal_pendente');
    expect(c2After?.paymentStatus).toBe('pendente');

    const invoicePendingClients = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&endDate=2026-05-19&paymentStatus=invoice_pending')
      .set('Authorization', `Bearer ${token}`);
    expect(invoicePendingClients.status).toBe(200);
    expect(invoicePendingClients.body.some((c: any) => String(c._id) === String(client._id))).toBe(true);
    const invoicePendingClient = invoicePendingClients.body.find((c: any) => String(c._id) === String(client._id));
    expect(invoicePendingClient?.hasPendingClosureItems).toBe(true);
    expect(invoicePendingClient?.hasGeneratedClosureGroups).toBe(true);

    const saveInvoice = await request(app)
      .patch(`/closure-groups/${ok.body.closureGroup._id}/invoice`)
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'NF-12345' });
    expect(saveInvoice.status).toBe(200);
    expect(saveInvoice.body.closureGroup?.clientSequenceNumber).toBe(1);

    const c1Paid = await CacambaModel.findById(c1._id).lean();
    expect(c1Paid?.paymentStatus).toBe('paga');

    const editPaidInvoice = await request(app)
      .patch(`/closure-groups/${ok.body.closureGroup._id}/invoice`)
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'NF-12345-EDIT' });
    expect(editPaidInvoice.status).toBe(200);
    expect(editPaidInvoice.body.closureGroup?.status).toBe('paga');
    expect(editPaidInvoice.body.closureGroup?.invoiceNumber).toBe('NF-12345-EDIT');

    const c1PaidAfterEdit = await CacambaModel.findById(c1._id).lean();
    expect(c1PaidAfterEdit?.paymentStatus).toBe('paga');

    const paidClients = await request(app)
      .get('/clients?closure=true&startDate=2026-05-15&endDate=2026-05-19&paymentStatus=paid')
      .set('Authorization', `Bearer ${token}`);
    expect(paidClients.status).toBe(200);
    expect(paidClients.body.some((c: any) => String(c._id) === String(client._id))).toBe(true);
    const paidClient = paidClients.body.find((c: any) => String(c._id) === String(client._id));
    expect(paidClient?.hasPendingClosureItems).toBe(true);
    expect(paidClient?.hasGeneratedClosureGroups).toBe(true);

    const secondGroup = await request(app)
      .post('/closures/download')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: String(client._id),
        startDate: '2026-05-15',
        endDate: '2026-05-19',
        selectedCacambaIds: [String(c2._id)],
      });
    expect(secondGroup.status).toBe(200);
    expect(secondGroup.body.closureGroup?.clientSequenceNumber).toBe(2);

    const duplicatedInvoice = await request(app)
      .patch(`/closure-groups/${secondGroup.body.closureGroup._id}/invoice`)
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceNumber: 'nf-12345-edit' });
    expect(duplicatedInvoice.status).toBe(409);
    expect(duplicatedInvoice.body.message).toContain('já utilizado');

    const allWithoutDate = await request(app)
      .get('/clients?closure=true&paymentStatus=all')
      .set('Authorization', `Bearer ${token}`);
    expect(allWithoutDate.status).toBe(200);
    const allClient = allWithoutDate.body.find((c: any) => String(c._id) === String(client._id));
    expect(allClient?.hasPendingClosureItems).toBe(false);
    expect(allClient?.hasGeneratedClosureGroups).toBe(true);

    const groupsWithoutDate = await request(app)
      .get(`/clients/${client._id}/closure-groups?status=all`)
      .set('Authorization', `Bearer ${token}`);
    expect(groupsWithoutDate.status).toBe(200);
    expect(groupsWithoutDate.body[0]?.clientSequenceNumber).toBeDefined();

    const pixCacamba = await CacambaModel.create({
      numero: '902',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      paymentStatus: 'pendente',
      price: 75,
      imageUrl: '/files/507f1f77bcf86cd799439902',
      orderId: order._id,
      local: 'via_publica',
      createdAt: new Date('2026-05-17T10:00:00.000Z'),
      horaServicoDigitos: '902',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: pixCacamba._id } });

    const pixClose = await request(app)
      .post('/closures/download')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: String(client._id),
        startDate: '2026-05-15',
        endDate: '2026-05-19',
        selectedCacambaIds: [String(pixCacamba._id)],
        paymentMethod: 'pix',
      });
    expect(pixClose.status).toBe(200);

    const savePixInfo = await request(app)
      .patch(`/closure-groups/${pixClose.body.closureGroup._id}/pix-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pixInfo: 'Pix recebido via banco em 17/05' });
    expect(savePixInfo.status).toBe(200);
    expect(savePixInfo.body.closureGroup?.pixInfo).toBe('Pix recebido via banco em 17/05');

    const groupsWithPixInfo = await request(app)
      .get(`/clients/${client._id}/closure-groups?status=all`)
      .set('Authorization', `Bearer ${token}`);
    const pixGroup = groupsWithPixInfo.body.find((group: any) => String(group._id) === String(pixClose.body.closureGroup._id));
    expect(pixGroup?.pixInfo).toBe('Pix recebido via banco em 17/05');
  });

  it('PATCH /closure-groups/:groupId/cacambas/:cacambaId/reopen volta caçamba para pendente e remove grupo vazio', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');
    const client = await ClientModel.create({
      clientName: 'Cliente Reabrir',
      contactName: 'Contato',
      contactNumber: '999',
      neighborhood: 'N',
      address: 'Rua',
      addressNumber: '1',
    });
    const order = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-18T10:00:00.000Z'),
      createdAt: new Date('2026-05-18T08:00:00.000Z'),
    });
    const c1 = await CacambaModel.create({
      numero: '920',
      tipo: 'retirada',
      paymentStatus: 'paga',
      closureGroupId: undefined,
      contentType: 'Entulho limpo',
      price: 120,
      imageUrl: '/files/507f1f77bcf86cd799439041',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '920',
    });
    const c2 = await CacambaModel.create({
      numero: '921',
      tipo: 'retirada',
      paymentStatus: 'paga',
      closureGroupId: undefined,
      contentType: 'Entulho limpo',
      price: 80,
      imageUrl: '/files/507f1f77bcf86cd799439042',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '921',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: { $each: [c1._id, c2._id] } } });

    const group = await ClosureGroupModel.create({
      clientId: client._id,
      clientSequenceNumber: 1,
      startDate: new Date('2026-05-15T00:00:00.000Z'),
      endDate: new Date('2026-05-19T23:59:59.999Z'),
      cacambaIds: [c1._id, c2._id],
      status: 'paga',
      invoiceNumber: 'NF-REABRIR',
      createdBy: admin._id,
    });
    await CacambaModel.updateMany({ _id: { $in: [c1._id, c2._id] } }, { $set: { closureGroupId: group._id } });

    const removeOne = await request(app)
      .patch(`/closure-groups/${group._id}/cacambas/${c1._id}/reopen`)
      .set('Authorization', `Bearer ${token}`);
    expect(removeOne.status).toBe(200);
    expect(removeOne.body.deletedGroup).toBe(false);

    const c1After = await CacambaModel.findById(c1._id).lean();
    const groupAfterOne = await ClosureGroupModel.findById(group._id).lean();
    expect(c1After?.paymentStatus).toBe('pendente');
    expect(c1After?.closureGroupId).toBeUndefined();
    expect(groupAfterOne?.cacambaIds.map(String)).toEqual([String(c2._id)]);

    const invalid = await request(app)
      .patch(`/closure-groups/${group._id}/cacambas/${c1._id}/reopen`)
      .set('Authorization', `Bearer ${token}`);
    expect(invalid.status).toBe(400);

    const removeLast = await request(app)
      .patch(`/closure-groups/${group._id}/cacambas/${c2._id}/reopen`)
      .set('Authorization', `Bearer ${token}`);
    expect(removeLast.status).toBe(200);
    expect(removeLast.body.deletedGroup).toBe(true);

    const c2After = await CacambaModel.findById(c2._id).lean();
    const groupAfterLast = await ClosureGroupModel.findById(group._id).lean();
    expect(c2After?.paymentStatus).toBe('pendente');
    expect(c2After?.closureGroupId).toBeUndefined();
    expect(groupAfterLast).toBeNull();
  });

  it('Cities: create, reject duplicates, enforce admin-only create, and list', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const driverToken = signToken(String(driver._id), 'motorista');

    const created = await request(app)
      .post('/cities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cidade de Teste' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Cidade de Teste');

    const duplicate = await request(app)
      .post('/cities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Cidade de Teste' });
    expect(duplicate.status).toBe(409);

    const forbidden = await request(app)
      .post('/cities')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ name: 'Jacarei' });
    expect(forbidden.status).toBe(403);

    await CityModel.create({ name: 'Caçapava', normalizedName: 'cacapava', active: true });

    const listed = await request(app)
      .get('/cities')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body.some((city: any) => city.name === 'Cidade de Teste')).toBe(true);

    const deleteForbidden = await request(app)
      .delete(`/cities/${created.body._id}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(deleteForbidden.status).toBe(403);

    const deleted = await request(app)
      .delete(`/cities/${created.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);

    const listedAfterDelete = await request(app)
      .get('/cities')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listedAfterDelete.status).toBe(200);
    expect(listedAfterDelete.body.some((city: any) => city.name === 'Cidade de Teste')).toBe(false);
  });

  it('GET /billing/summary agrega faturamento, respeita filtros e compara com período anterior', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');

    const clientA = await ClientModel.create({
      clientName: 'Cliente Faturamento A',
      contactName: 'Contato A',
      contactNumber: '111',
      neighborhood: 'Centro',
      address: 'Rua A',
      addressNumber: '10',
      city: 'Jacarei',
    });
    const clientB = await ClientModel.create({
      clientName: 'Cliente Faturamento B',
      contactName: 'Contato B',
      contactNumber: '222',
      neighborhood: 'Centro',
      address: 'Rua B',
      addressNumber: '20',
      city: 'Sao Jose dos Campos',
    });

    const currentOrderA = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: clientA._id,
      clientName: clientA.clientName,
      city: 'Jacareí',
      contactName: clientA.contactName,
      contactNumber: clientA.contactNumber,
      neighborhood: clientA.neighborhood,
      address: clientA.address,
      addressNumber: clientA.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-10T12:00:00.000Z'),
      createdAt: new Date('2026-05-10T08:00:00.000Z'),
    });
    const currentOrderB = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: clientB._id,
      clientName: clientB.clientName,
      city: 'Sao Jose dos Campos',
      contactName: clientB.contactName,
      contactNumber: clientB.contactNumber,
      neighborhood: clientB.neighborhood,
      address: clientB.address,
      addressNumber: clientB.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-05-20T12:00:00.000Z'),
      createdAt: new Date('2026-05-20T08:00:00.000Z'),
    });
    const previousOrder = await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: clientA._id,
      clientName: clientA.clientName,
      city: 'Jacareí',
      contactName: clientA.contactName,
      contactNumber: clientA.contactNumber,
      neighborhood: clientA.neighborhood,
      address: clientA.address,
      addressNumber: clientA.addressNumber,
      type: 'retirada',
      status: 'concluido',
      updatedAt: new Date('2026-04-10T12:00:00.000Z'),
      createdAt: new Date('2026-04-10T08:00:00.000Z'),
    });
    await OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: clientA._id,
      clientName: clientA.clientName,
      city: 'Jacareí',
      contactName: clientA.contactName,
      contactNumber: clientA.contactNumber,
      neighborhood: clientA.neighborhood,
      address: clientA.address,
      addressNumber: clientA.addressNumber,
      type: 'entrega',
      status: 'concluido',
      updatedAt: new Date('2026-05-22T12:00:00.000Z'),
      createdAt: new Date('2026-05-22T08:00:00.000Z'),
    });

    const currentPaid = await CacambaModel.create({
      numero: '801',
      tipo: 'retirada',
      paymentStatus: 'paga',
      contentType: 'Terra',
      price: 200,
      imageUrl: '/files/507f1f77bcf86cd799439081',
      orderId: currentOrderA._id,
      local: 'via_publica',
      horaServicoDigitos: '801',
    });
    const currentInvoicePending = await CacambaModel.create({
      numero: '802',
      tipo: 'retirada',
      paymentStatus: 'nota_fiscal_pendente',
      contentType: 'Terra',
      price: 180,
      imageUrl: '/files/507f1f77bcf86cd799439082',
      orderId: currentOrderA._id,
      local: 'via_publica',
      horaServicoDigitos: '802',
    });
    const currentPending = await CacambaModel.create({
      numero: '803',
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      price: 300,
      imageUrl: '/files/507f1f77bcf86cd799439083',
      orderId: currentOrderB._id,
      local: 'via_publica',
      horaServicoDigitos: '803',
    });
    const ignoredWithoutPrice = await CacambaModel.create({
      numero: '804',
      tipo: 'retirada',
      paymentStatus: 'pendente',
      contentType: 'Entulho limpo',
      imageUrl: '/files/507f1f77bcf86cd799439084',
      orderId: currentOrderB._id,
      local: 'via_publica',
      horaServicoDigitos: '804',
    });
    const previousPaid = await CacambaModel.create({
      numero: '805',
      tipo: 'retirada',
      paymentStatus: 'paga',
      contentType: 'Terra',
      price: 100,
      imageUrl: '/files/507f1f77bcf86cd799439085',
      orderId: previousOrder._id,
      local: 'via_publica',
      horaServicoDigitos: '805',
    });

    await OrderModel.findByIdAndUpdate(currentOrderA._id, {
      $push: { cacambas: { $each: [currentPaid._id, currentInvoicePending._id] } },
    });
    await OrderModel.findByIdAndUpdate(currentOrderB._id, {
      $push: { cacambas: { $each: [currentPending._id, ignoredWithoutPrice._id] } },
    });
    await OrderModel.findByIdAndUpdate(previousOrder._id, {
      $push: { cacambas: previousPaid._id },
    });

    const summary = await request(app)
      .get('/billing/summary?startDate=2026-05-01&endDate=2026-05-31&granularity=monthly')
      .set('Authorization', `Bearer ${token}`);

    expect(summary.status).toBe(200);
    expect(summary.body.summary.totalRevenue).toBe(200);
    expect(summary.body.summary.totalCacambas).toBe(1);
    expect(summary.body.summary.averageTicket).toBe(200);
    expect(summary.body.summary.activeClients).toBe(1);
    expect(summary.body.summary.previousPeriodRevenue).toBe(100);
    expect(summary.body.summary.revenueDeltaPercent).toBe(100);
    expect(summary.body.topClients[0].clientName).toBe('Cliente Faturamento A');
    expect(summary.body.topCities[0].city).toBe('Jacareí');
    expect(summary.body.topContentTypes[0].contentType).toBe('Terra');
    expect(summary.body.highlights.topClientName).toBe('Cliente Faturamento A');
    expect(summary.body.highlights.bestBucketLabel).toContain('2026');

    const paidOnly = await request(app)
      .get('/billing/summary?startDate=2026-05-01&endDate=2026-05-31&granularity=monthly')
      .set('Authorization', `Bearer ${token}`);
    expect(paidOnly.status).toBe(200);
    expect(paidOnly.body.summary.totalRevenue).toBe(200);
    expect(paidOnly.body.summary.totalCacambas).toBe(1);

    const filtered = await request(app)
      .get(`/billing/summary?startDate=2026-05-01&endDate=2026-05-31&granularity=monthly&city=jacarei&clientId=${clientA._id}&contentType=Terra`)
      .set('Authorization', `Bearer ${token}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.summary.totalRevenue).toBe(200);
    expect(filtered.body.summary.totalCacambas).toBe(1);
    expect(filtered.body.topClients).toHaveLength(1);

    const semiannual = await request(app)
      .get('/billing/summary?startDate=2026-01-01&endDate=2026-12-31&granularity=semiannual')
      .set('Authorization', `Bearer ${token}`);
    expect(semiannual.status).toBe(200);
    expect(semiannual.body.timeseries.some((bucket: any) => bucket.label === '1o sem/2026')).toBe(true);

    const annual = await request(app)
      .get('/billing/summary?startDate=2025-01-01&endDate=2026-12-31&granularity=annual')
      .set('Authorization', `Bearer ${token}`);
    expect(annual.status).toBe(200);
    expect(annual.body.timeseries.some((bucket: any) => bucket.label === '2026')).toBe(true);
  });
});
