import { useMemo, useState } from 'react';
import type { ICacambaTrackEvent, ICacambaTrackResponse } from '../../../interfaces';
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

type CacambaTrackModalProps = {
  open: boolean;
  loading: boolean;
  error: string | null;
  track: ICacambaTrackResponse | null;
  onClose: () => void;
  onOpenImage: (url: string) => void;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
};

const getEventTime = (event: ICacambaTrackEvent) => {
  const time = new Date(event.createdAt).getTime();
  return Number.isFinite(time) ? time : 0;
};

const formatLocal = (local?: string) => {
  if (local === 'via_publica') return 'Via pública';
  if (local === 'canteiro_obra') return 'Canteiro de obra';
  return '-';
};

const formatTrackStatus = (status: ICacambaTrackResponse['currentStatus']) => {
  if (status === 'em_obra') return 'Em obra';
  if (status === 'retirada') return 'Retirada';
  return 'Sem registros';
};

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const getDriverName = (event: ICacambaTrackEvent) => {
  const driver = event.order?.motorista;
  if (!driver) return '-';
  if (typeof driver === 'string') return driver;
  return driver.username || '-';
};

const getImageUrl = (imageUrl?: string) => {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : `${apiUrl}${imageUrl}`;
};

const getTrackAddress = (event: ICacambaTrackEvent) => {
  if (!event.order) return '-';
  return formatOrderAddress({
    _id: event.order._id,
    orderNumber: event.order.orderNumber,
    clientName: event.order.clientName,
    cnpjCpf: event.order.cnpjCpf,
    contactName: event.order.contactName || '',
    contactNumber: event.order.contactNumber || '',
    neighborhood: event.order.neighborhood || '',
    address: event.order.address || '',
    addressNumber: event.order.addressNumber || '',
    city: event.order.city,
    cep: event.order.cep,
    type: event.order.type,
    priority: 0,
    status: event.order.status,
  });
};

export const CacambaTrackModal = ({
  open,
  loading,
  error,
  track,
  onClose,
  onOpenImage,
}: CacambaTrackModalProps) => {
  const [sortMode, setSortMode] = useState<HistorySortMode>('newest');
  const hasEvents = Boolean(track?.events.length);
  const sortedEvents = useMemo(() => {
    const events = [...(track?.events || [])];
    return events.sort((a, b) => {
      const comparison = getEventTime(a) - getEventTime(b);
      return sortMode === 'oldest' ? comparison : -comparison;
    });
  }, [sortMode, track?.events]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex justify-end bg-[rgba(17,24,39,0.62)]" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cacamba-track-title"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-[min(760px,96vw)] flex-col overflow-hidden bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
      >
        <header className="border-b border-red-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="cacamba-track-title" className="m-0 text-[1.12rem] font-black text-gray-900">
                Histórico da caçamba {track?.numero ? `#${track.numero}` : ''}
              </h3>
              <p className="m-0 mt-1 text-[0.86rem] text-gray-500">
                Histórico completo de registros encontrados para o número pesquisado.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 min-w-9 cursor-pointer rounded-ui-md border border-gray-300 bg-white px-3 text-[1rem] font-black text-gray-700 hover:border-brand hover:text-brand"
              aria-label="Fechar histórico da caçamba"
            >
              &times;
            </button>
          </div>

          {track && (
            <div className="mt-4 flex flex-wrap gap-2">
              <SummaryBadge>Status: {formatTrackStatus(track.currentStatus)}</SummaryBadge>
              <SummaryBadge>Total: {track.total}</SummaryBadge>
              <SummaryBadge>Primeiro: {formatDateTime(track.firstRegisteredAt)}</SummaryBadge>
              <SummaryBadge>Atual: {formatDateTime(track.lastRegisteredAt)}</SummaryBadge>
            </div>
          )}

          {hasEvents && (
            <div className="mt-4 grid max-w-[320px] gap-[0.28rem]">
              <label
                htmlFor="historico-cacamba-ordem"
                className="text-[0.72rem] font-extrabold uppercase tracking-[0.05em] text-gray-500"
              >
                Ordenar histórico
              </label>
              <select
                id="historico-cacamba-ordem"
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
          {loading && <EmptyState>Carregando histórico da caçamba...</EmptyState>}
          {!loading && error && <EmptyState>{error}</EmptyState>}
          {!loading && !error && track && !hasEvents && (
            <EmptyState>Nenhum histórico encontrado para esta caçamba.</EmptyState>
          )}
          {!loading && !error && track && hasEvents && (
            <div className="grid gap-4">
              {sortedEvents.map((event, index) => {
                const imageUrl = getImageUrl(event.imageUrl);
                return (
                  <article
                    key={event._id}
                    className="relative rounded-lg border border-red-100 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                    data-testid={`cacamba-track-event-${event._id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full text-[0.78rem] font-black text-white',
                            event.tipo === 'entrega' ? 'bg-green-600' : 'bg-brand',
                          )}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <strong className="block text-[0.98rem] uppercase text-gray-900">
                            {event.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
                          </strong>
                          <span className="text-[0.82rem] text-gray-500">{formatDateTime(event.createdAt)}</span>
                        </div>
                      </div>
                      <SummaryBadge>OS digital: {event.order?.orderNumber ?? '-'}</SummaryBadge>
                    </div>

                    <InfoGrid>
                      <InfoTile>
                        <InfoLabel>Cliente</InfoLabel>
                        <InfoValue>{event.order?.clientName || '-'}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Contato</InfoLabel>
                        <InfoValue>
                          {[event.order?.contactName, event.order?.contactNumber].filter(Boolean).join(' - ') || '-'}
                        </InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Endereço</InfoLabel>
                        <InfoValue>{getTrackAddress(event)}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Motorista</InfoLabel>
                        <InfoValue>{getDriverName(event)}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Placa</InfoLabel>
                        <InfoValue style={{ textTransform: 'uppercase' }}>{event.order?.placa || '-'}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>OS da caçamba</InfoLabel>
                        <InfoValue>{event.horaServicoDigitos || '-'}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Local</InfoLabel>
                        <InfoValue>{formatLocal(event.local)}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Conteúdo</InfoLabel>
                        <InfoValue>{event.contentType || '-'}</InfoValue>
                      </InfoTile>
                      <InfoTile>
                        <InfoLabel>Valor</InfoLabel>
                        <InfoValue>{formatCurrency(event.price)}</InfoValue>
                      </InfoTile>
                    </InfoGrid>

                    {imageUrl && (
                      <>
                        <OrderDetailsDivider />
                        <InfoLabel>Imagem da caçamba</InfoLabel>
                        <div className="mt-2">
                          <AcompanhamentoImage
                            src={imageUrl}
                            alt="Foto da caçamba no histórico"
                            onClick={() => onOpenImage(imageUrl)}
                          />
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
