import request from 'supertest';
import { loadApp, ensureUsers, signToken } from '../helpers/app';
import { ClientModel } from '../../src/models/Client';
import { OrderModel } from '../../src/models/Order';
import { CacambaModel } from '../../src/models/Cacamba';
import { UserModel } from '../../src/models/User';

const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=';
const tinyPng = Buffer.from(tinyPngBase64, 'base64');
const tinyPngDataUrl = `data:image/png;base64,${tinyPngBase64}`;

describe('Driver APIs', () => {
  let nextOrderNumber = 2000;
  const createClient = (clientName = 'Cliente D') =>
    ClientModel.create({
      clientName,
      contactName: 'Contato D',
      contactNumber: '123',
      neighborhood: 'Centro',
      address: 'Rua D',
      addressNumber: '10',
    });

  const createOrderForDriver = async (
    driverId: string,
    type: 'entrega' | 'retirada' = 'retirada',
    clientInput?: Awaited<ReturnType<typeof createClient>>,
  ) => {
    const client = clientInput || (await createClient());
    return OrderModel.create({
      orderNumber: nextOrderNumber++,
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,
      type,
      status: 'pendente',
      motorista: driverId,
      ...(type === 'entrega' ? { cacambaPrice: 180 } : {}),
    });
  };

  const createCacambaMovement = async (
    order: any,
    numero: string,
    tipo: 'entrega' | 'retirada',
    createdAt = new Date(),
  ) => {
    const cacamba = await CacambaModel.create({
      numero,
      tipo,
      ...(tipo === 'retirada' ? { contentType: 'Entulho limpo' } : {}),
      ...(tipo === 'entrega' && typeof order.cacambaPrice === 'number' ? { price: order.cacambaPrice } : {}),
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '123',
      createdAt,
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: cacamba._id } });
    return cacamba;
  };

  it('GET /driver/orders retorna apenas pedidos do motorista e sem price', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'retirada');
    const cacamba = await CacambaModel.create({
      numero: '123',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      price: 150,
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '123',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: cacamba._id } });

    const res = await request(app).get('/driver/orders').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].cacambas[0].price).toBeUndefined();
  });

  it('POST /driver/orders/:id/cacambas valida regras de retirada e registra com imagem', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'retirada');
    const deliveryOrder = await createOrderForDriver(String(driver._id), 'entrega', await ClientModel.findById(order.clientId) as any);
    await createCacambaMovement(deliveryOrder, '001', 'entrega', new Date('2026-01-01T10:00:00.000Z'));
    await createCacambaMovement(deliveryOrder, '002', 'entrega', new Date('2026-01-01T10:01:00.000Z'));

    const missingImage = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo');
    expect(missingImage.status).toBe(400);

    const missingContent = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .attach('image', tinyPng, 'img.png');
    expect(missingContent.status).toBe(400);

    const badContent = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Tipo inválido')
      .attach('image', tinyPng, 'img.png');
    expect(badContent.status).toBe(400);

    const success = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(success.status).toBe(201);
    expect(success.body.cacamba.horaServicoDigitos).toBeUndefined();
    expect(success.body.cacamba.price).toBeUndefined();
    const createdCacamba = await CacambaModel.findById(success.body.cacamba._id).lean();
    expect(createdCacamba?.price).toBe(180);

    const second = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '002')
      .field('horaServicoDigitos', '124')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(second.status).toBe(201);
    expect(second.body.cacamba.price).toBeUndefined();
    const secondCacamba = await CacambaModel.findById(second.body.cacamba._id).lean();
    expect(secondCacamba?.price).toBe(180);

    const unpricedDelivery = await CacambaModel.create({
      numero: '003',
      tipo: 'entrega',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: deliveryOrder._id,
      local: 'via_publica',
      horaServicoDigitos: '125',
      createdAt: new Date('2026-01-01T10:02:00.000Z'),
    });
    await OrderModel.findByIdAndUpdate(deliveryOrder._id, { $push: { cacambas: unpricedDelivery._id } });

    const unpricedWithdrawal = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '003')
      .field('horaServicoDigitos', '125')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(unpricedWithdrawal.status).toBe(201);
    const unpricedWithdrawalCacamba = await CacambaModel.findById(unpricedWithdrawal.body.cacamba._id).lean();
    expect(unpricedWithdrawalCacamba?.price).toBeUndefined();

    const duplicate = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(duplicate.status).toBe(400);
  });

  it('POST /driver/orders/:id/cacambas exige exatamente três dígitos no número', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'entrega');

    for (const numero of ['1', '12', '1234', '12a', ' 123 ', '12-']) {
      const invalid = await request(app)
        .post(`/driver/orders/${order._id}/cacambas`)
        .set('Authorization', `Bearer ${token}`)
        .field('numero', numero)
        .field('horaServicoDigitos', '123')
        .field('local', 'via_publica')
        .attach('image', tinyPng, 'img.png');

      expect(invalid.status).toBe(400);
      expect(invalid.body.message).toBe('Número da caçamba deve conter exatamente 3 dígitos.');
    }

    for (const numero of ['001', '123', '999']) {
      const valid = await request(app)
        .post(`/driver/orders/${order._id}/cacambas`)
        .set('Authorization', `Bearer ${token}`)
        .field('numero', numero)
        .field('horaServicoDigitos', '123')
        .field('local', 'via_publica')
        .attach('image', tinyPng, 'img.png');

      expect(valid.status).toBe(201);
      expect(valid.body.cacamba.numero).toBe(numero);
      expect(valid.body.cacamba.price).toBeUndefined();
      const created = await CacambaModel.findById(valid.body.cacamba._id).lean();
      expect(created?.price).toBe(180);
    }
  });

  it('POST /driver/orders/:id/cacambas valida disponibilidade da caçamba por cliente', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const clienteA = await createClient('Cliente A');
    const clienteB = await createClient('Cliente B');

    const entregaLivre = await createOrderForDriver(String(driver._id), 'entrega', clienteA);
    const entregaOcupadaMesmoCliente = await createOrderForDriver(String(driver._id), 'entrega', clienteA);
    const entregaOcupadaOutroCliente = await createOrderForDriver(String(driver._id), 'entrega', clienteB);
    await createCacambaMovement(entregaOcupadaMesmoCliente, '010', 'entrega');
    await createCacambaMovement(entregaOcupadaOutroCliente, '011', 'entrega');

    const entregaOk = await request(app)
      .post(`/driver/orders/${entregaLivre._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '012')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .attach('image', tinyPng, 'img.png');
    expect(entregaOk.status).toBe(201);

    const entregaMesmoClienteBloqueada = await request(app)
      .post(`/driver/orders/${entregaLivre._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '010')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .attach('image', tinyPng, 'img.png');
    expect(entregaMesmoClienteBloqueada.status).toBe(400);
    expect(entregaMesmoClienteBloqueada.body.message).toMatch(/já está entregue para Cliente A/i);

    const entregaOutroClienteBloqueada = await request(app)
      .post(`/driver/orders/${entregaLivre._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '011')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .attach('image', tinyPng, 'img.png');
    expect(entregaOutroClienteBloqueada.status).toBe(400);
    expect(entregaOutroClienteBloqueada.body.message).toMatch(/já está entregue para Cliente B/i);

    const retiradaSemEntrega = await createOrderForDriver(String(driver._id), 'retirada', clienteA);
    const retiradaSemEntregaRes = await request(app)
      .post(`/driver/orders/${retiradaSemEntrega._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '013')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(retiradaSemEntregaRes.status).toBe(400);
    expect(retiradaSemEntregaRes.body.message).toMatch(/não possui entrega registrada/i);

    const retiradaOutroCliente = await createOrderForDriver(String(driver._id), 'retirada', clienteA);
    const retiradaOutroClienteRes = await request(app)
      .post(`/driver/orders/${retiradaOutroCliente._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '011')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(retiradaOutroClienteRes.status).toBe(400);
    expect(retiradaOutroClienteRes.body.message).toMatch(/está entregue para Cliente B/i);

    const retiradaMesmoCliente = await createOrderForDriver(String(driver._id), 'retirada', clienteA);
    const retiradaMesmoClienteRes = await request(app)
      .post(`/driver/orders/${retiradaMesmoCliente._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '010')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(retiradaMesmoClienteRes.status).toBe(201);

    const retiradaJaRetirada = await createOrderForDriver(String(driver._id), 'retirada', clienteA);
    const retiradaJaRetiradaRes = await request(app)
      .post(`/driver/orders/${retiradaJaRetirada._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '010')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(retiradaJaRetiradaRes.status).toBe(400);
    expect(retiradaJaRetiradaRes.body.message).toMatch(/já consta como retirada/i);
  });

  it('GET /driver/orders/:id/available-cacambas retorna somente entregas ativas do cliente', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const clienteA = await createClient('Cliente A');
    const clienteB = await createClient('Cliente B');
    const retirada = await createOrderForDriver(String(driver._id), 'retirada', clienteA);
    const entregaA = await createOrderForDriver(String(driver._id), 'entrega', clienteA);
    const entregaB = await createOrderForDriver(String(driver._id), 'entrega', clienteB);

    await createCacambaMovement(entregaA, '101', 'entrega', new Date('2026-01-01T10:00:00.000Z'));
    await createCacambaMovement(entregaA, '102', 'entrega', new Date('2026-01-01T10:01:00.000Z'));
    await createCacambaMovement(retirada, '102', 'retirada', new Date('2026-01-01T10:02:00.000Z'));
    await createCacambaMovement(entregaB, '103', 'entrega', new Date('2026-01-01T10:03:00.000Z'));

    const res = await request(app)
      .get(`/driver/orders/${retirada._id}/available-cacambas`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cacambas).toEqual([
      expect.objectContaining({
        numero: '101',
        deliveredAt: '2026-01-01T10:00:00.000Z',
        deliveryOrderNumber: entregaA.orderNumber,
      }),
    ]);
  });

  it('GET /driver/orders/:id/available-cacambas respeita caçambas planejadas no pedido', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const clienteA = await createClient('Cliente A');
    const retirada = await createOrderForDriver(String(driver._id), 'retirada', clienteA);
    const entregaA = await createOrderForDriver(String(driver._id), 'entrega', clienteA);

    const planned = await createCacambaMovement(entregaA, '201', 'entrega', new Date('2026-01-01T10:00:00.000Z'));
    await createCacambaMovement(entregaA, '202', 'entrega', new Date('2026-01-01T10:01:00.000Z'));
    await OrderModel.findByIdAndUpdate(retirada._id, { plannedWithdrawalCacambaIds: [planned._id] });

    const res = await request(app)
      .get(`/driver/orders/${retirada._id}/available-cacambas`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.cacambas).toEqual([
      expect.objectContaining({
        numero: '201',
        deliveryOrderNumber: entregaA.orderNumber,
      }),
    ]);
  });

  it('GET /driver/orders/:id/cacambas e PATCH /driver/orders/:id/complete conclui retirada com assinatura digital', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'retirada');

    const list = await request(app)
      .get(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);

    const complete = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        proof: {
          type: 'signed',
          signatureDataUrl: tinyPngDataUrl,
        },
      });
    expect(complete.status).toBe(200);
    expect(complete.body.order.status).toBe('concluido');
    expect(complete.body.order.deliveryProof).toEqual(expect.objectContaining({
      type: 'signed',
      driverNameSnapshot: driver.username,
    }));
    expect(complete.body.order.deliveryProof.signatureImageUrl).toMatch(/^\/files\//);
  });

  it('PATCH /driver/orders/:id/complete conclui entrega com assinatura digital', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'entrega');

    const complete = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        proof: {
          type: 'signed',
          signatureDataUrl: tinyPngDataUrl,
        },
      });

    expect(complete.status).toBe(200);
    expect(complete.body.order.status).toBe('concluido');
    expect(complete.body.order.deliveryProof).toEqual(expect.objectContaining({
      type: 'signed',
      driverNameSnapshot: driver.username,
    }));
    expect(complete.body.order.deliveryProof.signatureImageUrl).toMatch(/^\/files\//);

    const saved = await OrderModel.findById(order._id).lean();
    expect(saved?.deliveryProof?.signatureImageUrl).toMatch(/^\/files\//);
    expect(String(saved?.deliveryProof?.capturedBy)).toBe(String(driver._id));
  });

  it('PATCH /driver/orders/:id/complete conclui entrega sem responsável', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'entrega');

    const complete = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        proof: {
          type: 'no_responsible',
          note: 'Portaria fechada.',
        },
      });

    expect(complete.status).toBe(200);
    expect(complete.body.order.deliveryProof).toEqual(expect.objectContaining({
      type: 'no_responsible',
      note: 'Portaria fechada.',
      driverNameSnapshot: driver.username,
    }));
    expect(complete.body.order.deliveryProof.signatureImageUrl).toBeFalsy();
  });

  it('reutiliza automaticamente a primeira assinatura do dia no mesmo cliente, obra e motorista', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const client = await createClient('Cliente Troca');
    const source = await createOrderForDriver(String(driver._id), 'retirada', client);
    const target = await createOrderForDriver(String(driver._id), 'entrega', client);
    const concurrentTarget = await createOrderForDriver(String(driver._id), 'retirada', client);

    const first = await request(app)
      .patch(`/driver/orders/${source._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { type: 'signed', signatureDataUrl: tinyPngDataUrl } });
    expect(first.status).toBe(200);

    const [reused, concurrentlyReused] = await Promise.all([
      request(app).patch(`/driver/orders/${target._id}/complete`).set('Authorization', `Bearer ${token}`).send({ reuseProof: true }),
      request(app).patch(`/driver/orders/${concurrentTarget._id}/complete`).set('Authorization', `Bearer ${token}`).send({ reuseProof: true }),
    ]);
    expect(reused.status).toBe(200);
    expect(reused.body.order.deliveryProof).toEqual(expect.objectContaining({
      type: 'signed',
      isReused: true,
      reusedFromOrderId: String(source._id),
      reusedFromOrderNumber: source.orderNumber,
      signatureImageUrl: first.body.order.deliveryProof.signatureImageUrl,
    }));
    expect(reused.body.order.deliveryProof.capturedAt).toBe(first.body.order.deliveryProof.capturedAt);
    expect(concurrentlyReused.status).toBe(200);
    expect(concurrentlyReused.body.order.deliveryProof).toEqual(expect.objectContaining({
      isReused: true,
      reusedFromOrderId: String(source._id),
      signatureImageUrl: first.body.order.deliveryProof.signatureImageUrl,
    }));
  });

  it('reutiliza sem responsável, mas exige novo comprovante para obra, motorista ou dia diferente', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const otherDriver = await UserModel.create({ username: 'motorista-reuso-2', password: '123', role: 'motorista' });
    const token = signToken(String(driver._id), 'motorista');
    const otherToken = signToken(String(otherDriver._id), 'motorista');
    const client = await createClient('Cliente Sem Responsável');
    const source = await createOrderForDriver(String(driver._id), 'entrega', client);
    await request(app)
      .patch(`/driver/orders/${source._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { type: 'no_responsible', note: 'Portaria fechada.' } });

    const sameWork = await createOrderForDriver(String(driver._id), 'retirada', client);
    const reused = await request(app)
      .patch(`/driver/orders/${sameWork._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reuseProof: true });
    expect(reused.status).toBe(200);
    expect(reused.body.order.deliveryProof).toEqual(expect.objectContaining({
      type: 'no_responsible', note: 'Portaria fechada.', isReused: true,
    }));

    const otherAddress = await createOrderForDriver(String(driver._id), 'entrega', client);
    await OrderModel.findByIdAndUpdate(otherAddress._id, { addressNumber: '999' });
    const addressResult = await request(app)
      .patch(`/driver/orders/${otherAddress._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reuseProof: true });
    expect(addressResult.status).toBe(428);
    expect(addressResult.body.requiresProof).toBe(true);

    const otherDriverOrder = await createOrderForDriver(String(otherDriver._id), 'entrega', client);
    const driverResult = await request(app)
      .patch(`/driver/orders/${otherDriverOrder._id}/complete`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ reuseProof: true });
    expect(driverResult.status).toBe(428);

    await OrderModel.findByIdAndUpdate(source._id, {
      'deliveryProof.capturedAt': new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    const nextDayOrder = await createOrderForDriver(String(driver._id), 'entrega', client);
    const dayResult = await request(app)
      .patch(`/driver/orders/${nextDayOrder._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reuseProof: true });
    expect(dayResult.status).toBe(428);
  });

  it('PATCH /driver/orders/:id/complete rejeita pedido sem comprovante válido', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'entrega');

    const missingProof = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(missingProof.status).toBe(400);

    const missingSignature = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        proof: {
          type: 'signed',
        },
      });
    expect(missingSignature.status).toBe(400);
    expect(missingSignature.body.message).toMatch(/Assinatura/i);

    const withdrawal = await createOrderForDriver(String(driver._id), 'retirada');
    const withdrawalMissingProof = await request(app)
      .patch(`/driver/orders/${withdrawal._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(withdrawalMissingProof.status).toBe(400);
  });

  it('rotas do motorista retornam 404 quando pedido pertence a outro motorista', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const otherDriver = await UserModel.create({ username: 'outro', password: '123', role: 'motorista' });
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(otherDriver._id), 'retirada');

    const list404 = await request(app)
      .get(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`);
    expect(list404.status).toBe(404);

    const complete404 = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(complete404.status).toBe(404);

    const add404 = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(add404.status).toBe(404);
  });

  it('PATCH /cacambas/:id valida permissão, tipo e preço', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const driverToken = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'retirada');
    const cacamba = await CacambaModel.create({
      numero: '321',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      price: 180,
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '123',
    });

    const badContent = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .field('contentType', 'Inexistente');
    expect(badContent.status).toBe(400);

    const driverContentOk = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .field('contentType', 'Entulho misto');
    expect(driverContentOk.status).toBe(200);
    expect(driverContentOk.body.cacamba.price).toBeUndefined();

    const driverPriceForbidden = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .field('price', '100');
    expect(driverPriceForbidden.status).toBe(403);

    const adminPriceNotConcluded = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('price', '100');
    expect(adminPriceNotConcluded.status).toBe(400);

    await OrderModel.findByIdAndUpdate(order._id, { status: 'concluido' });

    const adminPriceInvalid = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('price', '-10');
    expect(adminPriceInvalid.status).toBe(400);

    const adminPriceOk = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('price', '200');
    expect(adminPriceOk.status).toBe(200);
    expect(adminPriceOk.body.cacamba.price).toBe(200);
  });

  it('PATCH /cacambas/:id permite admin corrigir dados e bloqueia inconsistências', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const order = await createOrderForDriver(String(driver._id), 'entrega');
    const cacamba = await CacambaModel.create({
      numero: '415',
      tipo: 'entrega',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '670',
    });
    const duplicate = await CacambaModel.create({
      numero: '999',
      tipo: 'entrega',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '671',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: { $each: [cacamba._id, duplicate._id] } } });
    const otherClient = await createClient('Cliente Ocupado');
    const otherOrder = await createOrderForDriver(String(driver._id), 'entrega', otherClient);
    await createCacambaMovement(otherOrder, '888', 'entrega');

    const occupiedNumero = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('numero', '888');
    expect(occupiedNumero.status).toBe(400);
    expect(occupiedNumero.body.message).toMatch(/já está entregue para Cliente Ocupado/i);

    const ok = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('numero', '416')
      .field('tipo', 'entrega')
      .field('local', 'canteiro_obra');
    expect(ok.status).toBe(200);
    expect(ok.body.cacamba.numero).toBe('416');
    expect(ok.body.cacamba.tipo).toBe('entrega');
    expect(ok.body.cacamba.local).toBe('canteiro_obra');

    const duplicateNumero = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('numero', '999');
    expect(duplicateNumero.status).toBe(400);
    expect(duplicateNumero.body.message).toMatch(/já registrado/i);

    const badType = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('tipo', 'retirada');
    expect(badType.status).toBe(400);
    expect(badType.body.message).toMatch(/tipo do pedido/i);

    const badLocal = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('local', 'rua');
    expect(badLocal.status).toBe(400);
    expect(badLocal.body.message).toMatch(/local/i);
  });

  it('DELETE /cacambas/:id remove e retorna 404 quando não existe', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'entrega');
    const cacamba = await CacambaModel.create({
      numero: '900',
      tipo: 'entrega',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '111',
    });

    const del = await request(app)
      .delete(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const del404 = await request(app)
      .delete(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del404.status).toBe(404);
  });

  it('GET /files/:id inválido retorna 400 e push subscription valida role/payload', async () => {
    const app = await loadApp();
    const { admin, driver } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const driverToken = signToken(String(driver._id), 'motorista');

    const badFile = await request(app).get('/files/id-invalido');
    expect(badFile.status).toBe(400);

    const notFoundFile = await request(app).get('/files/507f1f77bcf86cd799439011');
    expect(notFoundFile.status).toBe(404);

    const badPayload = await request(app)
      .post('/push/subscribe')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ subscription: {} });
    expect(badPayload.status).toBe(400);

    const wrongRole = await request(app)
      .post('/push/subscribe')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subscription: { endpoint: 'x', keys: { p256dh: 'a', auth: 'b' } },
      });
    expect(wrongRole.status).toBe(403);

    const ok = await request(app)
      .post('/push/subscribe')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        subscription: { endpoint: 'ep-1', keys: { p256dh: 'a', auth: 'b' } },
      });
    expect(ok.status).toBe(201);
  });

  it('role incorreto em rota de motorista retorna 403', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const adminToken = signToken(String(admin._id), 'admin');
    const res = await request(app).get('/driver/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });
});
