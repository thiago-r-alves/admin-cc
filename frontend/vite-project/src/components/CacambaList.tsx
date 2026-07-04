import React from 'react';
import type { DriverRef, ICacamba } from '../interfaces';
import { twComponent } from '../utils/twComponent';
import { cn } from '../utils/cn';
import {
  hasValidContentType as hasClosureValidContentType,
  hasValidPrice as hasClosureValidPrice,
  isEligibleForClosureSelection,
  isPendingClosurePayment,
} from './clientOrdersModal/helpers';

const EmptyState = twComponent('div', 'py-4 text-center text-gray-500');
const Container = twComponent('div', 'flex flex-col gap-3');
const Title = twComponent('h3', 'm-0 text-[1.05rem] font-black text-gray-950');
const CacambaCard = twComponent('div', 'rounded-lg border border-red-200 bg-slate-50 px-[0.85rem] py-[0.78rem]');
const CardContent = twComponent('div', 'mb-[0.72rem] flex items-start justify-between gap-3');
const InfoSection = twComponent('div', 'min-w-0 flex-auto');
const HeaderInfo = twComponent('div', 'flex min-w-0 flex-wrap items-center gap-2');
const SelectionLabel = twComponent('label', 'flex min-h-9 cursor-pointer items-center gap-2 rounded-ui-md border border-gray-300 bg-white px-[0.9rem] py-[0.42rem] text-[0.9rem] font-extrabold text-gray-700');
const SelectionInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input type="checkbox" className={cn('h-4 w-4 cursor-pointer', className)} {...props} />
);
const CacambaNumber: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, style, ...props }) => (
  <span
    className={cn('text-[1.02rem] font-black text-brand', className)}
    style={{ color: 'rgb(227, 6, 19)', ...style }}
    {...props}
  />
);
const TypeBadge = twComponent<'span', { tipo: 'entrega' | 'retirada' }>('span', 'rounded-full px-[0.45rem] py-[0.15rem] text-[0.66rem] font-black uppercase tracking-[0.04em]', ({ tipo }) =>
  tipo === 'entrega' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
);
const PaymentBadge = twComponent('span', 'rounded-full bg-green-100 px-[0.45rem] py-[0.15rem] text-[0.66rem] font-black uppercase tracking-[0.04em] text-green-700');

export type CacambaStatusBadgeTone = 'warning' | 'danger';

const statusBadgeToneClasses: Record<CacambaStatusBadgeTone, string> = {
  warning: 'border-[#f59e0b] bg-[#fffbeb] text-[#92400e]',
  danger: 'border-[#ef4444] bg-[#fef2f2] text-[#991b1b]',
};

const StatusBadge = twComponent<'span', { $tone: CacambaStatusBadgeTone }>(
  'span',
  'inline-flex max-w-full min-w-0 items-center whitespace-normal rounded-full border px-[0.45rem] py-[0.15rem] text-[0.66rem] font-black uppercase leading-tight tracking-[0.04em] [overflow-wrap:anywhere] max-[640px]:basis-full max-[640px]:justify-center max-[640px]:rounded-ui-lg max-[640px]:px-[0.55rem] max-[640px]:py-[0.38rem] max-[640px]:text-center',
  ({ $tone }) => statusBadgeToneClasses[$tone],
);

export type CacambaStatusBadge =
  | string
  | {
      label: string;
      tone?: CacambaStatusBadgeTone;
    };

export interface CacambaResponsibility {
  motorista?: DriverRef;
  driverName?: string;
  placa?: string;
}

const infoTextClass = 'm-0 mt-[0.2rem] text-[0.82rem] leading-[1.35] text-gray-700 [&_strong]:text-gray-950';
const DateInfo = twComponent('p', infoTextClass);
const LocalInfo = twComponent('span', 'mt-[0.18rem] block text-[0.82rem] text-gray-700 [&_strong]:text-gray-950');
const ServiceOrder = twComponent('p', infoTextClass);
const ContentTypeInfo = twComponent('p', infoTextClass);
const PriceInfo = twComponent('p', infoTextClass);
const ResponsibilityInfo = twComponent('p', `${infoTextClass} flex flex-wrap gap-[0.55rem]`);
const BlockedWarning = twComponent('div', 'mt-2 whitespace-pre-line rounded-ui-lg border border-red-300 bg-red-50 px-[0.7rem] py-[0.55rem] text-[0.9rem] font-bold text-red-900');
const ImageContainer = twComponent('div', 'ml-[0.35rem] flex-none');
const CacambaImage = twComponent('img', 'h-[66px] w-[66px] rounded-ui-md border border-gray-300 bg-white object-cover');
const ActionRow = twComponent('div', 'flex flex-wrap gap-2');
const ActionButton = twComponent<'button', { $variant?: 'danger' | 'secondary' }>('button', 'cursor-pointer rounded-ui-md border px-[0.9rem] py-[0.42rem] text-[0.9rem] font-extrabold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[background,box-shadow] duration-200', ({ $variant }) =>
  $variant === 'danger'
    ? 'border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover'
    : 'border-gray-300 bg-white text-gray-700 hover:border-brand hover:bg-brand-soft hover:text-brand',
);

interface CacambaListProps {
  cacambas: ICacamba[];
  onImageClick?: (url: string) => void;
  onEdit?: (cacamba: ICacamba) => void;
  editLabel?: string;
  onDelete?: (cacambaId: string) => void;
  showTitle?: boolean;
  showTypeBadge?: boolean;
  adminMetaActions?: boolean;
  canEditPrice?: boolean;
  onEditContentType?: (cacamba: ICacamba) => void;
  onEditPrice?: (cacamba: ICacamba) => void;
  selectable?: boolean;
  selectedCacambaIds?: string[];
  onToggleSelect?: (cacamba: ICacamba, checked: boolean) => void;
  onReturnToPending?: (cacamba: ICacamba) => void;
  showDeliveryDateForRetirada?: boolean;
  statusBadges?: Record<string, CacambaStatusBadge | CacambaStatusBadge[]>;
  responsibility?: CacambaResponsibility;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString('pt-BR');
};

const buildImageUrl = (apiUrl: string, imageUrl: string) =>
  imageUrl.startsWith('http') ? imageUrl : `${apiUrl}${imageUrl}`;

const normalizeStatusBadges = (badges?: CacambaStatusBadge | CacambaStatusBadge[]) => {
  if (!badges) return [];
  const list = Array.isArray(badges) ? badges : [badges];
  return list.map((badge) =>
    typeof badge === 'string'
      ? { label: badge, tone: 'warning' as const }
      : { label: badge.label, tone: badge.tone ?? 'warning' },
  );
};

const isObjectIdLike = (value: string) => /^[a-f0-9]{24}$/i.test(value);

const getDriverName = (motorista?: DriverRef, explicitDriverName?: string) => {
  const explicit = String(explicitDriverName || '').trim();
  if (explicit) return explicit;
  if (!motorista) return '';
  if (typeof motorista === 'string') {
    const value = motorista.trim();
    return isObjectIdLike(value) ? '' : value;
  }
  return String(motorista.username || '').trim();
};

const getCacambaResponsibility = (
  cacamba: ICacamba,
  fallback?: CacambaResponsibility,
) => {
  const action =
    cacamba.tipo === 'retirada' ? cacamba.closureWithdrawal : cacamba.closureDelivery;
  const driverName = getDriverName(fallback?.motorista, action?.driverName || fallback?.driverName);
  const placa = String(action?.placa || fallback?.placa || '').trim().toUpperCase();
  return { driverName, placa };
};

const CacambaList: React.FC<CacambaListProps> = ({
  cacambas,
  onImageClick,
  onEdit,
  editLabel = 'Editar',
  onDelete,
  showTitle = true,
  showTypeBadge = true,
  adminMetaActions = false,
  canEditPrice = false,
  onEditContentType,
  onEditPrice,
  selectable = false,
  selectedCacambaIds = [],
  onToggleSelect,
  onReturnToPending,
  showDeliveryDateForRetirada = false,
  statusBadges,
  responsibility,
}) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const requestedThumbsRef = React.useRef<Set<string>>(new Set());
  const [thumbs, setThumbs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;

    cacambas.forEach((cacamba) => {
      if (!cacamba.imageUrl) return;

      const thumbKey = `${cacamba._id}:${cacamba.imageUrl}`;
      if (requestedThumbsRef.current.has(thumbKey)) return;

      requestedThumbsRef.current.add(thumbKey);
      const full = buildImageUrl(apiUrl, cacamba.imageUrl);

      import('../utils/image')
        .then(({ resizeImage }) => resizeImage(full, 66, 1))
        .then((result) => {
          if (cancelled) return;
          setThumbs((prev) => (prev[thumbKey] ? prev : { ...prev, [thumbKey]: result }));
        })
        .catch((error: unknown) => {
          requestedThumbsRef.current.delete(thumbKey);
          console.error(error);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [cacambas, apiUrl]);

  if (cacambas.length === 0) {
    return <EmptyState>Nenhuma caçamba registrada ainda</EmptyState>;
  }

  return (
    <Container>
      {showTitle && <Title>Caçambas Registradas:</Title>}

      {cacambas.map((cacamba) => {
        const isRetirada = cacamba.tipo === 'retirada';
        const isEntrega = cacamba.tipo === 'entrega';
        const isPaid = cacamba.paymentStatus === 'paga';
        const isPendingClosure = isPendingClosurePayment(cacamba);
        const hasValidPrice = hasClosureValidPrice(cacamba);
        const hasValidContentType = hasClosureValidContentType(cacamba);

        const missingValue = (isRetirada || isEntrega) && !hasValidPrice;
        const missingContentType = isRetirada && !hasValidContentType;
        const isSelectableInClosure = selectable && isEligibleForClosureSelection(cacamba);
        const deliveryDate = formatDateTime(cacamba.closureDelivery?.date);

        let warningText = '';
        if (selectable && isPendingClosure && (isRetirada || isEntrega) && (missingValue || missingContentType)) {
          if (missingValue && missingContentType) {
            warningText = 'Caçamba sem valor e tipo de conteúdo definidos.\nDefina os dados para liberar o pagamento.';
          } else if (missingValue) {
            warningText = 'Caçamba sem valor definido.\nDefina os dados para liberar o pagamento.';
          } else {
            warningText = 'Caçamba sem tipo de conteúdo definido.\nDefina os dados para liberar o pagamento.';
          }
        }

        const imageUrl = cacamba.imageUrl ? buildImageUrl(apiUrl, cacamba.imageUrl) : null;
        const thumbKey = cacamba.imageUrl ? `${cacamba._id}:${cacamba.imageUrl}` : '';
        const currentStatusBadges = normalizeStatusBadges(statusBadges?.[cacamba._id]);
        const responsible = getCacambaResponsibility(cacamba, responsibility);
        const hasResponsibleInfo = Boolean(responsible.driverName || responsible.placa);

        return (
          <CacambaCard key={cacamba._id}>
            <CardContent>
              <InfoSection>
                <HeaderInfo>
                  <CacambaNumber>#{cacamba.numero}</CacambaNumber>
                  {showTypeBadge && (
                    <TypeBadge tipo={cacamba.tipo}>
                      {cacamba.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
                    </TypeBadge>
                  )}
                  {isPaid && <PaymentBadge>Paga</PaymentBadge>}
                  {currentStatusBadges.map((badge, index) => (
                    <StatusBadge
                      key={`${badge.tone}-${badge.label}`}
                      $tone={badge.tone}
                      data-testid={`cacamba-status-badge-${cacamba._id}-${index}`}
                    >
                      {badge.label}
                    </StatusBadge>
                  ))}
                </HeaderInfo>

                {showDeliveryDateForRetirada && isRetirada && (
                  <DateInfo>
                    <strong>Entregue em:</strong> {deliveryDate || 'Data não disponível'}
                  </DateInfo>
                )}

                <DateInfo>
                  {isRetirada ? <strong>Retirada em:</strong> : <strong>Entregue em:</strong>}{' '}
                  {cacamba.createdAt
                    ? new Date(cacamba.createdAt).toLocaleString('pt-BR')
                    : 'Data não disponível'}
                </DateInfo>

                {cacamba.local && (
                  <LocalInfo>
                    <strong>Local:</strong>{' '}
                    {cacamba.local === 'via_publica'
                      ? 'Via pública'
                      : cacamba.local === 'canteiro_obra'
                        ? 'Canteiro de obra'
                        : cacamba.local}
                  </LocalInfo>
                )}

                {cacamba.horaServicoDigitos && (
                  <ServiceOrder>
                    <strong>Ordem de serviço:</strong> {cacamba.horaServicoDigitos}
                  </ServiceOrder>
                )}

                {hasResponsibleInfo && (
                  <ResponsibilityInfo>
                    <span>
                      <strong>Motorista:</strong> {responsible.driverName || '-'}
                    </span>
                    <span>
                      <strong>Placa:</strong> {responsible.placa || '-'}
                    </span>
                  </ResponsibilityInfo>
                )}

                {cacamba.contentType && (
                  <ContentTypeInfo>
                    <strong>Conteúdo:</strong> {cacamba.contentType}
                  </ContentTypeInfo>
                )}

                {hasValidPrice && (
                  <PriceInfo>
                    <strong>Valor:</strong>{' '}
                    {cacamba.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </PriceInfo>
                )}

                {warningText && <BlockedWarning>{warningText}</BlockedWarning>}
              </InfoSection>

              <ImageContainer>
                {cacamba.imageUrl ? (
                  <CacambaImage
                    src={thumbs[thumbKey] || imageUrl || cacamba.imageUrl}
                    alt="Foto da caçamba"
                    loading="lazy"
                    decoding="async"
                    onClick={async () => {
                      if (onImageClick && imageUrl) {
                        try {
                          const mod = await import('../utils/image');
                          const large = await mod.resizeImage(imageUrl, 1200, 0.8);
                          onImageClick(large);
                        } catch (e) {
                          console.error('Erro redimensionando imagem:', e);
                          onImageClick(imageUrl);
                        }
                      }
                    }}
                  />
                ) : null}
              </ImageContainer>
            </CardContent>

            <ActionRow>
              {selectable && isSelectableInClosure && (
                <SelectionLabel>
                  <SelectionInput
                    checked={selectedCacambaIds.includes(cacamba._id)}
                    onChange={(event) => onToggleSelect?.(cacamba, event.target.checked)}
                    aria-label="Selecionar para pagamento"
                  />
                  Selecionar para pagamento
                </SelectionLabel>
              )}
              {onEdit && (
                <ActionButton $variant="secondary" onClick={() => onEdit(cacamba)}>
                  {editLabel}
                </ActionButton>
              )}
              {!selectable && onDelete && (
                <ActionButton $variant="danger" onClick={() => onDelete(cacamba._id)}>
                  Excluir
                </ActionButton>
              )}
              {!selectable && onReturnToPending && (
                <ActionButton
                  $variant="secondary"
                  onClick={() => onReturnToPending(cacamba)}
                >
                  Voltar para pendente
                </ActionButton>
              )}
              {selectable && isRetirada && isPendingClosure && missingContentType && onEditContentType && (
                <ActionButton $variant="secondary" onClick={() => onEditContentType(cacamba)}>
                  Adicionar conteúdo
                </ActionButton>
              )}
              {selectable && (isRetirada || isEntrega) && isPendingClosure && missingValue && onEditPrice && (
                <ActionButton $variant="secondary" onClick={() => onEditPrice(cacamba)}>
                  Adicionar valor
                </ActionButton>
              )}
              {!selectable && adminMetaActions && isRetirada && onEditContentType && (
                <ActionButton $variant="secondary" onClick={() => onEditContentType(cacamba)}>
                  Editar conteúdo
                </ActionButton>
              )}
              {!selectable && adminMetaActions && canEditPrice && (isRetirada || isEntrega) && onEditPrice && (
                <ActionButton $variant="secondary" onClick={() => onEditPrice(cacamba)}>
                  {typeof cacamba.price === 'number' ? 'Editar valor' : 'Adicionar valor'}
                </ActionButton>
              )}
            </ActionRow>
          </CacambaCard>
        );
      })}
    </Container>
  );
};

export default CacambaList;
