import request from 'supertest';
import { loadApp, ensureUsers, signToken } from '../helpers/app';
import { ClientModel } from '../../src/models/Client';
import { OrderModel } from '../../src/models/Order';
import { CacambaModel } from '../../src/models/Cacamba';
import { UserModel } from '../../src/models/User';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
  'base64',
);

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
      ...(type === 'retirada' ? { cacambaPrice: 180 } : {}),
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
      ...(tipo === 'retirada' ? { contentType: 'Entulho limpo', price: 180 } : {}),
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

    const badOs = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '12')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(badOs.status).toBe(400);

    const success = await request(app)
      .post(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`)
      .field('numero', '001')
      .field('horaServicoDigitos', '123')
      .field('local', 'via_publica')
      .field('contentType', 'Entulho limpo')
      .attach('image', tinyPng, 'img.png');
    expect(success.status).toBe(201);
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

  it('GET /driver/orders/:id/cacambas e PATCH /driver/orders/:id/complete', async () => {
    const app = await loadApp();
    const { driver } = await ensureUsers();
    const token = signToken(String(driver._id), 'motorista');
    const order = await createOrderForDriver(String(driver._id), 'entrega');

    const list = await request(app)
      .get(`/driver/orders/${order._id}/cacambas`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);

    const complete = await request(app)
      .patch(`/driver/orders/${order._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(complete.status).toBe(200);
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

    const badOs = await request(app)
      .patch(`/cacambas/${cacamba._id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .field('horaServicoDigitos', '12');
    expect(badOs.status).toBe(400);

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
      .field('horaServicoDigitos', '124')
      .field('tipo', 'entrega')
      .field('local', 'canteiro_obra');
    expect(ok.status).toBe(200);
    expect(ok.body.cacamba.numero).toBe('416');
    expect(ok.body.cacamba.horaServicoDigitos).toBe('124');
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
