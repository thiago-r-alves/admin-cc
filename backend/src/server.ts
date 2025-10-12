import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import { UserModel, IUser } from './models/User';
import { OrderModel } from './models/Order';
import { CacambaModel, ICacamba } from './models/Cacamba';
import { ClientModel } from './models/Client';
import multer from 'multer';
import './gridfs';
import { getBucket, uploadBufferToGridFS } from './gridfs'; // ADICIONADO
import { ObjectId } from 'mongodb';
import { createServer } from 'http';                 // ADICIONADO
import { Server as SocketIOServer, Socket } from 'socket.io'; // ADICIONADO
import webpush from 'web-push';
import { PushSubscriptionModel, IPushSubscription } from './models/PushSubscription';
import path from 'path';
import { compressImage, extractGridFsIdFromUrl } from './utils/image';
import { pipeline } from 'stream';
import { promisify } from 'util';
const pipe = promisify(pipeline);

const app = express();
const port = process.env.PORT || 3001;
const server = createServer(app);                    // AJUSTADO
const io = new SocketIOServer(server, {              // AJUSTADO
  cors: { origin: '*' }
});
const JWT_SECRET = process.env.JWT_SECRET;

// Conectar ao banco de dados
connectDB();

// Configurar o Multer para o upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Middlewares
app.use(express.json());
app.use(cors());

// Interfaces e Middlewares de autenticação
interface AuthenticatedRequest extends express.Request {
  userData?: {
    userId: string;
    role: 'admin' | 'motorista';
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'JWT Secret não configurado no servidor.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }

    // Verificação de tipo segura
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'role' in decoded) {
      req.userData = {
        userId: (decoded as any).userId,
        role: (decoded as any).role
      };
      next();
    } else {
      // O token decodificado não tem o formato esperado
      return res.status(403).json({ message: 'Token inválido ou malformado.' });
    }
  });
};

const isAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.userData || req.userData.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
    next();
};

const isDriver = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.userData || req.userData.role !== 'motorista') {
        return res.status(403).json({ message: 'Acesso negado. Apenas motoristas podem realizar esta ação.' });
    }
    next();
};

// ==========================================================
// ROTA DE LOGIN
// ==========================================================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
        const user = await UserModel.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Adicione esta verificação
        if (!JWT_SECRET) {
            console.error('Erro: JWT_SECRET não está definido nas variáveis de ambiente.');
            return res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' } // alterado de '8h' (ou similar) para 30 dias
        );

        return res.json({
          token,
          role: user.role,
          expiresIn: 30 * 24 * 60 * 60 // em segundos (informativo)
        });
    } catch (e) {
        return res.status(500).json({ message: 'Erro interno' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE PEDIDOS (ADMIN)
// ==========================================================

// Criar um novo pedido
const mapPriority = (p: any) => {
  if (typeof p === 'number') return p;
  if (typeof p === 'string') {
    const m = { baixa: 0, media: 1, alta: 2 } as const;
    return p in m ? m[p as keyof typeof m] : 1;
  }
  return 1;
};

// POST /orders
app.post('/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      cnpjCpf,
      city,
      cep, // ADICIONADO
      contactName,
      contactNumber,
      neighborhood,
      address,
      addressNumber,
      type,
      priority,
      motorista,
      placa
    } = req.body;

    if (!clientId) return res.status(400).json({ message: 'clientId é obrigatório' });
    if (!type) return res.status(400).json({ message: 'type é obrigatório' });

    // calcula próximo número (ignora registros com null)
    const last = await OrderModel.findOne({ orderNumber: { $ne: null } })
      .sort({ orderNumber: -1 })
      .select('orderNumber')
      .lean();
    const nextOrderNumber = (last?.orderNumber ?? 0) + 1;

    const order = await OrderModel.create({
      clientId,
      clientName,
      cnpjCpf: cnpjCpf || '',
      city: city || '',
      cep: cep || '', // ADICIONADO
      contactName,
      contactNumber,
      neighborhood,
      address,
      addressNumber,
      type,
      priority: mapPriority(priority),
      motorista: motorista || null,
      orderNumber: nextOrderNumber,
      placa: placa || '',
    });

    // RETORNAR POPULADO E EMITIR ATUALIZAÇÃO
    const populated = await OrderModel.findById(order._id)
      .populate('motorista')
      .populate('cacambas')
      .lean();

    io.emit('orders_updated'); // <- faltava após criar

    return res.status(201).json(populated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Erro ao criar pedido' });
  }
});

// Obter todos os pedidos (com info do motorista e caçambas)
app.get('/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await OrderModel.find().populate([
            {
                path: 'motorista',
                select: 'username'
            },
            {
                path: 'cacambas',
                select: 'numero tipo imageUrl createdAt local horaServicoDigitos' // ADICIONADO horaServicoDigitos
            }
        ]).sort({ priority: -1, createdAt: 1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PATCH /orders/:id
app.patch('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    const fields = [
      'clientId','clientName','cnpjCpf','city','cep', // ADICIONADO
      'contactName','contactNumber','neighborhood',
      'address','addressNumber','type','status','motorista'
    ];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];
    if (req.body.priority !== undefined) updates.priority = mapPriority(req.body.priority);

    const updated = await OrderModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Pedido não encontrado' });

    if (updated.status === 'concluido') {
      io.emit('order_completed', {
        orderId: updated._id,
        orderNumber: updated.orderNumber,
        clientName: updated.clientName,
        address: updated.address,
        addressNumber: updated.addressNumber,
        neighborhood: updated.neighborhood,
        city: updated.city || '',
        cep: updated.cep || '' // ADICIONADO NO PAYLOAD
      });
    }

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Erro ao atualizar pedido' });
  }
});

// Excluir um pedido
app.delete('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedOrder = await OrderModel.findByIdAndDelete(id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }
        notifyDrivers();
        return res.status(200).json({ message: 'Pedido excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE CLIENTES
// ==========================================================

// Listar todos os clientes
app.get('/clients', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const clients = await ClientModel.find().sort({ clientName: 1 }); // Alterado de 'name' para 'clientName'
        res.status(200).json(clients);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro ao buscar clientes.' });
    }
});

// Criar novo cliente
app.post('/clients', authenticateToken, async (req, res) => {
  try {
    const {
      clientName,
      contactName,
      contactNumber,
      neighborhood,
      address,
      addressNumber,
      cnpjCpf,
      city,
      cep // ADICIONADO
    } = req.body;

    const client = await ClientModel.create({
      clientName,
      contactName,
      contactNumber,
      neighborhood,
      address,
      addressNumber,
      cnpjCpf: cnpjCpf || '',
      city: city || '',
      cep: cep || '' // ADICIONADO
    });

    return res.status(201).json(client);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Erro ao criar cliente' });
  }
});

// PATCH /clients/:id
app.patch('/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    const fields = [
      'clientName','contactName','contactNumber',
      'neighborhood','address','addressNumber',
      'cnpjCpf','city','cep' // ADICIONADO
    ];
    for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];

    const updated = await ClientModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Cliente não encontrado' });
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Erro ao atualizar cliente' });
  }
});

// Excluir cliente
app.delete('/clients/:id', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;

        // Verificar se existem pedidos associados ao cliente
        const orderCount = await OrderModel.countDocuments({ clientId: id });
        if (orderCount > 0) {
            return res.status(400).json({ 
                message: 'Não é possível excluir o cliente pois existem pedidos associados.' 
            });
        }

        const client = await ClientModel.findByIdAndDelete(id);
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        res.status(200).json({ message: 'Cliente excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        res.status(500).json({ message: 'Erro ao excluir cliente.' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE MOTORISTAS (ADMIN)
// ==========================================================
// Criar um novo motorista
app.post('/drivers', authenticateToken, isAdmin, async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Usuário já existe.' });
        }
        const newDriver = new UserModel({
            username,
            password,
            role: 'motorista'
        });
        await newDriver.save();
        return res.status(201).json({ message: 'Motorista cadastrado com sucesso!', driver: { id: newDriver._id, username: newDriver.username } });
    } catch (error) {
        console.error('Erro ao cadastrar motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter todos os motoristas
app.get('/drivers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const drivers = await UserModel.find({ role: 'motorista' }).select('-password');
        return res.status(200).json(drivers);
    } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar um motorista
app.patch('/drivers/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    const updates: Partial<IUser> = {};
    if (username) updates.username = username;
    if (password) updates.password = password;

    try {
        const updatedDriver = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        if (!updatedDriver) {
            return res.status(404).json({ message: 'Motorista não encontrado.' });
        }
        return res.status(200).json({ message: 'Motorista atualizado com sucesso!', driver: { id: updatedDriver._id, username: updatedDriver.username } });
    } catch (error) {
        console.error('Erro ao atualizar motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Excluir um motorista
app.delete('/drivers/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedDriver = await UserModel.findByIdAndDelete(id);
        if (!deletedDriver) {
            return res.status(404).json({ message: 'Motorista não encontrado.' });
        }
        return res.status(200).json({ message: 'Motorista excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ==========================================================
// ROTAS DO MOTORISTA
// ==========================================================
// Obter pedidos do motorista logado
app.get('/driver/orders', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
        const orders = await OrderModel.find({ motorista: req.userData?.userId }).populate({
            path: 'cacambas',
            select: 'numero tipo imageUrl createdAt'
        }).sort({ priority: -1, createdAt: 1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos do motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Registrar caçamba para um pedido
app.post('/driver/orders/:id/cacambas',
  authenticateToken,
  isDriver,
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { numero, tipo, local, horaServicoDigitos } = req.body; // ADICIONADO horaServicoDigitos

    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    // Validar horaServicoDigitos
    if (!horaServicoDigitos || !/^\d{3}$/.test(horaServicoDigitos)) {
      return res.status(400).json({ message: 'Ordem de serviço deve conter exatamente 3 dígitos.' });
    }

    const exists = await CacambaModel.findOne({ orderId: order._id, numero: numero.trim() });
    if (exists) {
      return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
    }

    let finalTipo: 'entrega' | 'retirada';
    if (order.type === 'retirada') finalTipo = 'retirada';
    else if (order.type === 'entrega') finalTipo = 'entrega';
    else finalTipo = (tipo === 'retirada') ? 'retirada' : 'entrega';

    try {
      let imageUrl: string | undefined;
      if (req.file) {
        const { buffer: outBuf, contentType, filename } = await compressImage(
          req.file.buffer,
          req.file.originalname,
          { maxWidth: 1280, maxHeight: 1280, quality: 75, format: 'webp' }
        );
        const fileId = await uploadBufferToGridFS(outBuf, filename, contentType);
        imageUrl = `/files/${fileId.toString()}`;
      } else {
        return res.status(400).json({ message: 'Imagem é obrigatória.' });
      }

      const cacamba = await CacambaModel.create({
        numero: numero.trim(),
        tipo: finalTipo,
        local,
        horaServicoDigitos, // ADICIONADO
        orderId: order._id,
        imageUrl
      });

      await OrderModel.findByIdAndUpdate(id, {
        $push: { cacambas: cacamba._id },
        updatedAt: Date.now()
      });

      return res.status(201).json({ message: 'Caçamba registrada com sucesso!', cacamba });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
      }
      console.error('Erro ao registrar caçamba:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
);

// Obter caçambas de um pedido
app.get('/driver/orders/:id/cacambas', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    
    // Verifique se o pedido pertence ao motorista logado
    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    try {
        const cacambas = await CacambaModel.find({ orderId: id }).sort({ createdAt: 1 });
        return res.status(200).json(cacambas);
    } catch (error) {
        console.error('Erro ao buscar caçambas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar status do pedido para concluído (motorista) - sem anexar fotos
app.patch('/driver/orders/:id/complete', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Verifique se o pedido pertence ao motorista logado
    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    try {
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            id,
            { status: 'concluido', updatedAt: Date.now() },
            { new: true }
        );
        // Notificar todos os admins (emitir evento global)
        io.emit('orders_updated');
        return res.status(200).json({ message: 'Pedido concluído com sucesso!', order: updatedOrder });
    } catch (error) {
        console.error('Erro ao concluir pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Editar caçamba (motorista) – GRIDFS
app.patch('/cacambas/:id',
  authenticateToken,
  isDriver,
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { numero, tipo, local, horaServicoDigitos } = req.body; // ADICIONADO horaServicoDigitos

      const updates: any = {};
      if (numero) updates.numero = numero;
      if (tipo) updates.tipo = (tipo === 'retirada' ? 'retirada' : 'entrega');
      if (local) updates.local = local;
      if (horaServicoDigitos) {
        // Validar horaServicoDigitos se fornecido
        if (!/^\d{3}$/.test(horaServicoDigitos)) {
          return res.status(400).json({ message: 'Ordem de serviço deve conter exatamente 3 dígitos.' });
        }
        updates.horaServicoDigitos = horaServicoDigitos; // ADICIONADO
      }

      if (req.file) {
        const { buffer: outBuf, contentType, filename } = await compressImage(
          req.file.buffer,
          req.file.originalname,
          { maxWidth: 1280, maxHeight: 1280, quality: 75, format: 'webp' }
        );
        const fileId = await uploadBufferToGridFS(outBuf, filename, contentType);
        updates.imageUrl = `/files/${fileId.toString()}`;

        // Remove imagem antiga para liberar espaço
        const current = await CacambaModel.findById(id).lean();
        const oldId = extractGridFsIdFromUrl(current?.imageUrl);
        if (oldId) {
          try { await getBucket().delete(new ObjectId(oldId)); } catch {}
        }
      }

      const cacamba = await CacambaModel.findByIdAndUpdate(id, updates, { new: true });
      if (!cacamba) return res.status(404).json({ message: 'Caçamba não encontrada' });

      return res.json({ cacamba });
    } catch (e) {
      console.error('Erro ao editar caçamba:', e);
      return res.status(500).json({ message: 'Erro ao editar caçamba' });
    }
  }
);

// Excluir caçamba (motorista) – mantém, sem alteração de imagem
app.delete('/cacambas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cac = await CacambaModel.findByIdAndDelete(id);
    if (!cac) return res.status(404).json({ message: 'Caçamba não encontrada' });

    const oldId = extractGridFsIdFromUrl(cac.imageUrl);
    if (oldId) {
      try { await getBucket().delete(new ObjectId(oldId)); } catch {}
    }
    return res.json({ message: 'Caçamba excluída.' });
  } catch (e) {
    return res.status(500).json({ message: 'Erro ao excluir caçamba' });
  }
});

// Mapeia userId -> socket.id[]
const driverSockets: Record<string, Set<string>> = {};

io.on('connection', (socket: Socket) => {            // TIPADO
  // Motorista envia seu userId após conectar
  socket.on('register_driver', (userId: string) => {
    if (!driverSockets[userId]) driverSockets[userId] = new Set();
    driverSockets[userId].add(socket.id);
  });

  socket.on('disconnect', () => {
    // Remove socket de todos os arrays
    Object.values(driverSockets).forEach(set => set.delete(socket.id));
  });
});

// Função para notificar só o motorista específico
const notifyDriver = (driverId: string) => {
  const sockets = driverSockets[driverId];
  if (sockets) {
    sockets.forEach(socketId => {
      io.to(socketId).emit('orders_updated');
    });
  }
};

// Notifique motoristas via socket
const notifyDrivers = () => {
  io.emit('orders_updated');
};

// Altere para usar server.listen
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Listar pedidos de um cliente específico com filtros
app.get('/clients/:id/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, type, local } = req.query;

    const query: any = { clientId: id };

    // Filtro de data
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Filtro de tipo de pedido
    if (type) {
      query.type = type;
    }
    
    // Filtro de local da caçamba (requer uma consulta mais complexa)
    if (local) {
        // Encontra caçambas com o local especificado
        const cacambas = await CacambaModel.find({ local: local as string }).select('_id');
        const cacambaIds = cacambas.map(c => c._id);
        // Filtra pedidos que contenham qualquer uma dessas caçambas
        query.cacambas = { $in: cacambaIds };
    }

    const orders = await OrderModel.find(query)
      .populate('cacambas')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para servir arquivos do GridFS
app.get('/files/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const bucket = getBucket();
    const _id = new ObjectId(id);

    const files = await bucket.find({ _id }).toArray();
    if (!files || !files[0]) return res.status(404).json({ message: 'Arquivo não encontrado' });

    res.setHeader('Content-Type', files[0].contentType || 'application/octet-stream');
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on('error', () => res.status(500).end());
    downloadStream.pipe(res);
  } catch {
    return res.status(400).json({ message: 'ID inválido' });
  }
});

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('Chaves VAPID ausentes. Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.');
} else {
  webpush.setVapidDetails(
    'mailto:thiago.ralves02@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ==========================================================
// ROTAS DE NOTIFICAÇÃO POR PUSH (ADMIN E MOTORISTA)
// ==========================================================

// Registrar subscription para notificações push
app.post('/push/subscribe', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ message: 'Subscription inválida' });
    }

    await PushSubscriptionModel.updateOne(
      { endpoint: subscription.endpoint },
      {
        userId: req.userData!.userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      { upsert: true }
    );

    return res.status(201).json({ message: 'Subscription registrada.' });
  } catch (e) {
    console.error('Erro ao registrar subscription', e);
    return res.status(500).json({ message: 'Erro interno' });
  }
});

async function sendPushToDriver(driverId: string, payload: { title: string; body: string; data?: any }) {
  const subs = await PushSubscriptionModel.find({ userId: driverId });
  await Promise.all(
    subs.map(async (sub: IPushSubscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          } as any,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            data: payload.data
          })
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // subscription inválida — remove
          await PushSubscriptionModel.deleteOne({ _id: sub._id });
        } else {
          console.error('Falha push:', err.statusCode, err.body);
        }
      }
    })
  );
}
