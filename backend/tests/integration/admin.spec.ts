import request from 'supertest';
import { loadApp, ensureUsers, signToken } from '../helpers/app';
import { ClientModel } from '../../src/models/Client';
import { OrderModel } from '../../src/models/Order';
import { UserModel } from '../../src/models/User';
import { CacambaModel } from '../../src/models/Cacamba';

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

    const create = await request(app)
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
        type: 'retirada',
        motorista: String(driver._id),
        priority: 2,
      });
    expect(create.status).toBe(201);
    expect(create.body.orderNumber).toBe(1);

    const list = await request(app).get('/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body[0].type).toBe('retirada');

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

  it('Clientes: filtros, ordenação por período, patch e delete com bloqueio', async () => {
    const app = await loadApp();
    const { admin } = await ensureUsers();
    const token = signToken(String(admin._id), 'admin');

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

    await OrderModel.create({
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
    await OrderModel.create({
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
      .send({ city: 'São Paulo' });
    expect(patch.status).toBe(200);
    expect(patch.body.city).toBe('São Paulo');

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
      numero: '100',
      tipo: 'retirada',
      contentType: 'Entulho limpo',
      imageUrl: '/files/507f1f77bcf86cd799439011',
      orderId: order._id,
      local: 'via_publica',
      horaServicoDigitos: '123',
    });
    await OrderModel.findByIdAndUpdate(order._id, { $push: { cacambas: cacamba._id } });

    const res = await request(app)
      .get(`/clients/${client._id}/orders?startDate=2026-05-14&endDate=2026-05-16&type=retirada&local=via_publica&status=concluido`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(String(order._id));
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
});
