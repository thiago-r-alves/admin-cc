import request from 'supertest';
import { loadApp } from '../helpers/app';
import { UserModel } from '../../src/models/User';

describe('Auth API', () => {
  it('POST /login autentica admin e motorista', async () => {
    const app = await loadApp();
    await UserModel.create({ username: 'adm', password: '123', role: 'admin' });
    await UserModel.create({ username: 'drv', password: '123', role: 'motorista' });

    const adminRes = await request(app).post('/login').send({ username: 'adm', password: '123' });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.role).toBe('admin');
    expect(adminRes.body.token).toBeTypeOf('string');

    const driverRes = await request(app).post('/login').send({ username: 'drv', password: '123' });
    expect(driverRes.status).toBe(200);
    expect(driverRes.body.role).toBe('motorista');
    expect(driverRes.body.token).toBeTypeOf('string');
  });

  it('POST /login retorna 401 para credenciais inválidas', async () => {
    const app = await loadApp();
    await UserModel.create({ username: 'adm2', password: '123', role: 'admin' });

    const res = await request(app).post('/login').send({ username: 'adm2', password: '999' });
    expect(res.status).toBe(401);
  });

  it('bloqueia sem token (401) e token inválido (403)', async () => {
    const app = await loadApp();
    const noToken = await request(app).get('/orders');
    expect(noToken.status).toBe(401);

    const badToken = await request(app)
      .get('/orders')
      .set('Authorization', 'Bearer token-invalido');
    expect(badToken.status).toBe(403);
  });
});

