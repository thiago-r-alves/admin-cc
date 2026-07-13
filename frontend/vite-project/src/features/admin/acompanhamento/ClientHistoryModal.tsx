import { useMemo, useState } from 'react';
import type { ICacamba, IOrder } from '../../../interfaces';
import { apiUrl } from '../../../services/api';
import { cn } from '../../../utils/cn';
import { formatOrderAddress } from '../admin.helpers';
import {
  AcompanhamentoImage,
  EmptyState,
  InfoGrid,
  InfoLabel,
  InfoTile,
  InfoValue,
  OrderDetailsDivider,
  SummaryBadge,
} from '../admin.styles';

type HistorySortMode = 'newest' | 'oldest';

type ClientHistoryModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  clientName: string;
  orders: IOrder[];
  onClose: () => void;
  onOpenImage: (url: string) => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
};

const getOrderTime = (order: IOrder) => {
  const time = new Date(order.createdAt || order.updatedAt || '').getTime();
  return Number.isFinite(time) ? time : 0;
};

const getDriverName = (order: IOrder) => {
  const driver = order.motorista;
  if (!driver) return '-';
  if (typeof driver === 'string') return driver;
  return driver.username || '-';
};

const getImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : `${apiUrl}${imageUrl}`;
};

const formatOrderType = (type: IOrder['type']) => (type === 'entrega' ? 'Entrega' : 'Retirada');

const formatOrderStatus = (status: IOrder['status']) => {
  if (status === 'pendente') return 'Pendente';
  if (status === 'em_andamento') return 'Em andamento';
  if (status === 'concluido') return 'Concluído';
  if (status === 'cancelado') return 'Cancelado';
  return '-';
};

const formatLocal = (local?: string) => {
  if (local === 'via_publica') return 'Via pública';
  if (local === 'canteiro_obra') return 'Canteiro de obra';
  return '-';
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const ClientHistoryModal = ({
  open,
  loading,
  error,
  clientName,
  orders,
  onClose,
  onOpenImage,
}: ClientHistoryModalProps) => {
  const [sortMode, setSortMode] = useState<HistorySortMode>('newest');
  const hasOrders = orders.length > 0;
  const sortedOrders = useMemo(() => {
    const nextOrders = [...orders];
    return nextOrders.sort((a, b) => {
      const comparison = getOrderTime(a) - getOrderTime(b);
      return sortMode === 'oldest' ? comparison : -comparison;
    });
  }, [orders, sortMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex justify-end bg-[rgba(17,24,39,0.62)]" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-history-title"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-[min(820px,96vw)] flex-col overflow-hidden bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
      >
        <header className="border-b border-red-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="client-history-title" className="m-0 text-[1.12rem] font-black text-gray-900">
                Histórico do cliente {clientName ? `- ${clientName}` : ''}
              </h3>
              <p className="m-0 mt-1 text-[0.86rem] text-gray-500">
                Histórico completo de pedidos encontrados para o cliente selecionado.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 min-w-9 cursor-pointer rounded-ui-md border border-gray-300 bg-white px-3 text-[1rem] font-black text-gray-700 hover:border-brand hover:text-brand"
              aria-label="Fechar histórico do cliente"
            >
              &times;
            </button>
          </div>

          {!loading && !error && (
            <div className="mt-4 flex flex-wrap gap-2">
              <SummaryBadge>Total de pedidos: {orders.length}</SummaryBadge>
            </div>
          )}

          {hasOrders && (
            <div className="mt-4 grid max-w-[320px] gap-[0.28rem]">
              <label
                htmlFor="historico-cliente-ordem"
                className="text-[0.72rem] font-extrabold uppercase tracking-[0.05em] text-gray-500"
              >
                Ordenar histórico
              </label>
              <select
                id="historico-cliente-ordem"
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as HistorySortMode)}
                className="box-border w-full rounded-ui-lg border border-red-200 bg-white px-[0.8rem] py-[0.72rem] text-[0.88rem] text-gray-700 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus"
              >
                <option value="newest">Mais recente primeiro</option>
                <option value="oldest">Mais antigo primeiro</option>
              </select>
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading && <EmptyState>Carregando histórico do cliente...</EmptyState>}
          {!loading && error && <EmptyState>{error}</EmptyState>}
          {!loading && !error && !hasOrders && (
            <EmptyState>Nenhum histórico encontrado para este cliente.</EmptyState>
          )}
          {!loading && !error && hasOrders && (
            <div className="grid gap-4">
              {sortedOrders.map((order, index) => (
                <article
                  key={order._id}
                  className="relative rounded-lg border border-red-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                  data-testid={`client-history-order-${order._id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-full text-[0.78rem] font-black text-white',
                          order.type === 'entrega' ? 'bg-green-600' : 'bg-brand',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <strong className="block text-[0.98rem] uppercase text-gray-900">
                          {formatOrderType(order.type)}
                        </strong>
                        <span className="text-[0.82rem] text-gray-500">
                          {formatDateTime(order.createdAt || order.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <SummaryBadge>OS digital: {order.orderNumber ?? '-'}</SummaryBadge>
                  </div>

                  <InfoGrid>
                    <InfoTile>
                      <InfoLabel>Status</InfoLabel>
                      <InfoValue>{formatOrderStatus(order.status)}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Motorista</InfoLabel>
                      <InfoValue>{getDriverName(order)}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Placa</InfoLabel>
                      <InfoValue style={{ textTransform: 'uppercase' }}>{order.placa || '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Contato</InfoLabel>
                      <InfoValue>{[order.contactName, order.contactNumber].filter(Boolean).join(' - ') || '-'}</InfoValue>
                    </InfoTile>
                    <InfoTile>
                      <InfoLabel>Endereço</InfoLabel>
                      <InfoValue>{formatOrderAddress(order)}</InfoValue>
                    </InfoTile>
                  </InfoGrid>

                  <OrderDetailsDivider />
                  <InfoLabel>Caçambas vinculadas</InfoLabel>
                  {(order.cacambas || []).length ? (
                    <div className="mt-2 grid gap-3">
                      {(order.cacambas || []).map((cacamba: ICacamba) => {
                        const imageUrl = getImageUrl(cacamba.imageUrl);
                        return (
                          <div
                            key={cacamba._id}
                            className="rounded-lg border border-gray-200 bg-[#f8fafc] p-3"
                          >
                            <InfoGrid>
                              <InfoTile>
                                <InfoLabel>Nº caçamba</InfoLabel>
                                <InfoValue>#{cacamba.numero || '-'}</InfoValue>
                              </InfoTile>
                              <InfoTile>
                                <InfoLabel>Movimento</InfoLabel>
                                <InfoValue>{formatOrderType(cacamba.tipo)}</InfoValue>
                              </InfoTile>
                              <InfoTile>
                                <InfoLabel>Data/hora</InfoLabel>
                                <InfoValue>{formatDateTime(cacamba.createdAt)}</InfoValue>
                              </InfoTile>
                              <InfoTile>
                                <InfoLabel>Local</InfoLabel>
                                <InfoValue>{formatLocal(cacamba.local)}</InfoValue>
                              </InfoTile>
                              <InfoTile>
                                <InfoLabel>Conteúdo</InfoLabel>
                                <InfoValue>{cacamba.contentType || '-'}</InfoValue>
                              </InfoTile>
                              <InfoTile>
                                <InfoLabel>Valor</InfoLabel>
                                <InfoValue>{formatCurrency(cacamba.price)}</InfoValue>
                              </InfoTile>
                              {imageUrl && (
                                <InfoTile>
                                  <InfoLabel>Imagem da caçamba</InfoLabel>
                                  <div className="mt-2">
                                    <AcompanhamentoImage
                                      src={imageUrl}
                                      alt="Foto da caçamba no histórico do cliente"
                                      onClick={() => onOpenImage(imageUrl)}
                                    />
                                  </div>
                                </InfoTile>
                              )}
                            </InfoGrid>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 rounded-md border border-dashed border-gray-300 bg-white p-3 text-[0.86rem] text-gray-500">
                      Nenhuma caçamba vinculada a este pedido.
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
