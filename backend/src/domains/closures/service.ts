import { ObjectId } from 'mongodb';
import { ClosureGroupModel } from '../../models/ClosureGroup';
import { CacambaModel } from '../../models/Cacamba';
import { OrderModel } from '../../models/Order';
import {
  buildClientIdMatch,
  buildClosureDateRange,
  buildClosureOrdersQuery,
  escapeRegExp,
  getNextClosureGroupSequence,
} from './helpers';
import { buildPixCopyPaste, isCnpjPixKey } from '../../utils/pix';

export const createClosureDownload = async (
  body: {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    selectedCacambaIds?: string[];
    paymentMethod?: 'invoice' | 'pix';
  },
  userId: string,
) => {
  const { clientId, startDate, endDate, selectedCacambaIds } = body;
  const paymentMethod = body.paymentMethod === 'pix' ? 'pix' : 'invoice';

  if (!clientId || !Array.isArray(selectedCacambaIds) || selectedCacambaIds.length === 0) {
    return { status: 400, body: { message: 'clientId e selectedCacambaIds são obrigatórios.' } };
  }

  const uniqueIds = Array.from(new Set(selectedCacambaIds.map((id) => String(id).trim()).filter(Boolean)));
  if (!uniqueIds.length) {
    return { status: 400, body: { message: 'Nenhuma caçamba válida foi selecionada.' } };
  }

  const hasDateRange = Boolean(startDate && endDate);
  const range = hasDateRange ? buildClosureDateRange(startDate, endDate) : null;
  if (hasDateRange && !range) {
    return { status: 400, body: { message: 'Período de datas inválido.' } };
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
    const cacamba = cacambasById.get(id);
    return !cacamba || cacamba.tipo !== 'retirada' || (cacamba.paymentStatus || 'pendente') !== 'pendente';
  });
  if (notFoundOrInvalid.length > 0) {
    return {
      status: 400,
      body: { message: 'Seleção contém caçambas inválidas, fora do período ou já agrupadas/pagas.' },
    };
  }

  const nextClientSequenceNumber = await getNextClosureGroupSequence(clientId);
  const selectedCacambas = uniqueIds.map((id) => cacambasById.get(id));
  const totalAmount = selectedCacambas.reduce((sum, cacamba) => {
    const price = Number(cacamba?.price);
    return Number.isFinite(price) ? sum + price : sum;
  }, 0);
  if (paymentMethod === 'pix' && totalAmount <= 0) {
    return { status: 400, body: { message: 'O fechamento Pix deve possuir valor total maior que zero.' } };
  }

  const pixKey = String(process.env.PIX_KEY || '14.071.560/0001-41').trim();
  if (paymentMethod === 'pix' && !isCnpjPixKey(pixKey)) {
    return {
      status: 503,
      body: { message: 'A chave Pix CNPJ da empresa não está configurada corretamente.' },
    };
  }
  const pixTxid = paymentMethod === 'pix'
    ? `CC${String(clientId).slice(-8)}G${nextClientSequenceNumber}`.replace(/[^A-Za-z0-9]/g, '').slice(0, 25)
    : undefined;
  const pixCopyPaste = paymentMethod === 'pix'
    ? buildPixCopyPaste({
        key: pixKey,
        amount: totalAmount,
        txid: pixTxid!,
        merchantName: process.env.PIX_MERCHANT_NAME || 'CENTRAL CACAMBAS',
        merchantCity: process.env.PIX_MERCHANT_CITY || 'SAO JOSE CAMPOS',
      })
    : undefined;
  const pendingStatus = paymentMethod === 'pix' ? 'pix_pendente' : 'nota_fiscal_pendente';

  const closureGroup = await ClosureGroupModel.create({
    clientSequenceNumber: nextClientSequenceNumber,
    clientId,
    startDate: range?.start || new Date(0),
    endDate: range?.end || new Date(),
    cacambaIds: uniqueIds.map((id) => new ObjectId(id)),
    status: pendingStatus,
    paymentMethod,
    totalAmount,
    pixCopyPaste,
    pixTxid,
    createdBy: new ObjectId(String(userId || '')),
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
    { $set: { paymentStatus: pendingStatus, closureGroupId: closureGroup._id } },
  );

  return {
    status: 200,
    body: {
      closureGroup: {
        _id: closureGroup._id,
        clientSequenceNumber: closureGroup.clientSequenceNumber,
        clientId: closureGroup.clientId,
        status: closureGroup.status,
        paymentMethod: closureGroup.paymentMethod,
        invoiceNumber: closureGroup.invoiceNumber || '',
        totalAmount: closureGroup.totalAmount,
        pixCopyPaste: closureGroup.pixCopyPaste || '',
        pixTxid: closureGroup.pixTxid || '',
        startDate: closureGroup.startDate,
        endDate: closureGroup.endDate,
      },
      updatedCacambaIds: uniqueIds,
    },
  };
};

export const saveClosureGroupInvoice = async (id: string, invoiceNumber?: string) => {
  const normalizedInvoice = String(invoiceNumber || '').trim();
  if (!normalizedInvoice) {
    return { status: 400, body: { message: 'Número da nota fiscal é obrigatório.' } };
  }

  const group = await ClosureGroupModel.findById(id);
  if (!group) {
    return { status: 404, body: { message: 'Grupo de fechamento não encontrado.' } };
  }
  if (group.paymentMethod === 'pix' || group.status === 'pix_pendente') {
    return { status: 400, body: { message: 'Este fechamento é Pix e não aceita número de nota fiscal.' } };
  }

  const duplicateInvoiceGroup = await ClosureGroupModel.findOne({
    _id: { $ne: group._id },
    invoiceNumber: {
      $regex: `^${escapeRegExp(normalizedInvoice)}$`,
      $options: 'i',
    },
  }).select('_id');
  if (duplicateInvoiceGroup) {
    return { status: 409, body: { message: 'Número da nota fiscal já utilizado em outro fechamento.' } };
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
      { $set: { paymentStatus: 'paga' } },
    );
  }

  return {
    status: 200,
    body: {
      closureGroup: {
        _id: group._id,
        clientSequenceNumber: group.clientSequenceNumber,
        status: group.status,
        invoiceNumber: group.invoiceNumber,
      },
    },
  };
};

export const markPixClosureGroupPaid = async (id: string) => {
  const group = await ClosureGroupModel.findById(id);
  if (!group) {
    return { status: 404, body: { message: 'Grupo de fechamento não encontrado.' } };
  }
  if (group.paymentMethod !== 'pix') {
    return { status: 400, body: { message: 'Somente fechamentos Pix podem usar esta confirmação.' } };
  }
  if (group.status !== 'paga') {
    group.status = 'paga';
    await group.save();
    await CacambaModel.updateMany(
      { _id: { $in: group.cacambaIds } },
      { $set: { paymentStatus: 'paga' } },
    );
  }
  return {
    status: 200,
    body: {
      closureGroup: {
        _id: group._id,
        clientSequenceNumber: group.clientSequenceNumber,
        status: group.status,
        paymentMethod: group.paymentMethod,
        totalAmount: group.totalAmount,
        pixCopyPaste: group.pixCopyPaste,
        pixTxid: group.pixTxid,
      },
    },
  };
};

export const reopenClosureGroupCacamba = async (groupId: string, cacambaId: string) => {
  const group = await ClosureGroupModel.findById(groupId);
  if (!group) {
    return { status: 404, body: { message: 'Grupo de fechamento não encontrado.' } };
  }

  const groupCacambaIds = (group.cacambaIds || []).map((id) => String(id));
  if (!groupCacambaIds.includes(String(cacambaId))) {
    return { status: 400, body: { message: 'Caçamba não pertence a este grupo de fechamento.' } };
  }

  const cacamba = await CacambaModel.findById(cacambaId);
  if (!cacamba) {
    return { status: 404, body: { message: 'Caçamba não encontrada.' } };
  }

  const remainingIds = groupCacambaIds.filter((id) => id !== String(cacambaId));
  let deletedGroup = false;

  if (remainingIds.length === 0) {
    await ClosureGroupModel.deleteOne({ _id: group._id });
    deletedGroup = true;
  } else {
    group.cacambaIds = remainingIds.map((id) => new ObjectId(id)) as any;
    const remainingCacambas = await CacambaModel.find({ _id: { $in: remainingIds } }).lean();
    if (!(group.paymentMethod === 'pix' && group.status === 'paga')) {
      group.totalAmount = remainingCacambas.reduce((sum, item: any) => {
        const price = Number(item.price);
        return Number.isFinite(price) ? sum + price : sum;
      }, 0);
    }
    if (group.paymentMethod === 'pix' && group.status === 'pix_pendente') {
      group.pixCopyPaste = buildPixCopyPaste({
        key: String(process.env.PIX_KEY || '14.071.560/0001-41'),
        amount: group.totalAmount,
        txid: group.pixTxid || `CCG${group.clientSequenceNumber}`,
        merchantName: process.env.PIX_MERCHANT_NAME || 'CENTRAL CACAMBAS',
        merchantCity: process.env.PIX_MERCHANT_CITY || 'SAO JOSE CAMPOS',
      });
    }
    await group.save();
  }

  cacamba.paymentStatus = 'pendente';
  cacamba.closureGroupId = undefined;
  await cacamba.save();

  return {
    status: 200,
    body: {
      cacamba,
      closureGroup: deletedGroup
        ? null
        : {
            _id: group._id,
            clientSequenceNumber: group.clientSequenceNumber,
            clientId: group.clientId,
            status: group.status,
            paymentMethod: group.paymentMethod,
            invoiceNumber: group.invoiceNumber || '',
            totalAmount: group.totalAmount,
            pixCopyPaste: group.pixCopyPaste || '',
            pixTxid: group.pixTxid || '',
            startDate: group.startDate,
            endDate: group.endDate,
            cacambaIds: remainingIds,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          },
      deletedGroup,
    },
  };
};
