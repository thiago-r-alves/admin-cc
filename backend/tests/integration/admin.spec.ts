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
    expect(stringClient?.hasPendingClosureItems).toBe(true);
    expect(stringClient?.hasGeneratedClosureGroups).toBe(false);

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

    const modalEntregaOnly = await request(app)
      .get(`/clients/${onlyEntrega._id}/orders?closure=true&startDate=2026-05-15&endDate=2026-05-19`)
      .set('Authorization', `Bearer ${token}`);
    expect(modalEntregaOnly.status).toBe(200);
    expect(modalEntregaOnly.body).toHaveLength(0);
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
      city: 'Jacarei',
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
      city: 'Jacarei',
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
      city: 'Jacarei',
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
    expect(summary.body.topCities[0].city).toBe('Jacarei');
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
      .get(`/billing/summary?startDate=2026-05-01&endDate=2026-05-31&granularity=monthly&city=Jacarei&clientId=${clientA._id}&contentType=Terra`)
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


