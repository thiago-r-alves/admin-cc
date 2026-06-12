import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import { UserModel, IUser } from './models/User';
import { OrderModel } from './models/Order';
import { CACAMBA_CONTENT_TYPES, CacambaContentType, CacambaModel, ICacamba } from './models/Cacamba';
import { ClosureGroupModel } from './models/ClosureGroup';
import { ClientModel } from './models/Client';
import { CityModel, normalizeCityName } from './models/City';
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
import { buildLocalDateRange, mapPriority } from './utils/order';
import { buildBillingSummary, buildPreviousPeriodRange, extractBillingRows, parseBillingGranularity } from './utils/billing';
import { pipeline } from 'stream';
import { promisify } from 'util';
const pipe = promisify(pipeline);

const buildClosureDateRange = (startDate: unknown, endDate: unknown) => {
  if (!startDate || !endDate) return null;
  return buildLocalDateRange(String(startDate), String(endDate));
};

const buildClosureOrdersQuery = (range: { start: Date; end: Date }) => ({
  status: 'concluido' as const,
  type: 'retirada' as const,
  updatedAt: { $gte: range.start, $lte: range.end },
});

type ClosurePaymentFilter = 'all' | 'pending' | 'invoice_pending' | 'paid';

const parseClosurePaymentFilter = (value: unknown): ClosurePaymentFilter => {
  if (value === 'pending') return 'pending';
  if (value === 'invoice_pending') return 'invoice_pending';
  if (value === 'paid') return 'paid';
  return 'all';
};

const buildClientIdMatch = (id: string) => {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [{ clientId: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    return [{ clientId: trimmed }, { clientId: new ObjectId(trimmed) }];
  }
  return [{ clientId: trimmed }];
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildClosureGroupClientMatch = (id: string) => {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [{ clientId: trimmed }];
  if (ObjectId.isValid(trimmed)) {
    return [{ clientId: trimmed }, { clientId: new ObjectId(trimmed) }];
  }
  return [{ clientId: trimmed }];
};

const CLOSURE_DEBUG = String(process.env.CLOSURE_DEBUG || '').toLowerCase() === 'true';

const ORDER_CLIENT_SNAPSHOT_FIELDS = [
  'clientId',
  'clientName',
  'cnpjCpf',
  'contactName',
  'contactNumber',
  'neighborhood',
  'address',
  'addressNumber',
  'city',
  'cep',
] as const;

const buildOrderClientSnapshot = (client: {
  _id: unknown;
  clientName?: string;
  cnpjCpf?: string;
  contactName?: string;
  contactNumber?: string;
  neighborhood?: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  cep?: string;
}) => ({
  clientId: client._id,
  clientName: String(client.clientName || '').trim(),
  cnpjCpf: String(client.cnpjCpf || '').trim(),
  contactName: String(client.contactName || '').trim(),
  contactNumber: String(client.contactNumber || '').trim(),
  neighborhood: String(client.neighborhood || '').trim(),
  address: String(client.address || '').trim(),
  addressNumber: String(client.addressNumber || '').trim(),
  city: String(client.city || '').trim(),
  cep: String(client.cep || '').trim(),
});

const getNextClosureGroupSequence = async (clientId: string | ObjectId) => {
  const latestGroupForClient = (await ClosureGroupModel.findOne({
    $or: buildClosureGroupClientMatch(String(clientId)),
  })
    .sort({ clientSequenceNumber: -1 })
    .select('clientSequenceNumber')
    .lean()) as { clientSequenceNumber?: number } | null;
  return (latestGroupForClient?.clientSequenceNumber || 0) + 1;
};

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

const orderTypes = ['entrega', 'retirada'] as const;
const isOrderType = (value: unknown): value is typeof orderTypes[number] =>
  orderTypes.includes(value as typeof orderTypes[number]);

const isValidCacambaContentType = (value: unknown): value is CacambaContentType =>
  typeof value === 'string' &&
  (CACAMBA_CONTENT_TYPES as readonly string[]).includes(value);

const cacambaLocals = ['via_publica', 'canteiro_obra'] as const;
const isValidCacambaLocal = (value: unknown): value is typeof cacambaLocals[number] =>
  typeof value === 'string' && cacambaLocals.includes(value as typeof cacambaLocals[number]);

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
    if (!isOrderType(type)) return res.status(400).json({ message: 'type deve ser entrega ou retirada' });

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
                select: 'numero tipo paymentStatus contentType price imageUrl createdAt local horaServicoDigitos'
            }
        ]).sort({ priority: -1, createdAt: 1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PATCH /orders/:id/change-client
app.patch('/orders/:id/change-client', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const normalizedClientId = String(req.body?.clientId || '').trim();
    if (!normalizedClientId) {
      return res.status(400).json({ message: 'clientId é obrigatório.' });
    }

    const order = await OrderModel.findById(id).populate({
      path: 'cacambas',
      select: '_id paymentStatus closureGroupId tipo',
    });
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado.' });
    }

    if (String(order.clientId) === normalizedClientId) {
      return res.status(400).json({ message: 'O pedido já está vinculado a este cliente.' });
    }

    const targetClient = await ClientModel.findById(normalizedClientId).lean();
    if (!targetClient) {
      return res.status(404).json({ message: 'Cliente de destino não encontrado.' });
    }

    const snapshot = buildOrderClientSnapshot(targetClient);
    const orderCacambas = ((order.cacambas || []) as any[])
      .filter(Boolean)
      .map((cacamba) => ({
        _id: String(cacamba._id),
        paymentStatus: String(cacamba.paymentStatus || 'pendente'),
        closureGroupId: cacamba.closureGroupId ? String(cacamba.closureGroupId) : '',
        tipo: String(cacamba.tipo || ''),
      }));

    const groupedCacambas = orderCacambas.filter(
      (cacamba) =>
        cacamba.tipo === 'retirada' &&
        cacamba.closureGroupId &&
        (cacamba.paymentStatus === 'nota_fiscal_pendente' || cacamba.paymentStatus === 'paga'),
    );

    const groupedIds = new Set(groupedCacambas.map((cacamba) => cacamba._id));
    const closureGroupIds = Array.from(new Set(groupedCacambas.map((cacamba) => cacamba.closureGroupId)));
    const closureGroups = closureGroupIds.length
      ? await ClosureGroupModel.find({ _id: { $in: closureGroupIds } })
      : [];
    const closureGroupMap = new Map(closureGroups.map((group) => [String(group._id), group]));

    for (const cacamba of groupedCacambas) {
      const group = closureGroupMap.get(cacamba.closureGroupId);
      if (!group) {
        return res.status(409).json({ message: 'Grupo de fechamento relacionado não foi encontrado.' });
      }
      const groupIds = new Set((group.cacambaIds || []).map((item) => String(item)));
      if (!groupIds.has(cacamba._id)) {
        return res.status(409).json({ message: 'Há caçambas vinculadas a um grupo de fechamento incompatível.' });
      }
    }

    Object.assign(order, snapshot);
    await order.save();

    let migratedCacambas = 0;
    let createdClosureGroups = 0;
    let updatedClosureGroups = 0;
    let deletedClosureGroups = 0;

    for (const sourceGroupId of closureGroupIds) {
      const sourceGroup = closureGroupMap.get(sourceGroupId);
      if (!sourceGroup) continue;

      const sourceIds = (sourceGroup.cacambaIds || []).map((item) => String(item));
      const movingIds = sourceIds.filter((item) => groupedIds.has(item));
      if (!movingIds.length) continue;

      const nextSequence = await getNextClosureGroupSequence(normalizedClientId);
      const newGroup = await ClosureGroupModel.create({
        clientId: normalizedClientId,
        clientSequenceNumber: nextSequence,
        startDate: sourceGroup.startDate,
        endDate: sourceGroup.endDate,
        cacambaIds: movingIds.map((item) => new ObjectId(item)),
        status: sourceGroup.status,
        invoiceNumber: sourceGroup.invoiceNumber || '',
        createdBy: sourceGroup.createdBy,
      });
      createdClosureGroups += 1;

      await CacambaModel.updateMany(
        { _id: { $in: movingIds } },
        { $set: { closureGroupId: newGroup._id } },
      );
      migratedCacambas += movingIds.length;

      const remainingIds = sourceIds.filter((item) => !groupedIds.has(item));
      if (remainingIds.length === 0) {
        await ClosureGroupModel.deleteOne({ _id: sourceGroup._id });
        deletedClosureGroups += 1;
      } else {
        sourceGroup.cacambaIds = remainingIds.map((item) => new ObjectId(item)) as any;
        await sourceGroup.save();
        updatedClosureGroups += 1;
      }
    }

    const updatedOrder = await OrderModel.findById(order._id)
      .populate('motorista')
      .populate('cacambas')
      .lean();

    io.emit('orders_updated');

    return res.status(200).json({
      order: updatedOrder,
      migration: {
        migratedCacambas,
        createdClosureGroups,
        updatedClosureGroups,
        deletedClosureGroups,
      },
    });
  } catch (error) {
    console.error('Erro ao corrigir cliente do pedido:', error);
    return res.status(500).json({ message: 'Erro ao corrigir cliente do pedido.' });
  }
});

// PATCH /orders/:id
app.patch('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    if (req.body.type !== undefined && !isOrderType(req.body.type)) {
      return res.status(400).json({ message: 'type deve ser entrega ou retirada' });
    }
    const fields = [
      ...ORDER_CLIENT_SNAPSHOT_FIELDS,
      'type',
      'status',
      'motorista',
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

app.get('/cities', authenticateToken, async (req, res) => {
  try {
    const cities = await CityModel.find({ active: true }).sort({ name: 1 });
    return res.status(200).json(cities);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    return res.status(500).json({ message: 'Erro ao buscar cidades.' });
  }
});

app.post('/cities', authenticateToken, isAdmin, async (req, res) => {
  try {
    const rawName = String(req.body?.name || '').trim();
    if (!rawName) {
      return res.status(400).json({ message: 'Nome da cidade é obrigatório.' });
    }

    const normalizedName = normalizeCityName(rawName);
    const duplicate = await CityModel.findOne({ normalizedName }).select('_id');
    if (duplicate) {
      return res.status(409).json({ message: 'Cidade já cadastrada.' });
    }

    const city = await CityModel.create({
      name: rawName,
      normalizedName,
      active: true,
    });

    return res.status(201).json(city);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Cidade já cadastrada.' });
    }
    console.error('Erro ao criar cidade:', error);
    return res.status(500).json({ message: 'Erro ao criar cidade.' });
  }
});

app.delete('/cities/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const city = await CityModel.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true },
    );
    if (!city) {
      return res.status(404).json({ message: 'Cidade nao encontrada.' });
    }
    return res.status(200).json({ message: 'Cidade removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover cidade:', error);
    return res.status(500).json({ message: 'Erro ao remover cidade.' });
  }
});

app.get('/billing/summary', authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      granularity,
      city,
      clientId,
      contentType,
    } = req.query as {
      startDate?: string;
      endDate?: string;
      granularity?: string;
      city?: string;
      clientId?: string;
      contentType?: string;
    };

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate e endDate são obrigatórios.' });
    }

    const currentRange = buildLocalDateRange(startDate, endDate);
    if (!currentRange) {
      return res.status(400).json({ message: 'Período de datas inválido.' });
    }

    const previousRange = buildPreviousPeriodRange(currentRange.start, currentRange.end);
    const resolvedGranularity = parseBillingGranularity(granularity);
    const normalizedCity = String(city || '').trim();
    const normalizedContentType = String(contentType || '').trim();
    const normalizedClientId = String(clientId || '').trim();

    const buildBillingOrderQuery = (start: Date, end: Date) => {
      const query: any = {
        status: 'concluido',
        type: 'retirada',
        updatedAt: { $gte: start, $lte: end },
      };

      if (normalizedCity) {
        query.city = normalizedCity;
      }

      if (normalizedClientId) {
        query.$or = buildClientIdMatch(normalizedClientId);
      }

      return query;
    };

    const [currentOrders, previousOrders] = await Promise.all([
      OrderModel.find(buildBillingOrderQuery(currentRange.start, currentRange.end))
        .populate({
          path: 'cacambas',
          select: 'tipo paymentStatus contentType price',
        })
        .lean(),
      OrderModel.find(buildBillingOrderQuery(previousRange.start, previousRange.end))
        .populate({
          path: 'cacambas',
          select: 'tipo paymentStatus contentType price',
        })
        .lean(),
    ]);

    const currentRows = extractBillingRows(currentOrders as any[], {
      contentType: normalizedContentType,
    });
    const previousRows = extractBillingRows(previousOrders as any[], {
      contentType: normalizedContentType,
    });

    return res.status(200).json(
      buildBillingSummary(
        currentRows,
        previousRows,
        currentRange.start,
        currentRange.end,
        resolvedGranularity,
      ),
    );
  } catch (error) {
    console.error('Erro ao gerar resumo de faturamento:', error);
    return res.status(500).json({ message: 'Erro ao gerar resumo de faturamento.' });
  }
});

// Listar todos os clientes
app.get('/clients', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, type, closure, paymentStatus } = req.query;
    const isClosureMode = String(closure || '').toLowerCase() === 'true';
    const closurePaymentFilter = parseClosurePaymentFilter(paymentStatus);
    const hasTypeFilter = typeof type === 'string' && (type === 'entrega' || type === 'retirada');

    if (isClosureMode) {
      const hasDateRange = Boolean(startDate && endDate);
      const range = hasDateRange ? buildClosureDateRange(startDate, endDate) : null;
      if (hasDateRange && !range) {
        return res.status(400).json({ message: 'Período de datas inválido.' });
      }

      const aggregated = await OrderModel.aggregate([
        {
          $match: range
            ? buildClosureOrdersQuery({ start: range.start, end: range.end })
            : { status: 'concluido', type: 'retirada' },
        },
        {
          $lookup: {
            from: 'cacambas',
            localField: 'cacambas',
            foreignField: '_id',
            as: 'cacambasDocs',
          },
        },
        {
          $addFields: {
            closureCacambas: {
              $filter: {
                input: '$cacambasDocs',
                as: 'cacamba',
                cond: {
                  $eq: ['$$cacamba.tipo', 'retirada'],
                },
              },
            },
          },
        },
        {
          $addFields: {
            pendingClosureCount: {
              $size: {
                $filter: {
                  input: '$closureCacambas',
                  as: 'cacamba',
                  cond: {
                    $or: [
                      { $eq: ['$$cacamba.paymentStatus', 'pendente'] },
                      { $eq: ['$$cacamba.paymentStatus', null] },
                      {
                        $not: [
                          {
                            $ifNull: ['$$cacamba.paymentStatus', false],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
            invoicePendingClosureCount: {
              $size: {
                $filter: {
                  input: '$closureCacambas',
                  as: 'cacamba',
                  cond: { $eq: ['$$cacamba.paymentStatus', 'nota_fiscal_pendente'] },
                },
              },
            },
            paidClosureCount: {
              $size: {
                $filter: {
                  input: '$closureCacambas',
                  as: 'cacamba',
                  cond: { $eq: ['$$cacamba.paymentStatus', 'paga'] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            generatedClosureGroupsCount: {
              $add: ['$invoicePendingClosureCount', '$paidClosureCount'],
            },
          },
        },
        {
          $match: {
            closureCacambas: { $ne: [] },
          },
        },
        ...(closurePaymentFilter === 'pending'
          ? [{
            $match: {
              pendingClosureCount: { $gt: 0 },
            },
          }]
          : closurePaymentFilter === 'invoice_pending'
            ? [{
              $match: {
                invoicePendingClosureCount: { $gt: 0 },
              },
            }]
          : closurePaymentFilter === 'paid'
            ? [{
              $match: {
                paidClosureCount: { $gt: 0 },
              },
            }]
            : []),
        {
          $project: {
            updatedAt: 1,
            clientIdString: { $toString: '$clientId' },
            pendingClosureCount: 1,
            generatedClosureGroupsCount: 1,
          },
        },
        {
          $group: {
            _id: '$clientIdString',
            latestCompletion: { $max: '$updatedAt' },
            orderCount: { $sum: 1 },
            pendingClosureCount: { $sum: '$pendingClosureCount' },
            generatedClosureGroupsCount: { $sum: '$generatedClosureGroupsCount' },
          },
        },
        {
          $addFields: {
            clientObjectId: {
              $convert: {
                input: '$_id',
                to: 'objectId',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'clients',
            let: { cid: '$_id', oid: '$clientObjectId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$_id', '$$oid'] },
                      { $eq: [{ $toString: '$_id' }, '$$cid'] },
                    ],
                  },
                },
              },
            ],
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $sort: { latestCompletion: -1, 'client.clientName': 1 } },
      ]);

      if (CLOSURE_DEBUG) {
        console.log('[CLOSURE_DEBUG] /clients?closure=true', {
          range: range ? { start: range.start.toISOString(), end: range.end.toISOString() } : 'all',
          count: aggregated.length,
          clients: aggregated.map((row: any) => ({
            clientId: row._id,
            orderCount: row.orderCount,
            latestCompletion: row.latestCompletion,
          })),
        });
      }

      return res.status(200).json(
        aggregated
          .map((row: any) => {
            if (!row.client) return null;
            return {
              ...row.client,
              hasPendingClosureItems: Number(row.pendingClosureCount || 0) > 0,
              hasGeneratedClosureGroups: Number(row.generatedClosureGroupsCount || 0) > 0,
              pendingClosureCount: Number(row.pendingClosureCount || 0),
              generatedClosureGroupsCount: Number(row.generatedClosureGroupsCount || 0),
            };
          })
          .filter(Boolean),
      );
    }

    if (startDate && endDate) {
      const range = buildLocalDateRange(String(startDate), String(endDate));
      if (!range) {
        return res.status(400).json({ message: 'Período de datas inválido.' });
      }
      const { start, end } = range;

      const ordersQuery: any = {
        status: 'concluido',
        updatedAt: { $gte: start, $lte: end },
      };
      if (hasTypeFilter) {
        ordersQuery.type = type;
      }

      const concludedOrders = await OrderModel.find(ordersQuery).select('clientId updatedAt').lean();

      const firstCompletionByClient = new Map<string, number>();

      for (const order of concludedOrders as Array<{ clientId?: unknown; updatedAt?: Date | string }>) {
        const clientId = String(order.clientId ?? '');
        if (!clientId) continue;

        const updatedAtMs = new Date(order.updatedAt ?? 0).getTime();
        if (!Number.isFinite(updatedAtMs)) continue;

        const current = firstCompletionByClient.get(clientId);
        if (current === undefined || updatedAtMs < current) {
          firstCompletionByClient.set(clientId, updatedAtMs);
        }
      }

      const clientIds = Array.from(firstCompletionByClient.keys());
      if (!clientIds.length) {
        return res.status(200).json([]);
      }

      const clients = await ClientModel.find({ _id: { $in: clientIds } }).lean();
      const clientById = new Map(clients.map(client => [String(client._id), client]));

      const sortedClients = clientIds
        .map((id) => ({
          client: clientById.get(id),
          firstCompletion: firstCompletionByClient.get(id) ?? 0,
        }))
        .filter((item): item is { client: any; firstCompletion: number } => Boolean(item.client))
        .sort((a, b) => {
          if (b.firstCompletion !== a.firstCompletion) {
            return b.firstCompletion - a.firstCompletion;
          }
          const aName = String(a.client.clientName ?? '').toLocaleLowerCase('pt-BR');
          const bName = String(b.client.clientName ?? '').toLocaleLowerCase('pt-BR');
          return aName.localeCompare(bName, 'pt-BR');
        })
        .map((item) => item.client);

      return res.status(200).json(sortedClients);
    }

    if (hasTypeFilter) {
      const typedOrders = await OrderModel.find({ type }).select('clientId').lean();
      const clientIds = Array.from(
        new Set(
          typedOrders
            .map((o: any) => String(o.clientId))
            .filter(Boolean),
        ),
      );
      const clients = await ClientModel.find({ _id: { $in: clientIds } }).sort({ clientName: 1 });
      return res.status(200).json(clients);
    }

    const clients = await ClientModel.find().sort({ clientName: 1 });
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
            select: 'numero tipo paymentStatus contentType imageUrl createdAt local horaServicoDigitos'
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
    const { numero, local, horaServicoDigitos, contentType } = req.body;

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

    const finalTipo: 'entrega' | 'retirada' = order.type === 'retirada' ? 'retirada' : 'entrega';
    const normalizedContentType = typeof contentType === 'string' ? contentType.trim() : '';

    if (finalTipo === 'retirada') {
      if (!normalizedContentType) {
        return res.status(400).json({ message: 'Tipo de conteúdo é obrigatório para retiradas.' });
      }
      if (!isValidCacambaContentType(normalizedContentType)) {
        return res.status(400).json({ message: 'Tipo de conteúdo inválido para retirada.' });
      }
    }

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
        ...(finalTipo === 'retirada' ? { contentType: normalizedContentType } : {}),
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
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { numero, tipo, local, horaServicoDigitos, contentType, price } = req.body;

      if (!req.userData) {
        return res.status(401).json({ message: 'Usuário não autenticado.' });
      }

      const existing = await CacambaModel.findById(id);
      if (!existing) return res.status(404).json({ message: 'Caçamba não encontrada' });

      const order = await OrderModel.findById(existing.orderId).select('motorista type status');
      if (!order) return res.status(404).json({ message: 'Pedido da caçamba não encontrado.' });

      const isAdminUser = req.userData.role === 'admin';
      const isDriverOwner =
        req.userData.role === 'motorista' &&
        String(order.motorista || '') === String(req.userData.userId || '');

      if (!isAdminUser && !isDriverOwner) {
        return res.status(403).json({ message: 'Sem permissão para editar esta caçamba.' });
      }

      const updates: any = {};
      const orderType: 'entrega' | 'retirada' = order.type === 'retirada' ? 'retirada' : 'entrega';

      if (numero !== undefined) {
        const normalizedNumero = String(numero).trim();
        if (!normalizedNumero) {
          return res.status(400).json({ message: 'Número da caçamba é obrigatório.' });
        }

        const duplicate = await CacambaModel.exists({
          _id: { $ne: existing._id },
          orderId: existing.orderId,
          numero: normalizedNumero,
        });
        if (duplicate) {
          return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
        }

        updates.numero = normalizedNumero;
      }

      if (tipo !== undefined) {
        if (tipo !== orderType) {
          return res.status(400).json({ message: 'Tipo da caçamba deve acompanhar o tipo do pedido.' });
        }
      }
      if (existing.tipo !== orderType || tipo !== undefined) {
        updates.tipo = orderType;
      }

      if (local !== undefined) {
        if (!isValidCacambaLocal(local)) {
          return res.status(400).json({ message: 'Local da caçamba inválido.' });
        }
        updates.local = local;
      }

      if (horaServicoDigitos !== undefined) {
        const digits = String(horaServicoDigitos).trim();
        if (!/^\d{3}$/.test(digits)) {
          return res.status(400).json({ message: 'Ordem de serviço deve conter exatamente 3 dígitos.' });
        }
        updates.horaServicoDigitos = digits;
      }

      if (contentType !== undefined) {
        const normalizedContentType = String(contentType).trim();
        if (orderType === 'retirada') {
          if (!normalizedContentType) {
            return res.status(400).json({ message: 'Tipo de conteúdo é obrigatório para retirada.' });
          }
          if (!isValidCacambaContentType(normalizedContentType)) {
            return res.status(400).json({ message: 'Tipo de conteúdo inválido para retirada.' });
          }
          updates.contentType = normalizedContentType;
        }
      }

      if (orderType === 'retirada' && contentType === undefined) {
        const existingContentType = String(existing.contentType || '').trim();
        if (!existingContentType) {
          return res.status(400).json({ message: 'Tipo de conteúdo é obrigatório para retirada.' });
        }
      }

      if (price !== undefined) {
        if (!isAdminUser) {
          return res.status(403).json({ message: 'Somente admin pode atualizar valor da caçamba.' });
        }
        if (orderType !== 'retirada') {
          return res.status(400).json({ message: 'Valor por caçamba é permitido apenas para retirada.' });
        }
        if (order.status !== 'concluido') {
          return res.status(400).json({ message: 'Valor por caçamba só pode ser definido em pedido concluído.' });
        }
        const parsedPrice = Number(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ message: 'Valor da caçamba inválido.' });
        }
        updates.price = parsedPrice;
      }

      if (req.file) {
        const { buffer: outBuf, contentType, filename } = await compressImage(
          req.file.buffer,
          req.file.originalname,
          { maxWidth: 1280, maxHeight: 1280, quality: 75, format: 'webp' }
        );
        const fileId = await uploadBufferToGridFS(outBuf, filename, contentType);
        updates.imageUrl = `/files/${fileId.toString()}`;

        const oldId = extractGridFsIdFromUrl(existing.imageUrl);
        if (oldId) {
          try { await getBucket().delete(new ObjectId(oldId)); } catch {}
        }
      }

      const cacamba = await CacambaModel.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!cacamba) return res.status(404).json({ message: 'Caçamba não encontrada' });

      io.emit('orders_updated');

      return res.json({ cacamba });
    } catch (e: any) {
      if (e?.code === 11000) {
        return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
      }
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

export const startServer = () =>
  server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

// Listar pedidos de um cliente específico com filtros
app.get('/clients/:id/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, type, local, status, closure, paymentStatus } = req.query;
    const isClosureMode = String(closure || '').toLowerCase() === 'true';
    const closurePaymentFilter = parseClosurePaymentFilter(paymentStatus);

    const query: any = { clientId: id };

    if (isClosureMode) {
      const hasDateRange = Boolean(startDate && endDate);
      const range = hasDateRange ? buildClosureDateRange(startDate, endDate) : null;
      if (hasDateRange && !range) {
        return res.status(400).json({ message: 'Período de datas inválido.' });
      }
      query.$or = buildClientIdMatch(id);
      delete query.clientId;
      Object.assign(
        query,
        range
          ? buildClosureOrdersQuery({ start: range.start, end: range.end })
          : { status: 'concluido', type: 'retirada' },
      );
    } else {
      if (startDate && endDate) {
        const range = buildLocalDateRange(String(startDate), String(endDate));
        if (!range) {
          return res.status(400).json({ message: 'Período de datas inválido.' });
        }
        query.createdAt = {
          $gte: range.start,
          $lte: range.end,
        };
      }

      if (type) {
        query.type = type;
      }

      if (status) {
        query.status = status;
      }
    }

    if (!isClosureMode && local) {
      const cacambas = await CacambaModel.find({ local: local as string }).select('_id');
      const cacambaIds = cacambas.map(c => c._id);
      query.cacambas = { $in: cacambaIds };
    }

    let orders = await OrderModel.find(query)
      .populate('cacambas')
      .populate({
        path: 'motorista',
        select: 'username',
      })
      .sort(isClosureMode ? { updatedAt: -1 } : { createdAt: -1 });

    if (isClosureMode) {
      orders = orders
        .map((order: any) => {
          const filteredCacambas = (order.cacambas || []).filter((cacamba: any) => {
            if (cacamba?.tipo !== 'retirada') return false;
            if (closurePaymentFilter === 'pending') {
              return (cacamba?.paymentStatus || 'pendente') === 'pendente';
            }
            if (closurePaymentFilter === 'invoice_pending') {
              return cacamba?.paymentStatus === 'nota_fiscal_pendente';
            }
            if (closurePaymentFilter === 'paid') {
              return cacamba?.paymentStatus === 'paga';
            }
            return true;
          });
          order.cacambas = filteredCacambas;
          return order;
        })
        .filter((order: any) => (order.cacambas || []).length > 0);
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/closures/download', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { clientId, startDate, endDate, selectedCacambaIds } = req.body as {
      clientId?: string;
      startDate?: string;
      endDate?: string;
      selectedCacambaIds?: string[];
    };

    if (!clientId || !Array.isArray(selectedCacambaIds) || selectedCacambaIds.length === 0) {
      return res.status(400).json({ message: 'clientId e selectedCacambaIds são obrigatórios.' });
    }

    const uniqueIds = Array.from(new Set(selectedCacambaIds.map((id) => String(id).trim()).filter(Boolean)));
    if (!uniqueIds.length) {
      return res.status(400).json({ message: 'Nenhuma caçamba válida foi selecionada.' });
    }

    const hasDateRange = Boolean(startDate && endDate);
    const range = hasDateRange ? buildClosureDateRange(startDate, endDate) : null;
    if (hasDateRange && !range) {
      return res.status(400).json({ message: 'Período de datas inválido.' });
    }

    const orders = await OrderModel.find({
      ...(range
        ? buildClosureOrdersQuery({ start: range.start, end: range.end })
        : { status: 'concluido', type: 'retirada' }),
      $or: buildClientIdMatch(clientId),
    }).populate('cacambas');

    const cacambasById = new Map<string, any>();
    for (const order of orders as any[]) {
      for (const cacamba of order.cacambas || []) {
        cacambasById.set(String(cacamba._id), cacamba);
      }
    }

    const notFoundOrInvalid = uniqueIds.filter((id) => {
      const c = cacambasById.get(id);
      return !c || c.tipo !== 'retirada' || (c.paymentStatus || 'pendente') !== 'pendente';
    });
    if (notFoundOrInvalid.length > 0) {
      return res.status(400).json({ message: 'Seleção contém caçambas inválidas, fora do período ou já agrupadas/pagas.' });
    }

    const nextClientSequenceNumber = await getNextClosureGroupSequence(clientId);

    const closureGroup = await ClosureGroupModel.create({
      clientSequenceNumber: nextClientSequenceNumber,
      clientId: clientId,
      startDate: range?.start || new Date(0),
      endDate: range?.end || new Date(),
      cacambaIds: uniqueIds.map((id) => new ObjectId(id)),
      status: 'nota_fiscal_pendente',
      createdBy: new ObjectId(String(req.userData?.userId || '')),
    });

    await CacambaModel.updateMany(
      {
        _id: { $in: uniqueIds },
        tipo: 'retirada',
        $or: [
          { paymentStatus: 'pendente' },
          { paymentStatus: { $exists: false } },
          { paymentStatus: null },
        ],
      },
      { $set: { paymentStatus: 'nota_fiscal_pendente', closureGroupId: closureGroup._id } }
    );

    return res.status(200).json({
      closureGroup: {
        _id: closureGroup._id,
        clientSequenceNumber: closureGroup.clientSequenceNumber,
        clientId: closureGroup.clientId,
        status: closureGroup.status,
        invoiceNumber: closureGroup.invoiceNumber || '',
        startDate: closureGroup.startDate,
        endDate: closureGroup.endDate,
      },
      updatedCacambaIds: uniqueIds,
    });
  } catch (error) {
    console.error('Erro ao fechar seleção de caçambas:', error);
    return res.status(500).json({ message: 'Erro ao processar fechamento.' });
  }
});

app.get('/clients/:id/closure-groups', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.query as {
      startDate?: string;
      endDate?: string;
      status?: 'nota_fiscal_pendente' | 'paga' | 'all';
    };
    const hasDateRange = Boolean(startDate && endDate);
    const range = hasDateRange ? buildClosureDateRange(startDate, endDate) : null;
    if (hasDateRange && !range) {
      return res.status(400).json({ message: 'Período de datas inválido.' });
    }
    const groupQuery: any = {
      $or: buildClosureGroupClientMatch(id),
    };
    if (range) {
      groupQuery.startDate = { $gte: range.start };
      groupQuery.endDate = { $lte: range.end };
    }
    if (status && status !== 'all') {
      groupQuery.status = status;
    }
    const groups = await ClosureGroupModel.find(groupQuery)
      .populate('cacambaIds')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(groups);
  } catch (error) {
    console.error('Erro ao buscar grupos de fechamento:', error);
    return res.status(500).json({ message: 'Erro ao buscar grupos de fechamento.' });
  }
});

app.patch('/closure-groups/:id/invoice', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceNumber } = req.body as { invoiceNumber?: string };
    const normalizedInvoice = String(invoiceNumber || '').trim();
    if (!normalizedInvoice) {
      return res.status(400).json({ message: 'Número da nota fiscal é obrigatório.' });
    }

    const group = await ClosureGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Grupo de fechamento não encontrado.' });
    }

    const duplicateInvoiceGroup = await ClosureGroupModel.findOne({
      _id: { $ne: group._id },
      invoiceNumber: {
        $regex: `^${escapeRegExp(normalizedInvoice)}$`,
        $options: 'i',
      },
    }).select('_id');
    if (duplicateInvoiceGroup) {
      return res.status(409).json({ message: 'Número da nota fiscal já utilizado em outro fechamento.' });
    }

    group.invoiceNumber = normalizedInvoice;
    const shouldMarkAsPaid = group.status !== 'paga';
    if (shouldMarkAsPaid) {
      group.status = 'paga';
    }
    await group.save();

    if (shouldMarkAsPaid) {
      await CacambaModel.updateMany(
        { _id: { $in: group.cacambaIds } },
        { $set: { paymentStatus: 'paga' } }
      );
    }

    return res.status(200).json({
      closureGroup: {
        _id: group._id,
        clientSequenceNumber: group.clientSequenceNumber,
        status: group.status,
        invoiceNumber: group.invoiceNumber,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar NF do grupo:', error);
    return res.status(500).json({ message: 'Erro ao salvar nota fiscal do grupo.' });
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

export { app, server };
