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

export const createClosureDownload = async (
  body: {
    clientId?: string;
    startDate?: string;
    endDate?: string;
    selectedCacambaIds?: string[];
  },
  userId: string,
) => {
  const { clientId, startDate, endDate, selectedCacambaIds } = body;

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

  const closureGroup = await ClosureGroupModel.create({
    clientSequenceNumber: nextClientSequenceNumber,
    clientId,
    startDate: range?.start || new Date(0),
    endDate: range?.end || new Date(),
    cacambaIds: uniqueIds.map((id) => new ObjectId(id)),
    status: 'nota_fiscal_pendente',
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
    { $set: { paymentStatus: 'nota_fiscal_pendente', closureGroupId: closureGroup._id } },
  );

  return {
    status: 200,
    body: {
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
