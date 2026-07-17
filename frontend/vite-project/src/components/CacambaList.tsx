import React from 'react';
import type { DriverRef, ICacamba } from '../interfaces';
import { twComponent } from '../utils/twComponent';
import { cn } from '../utils/cn';
import { formatDriverName } from '../utils/formatDriverName';
import {
  hasValidContentType as hasClosureValidContentType,
  hasValidPrice as hasClosureValidPrice,
  isEligibleForClosureSelection,
  isPendingClosurePayment,
} from './clientOrdersModal/helpers';

const EmptyState = twComponent('div', 'py-4 text-center text-gray-500');
const Container = twComponent('div', 'flex flex-col gap-3');
const Title = twComponent('h3', 'm-0 text-[1.05rem] font-black text-gray-950');
const CacambaCard = twComponent(
  'article',
  'overflow-hidden rounded-ui-lg border border-gray-200 border-l-[3px] border-l-brand bg-white shadow-[0_5px_16px_rgba(15,23,42,0.05)]',
);
const CardContent = twComponent<'div', { $hasImage: boolean }>(
  'div',
  'grid grid-cols-1 items-start gap-4 p-4 max-[640px]:gap-3 max-[640px]:p-3',
  ({ $hasImage }) => ($hasImage ? 'min-[641px]:grid-cols-[minmax(0,1fr)_92px]' : ''),
);
const InfoSection = twComponent('div', 'min-w-0');
const HeaderInfo = twComponent(
  'div',
  'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-gray-100 pb-3',
);
const SelectionLabel = twComponent(
  'label',
  'flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-ui-md border border-gray-300 bg-white px-[0.9rem] py-[0.55rem] text-center text-[0.9rem] font-extrabold text-gray-700 transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand min-[760px]:w-auto',
);
const SelectionInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input type="checkbox" className={cn('h-4 w-4 cursor-pointer accent-[#e30613]', className)} {...props} />
);
const CacambaNumber: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, style, ...props }) => (
  <span
    className={cn('text-[1.08rem] font-black leading-none text-brand', className)}
    style={{ color: 'rgb(227, 6, 19)', ...style }}
    {...props}
  />
);
const TypeBadge = twComponent<'span', { tipo: 'entrega' | 'retirada' }>('span', 'rounded-full px-[0.55rem] py-[0.25rem] text-xs font-black uppercase tracking-[0.04em]', ({ tipo }) =>
  tipo === 'entrega' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
);
const PaymentBadge = twComponent('span', 'rounded-full bg-green-100 px-[0.55rem] py-[0.25rem] text-xs font-black uppercase tracking-[0.04em] text-green-700');

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

const DetailsGrid = twComponent(
  'dl',
  'm-0 mt-3 grid grid-cols-1 gap-x-4 gap-y-3 min-[460px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4',
);
const DetailItem = twComponent('div', 'min-w-0 border-l-2 border-gray-200 pl-2.5');
const DetailLabel = twComponent(
  'dt',
  'm-0 text-[0.66rem] font-black uppercase leading-tight tracking-[0.045em] text-gray-500',
);
const DetailValue = twComponent(
  'dd',
  'm-0 mt-1 min-w-0 break-words text-[0.88rem] font-extrabold leading-[1.35] text-gray-900',
);
const BlockedWarning = twComponent('div', 'mt-2 whitespace-pre-line rounded-ui-lg border border-red-300 bg-red-50 px-[0.7rem] py-[0.55rem] text-[0.9rem] font-bold text-red-900');
const ImageContainer = twComponent(
  'div',
  'w-full min-w-0 min-[641px]:col-start-2 min-[641px]:row-start-1 min-[641px]:w-[92px]',
);
const ImageButton = twComponent(
  'button',
  'relative block min-h-11 w-full cursor-pointer overflow-hidden rounded-ui-md border border-gray-300 bg-white p-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus-strong',
);
const CacambaImage = twComponent(
  'img',
  'h-28 w-full bg-white object-cover transition-transform duration-200 hover:scale-[1.03] min-[641px]:h-[92px] min-[641px]:w-[92px]',
);
const ActionRow = twComponent(
  'div',
  'grid grid-cols-1 gap-2 border-t border-gray-200 bg-slate-50 px-4 py-3 min-[480px]:grid-cols-2 min-[760px]:flex min-[760px]:flex-wrap max-[640px]:px-3',
);
const ActionButton = twComponent<'button', { $variant?: 'danger' | 'secondary' }>('button', 'min-h-11 w-full cursor-pointer rounded-ui-md border px-[0.9rem] py-[0.55rem] text-[0.9rem] font-extrabold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[background,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus-strong min-[760px]:w-auto', ({ $variant }) =>
  $variant === 'danger'
    ? 'border-red-300 bg-white text-red-700 hover:border-red-700 hover:bg-red-50'
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
  returnToPendingSelectable?: boolean;
  selectedReturnToPendingIds?: string[];
  onToggleReturnToPending?: (cacamba: ICacamba, checked: boolean) => void;
  showDeliveryDateForRetirada?: boolean;
  statusBadges?: Record<string, CacambaStatusBadge | CacambaStatusBadge[]>;
  responsibility?: CacambaResponsibility;
  showResponsibility?: boolean;
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
  if (explicit) return formatDriverName(explicit, '');
  if (!motorista) return '';
  if (typeof motorista === 'string') {
    const value = motorista.trim();
    return isObjectIdLike(value) ? '' : formatDriverName(value, '');
  }
  return formatDriverName(motorista.username, '');
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
  returnToPendingSelectable = false,
  selectedReturnToPendingIds = [],
  onToggleReturnToPending,
  showDeliveryDateForRetirada = false,
  statusBadges,
  responsibility,
  showResponsibility = true,
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
        const hasResponsibleInfo = showResponsibility && Boolean(responsible.driverName || responsible.placa);
        const movementDate = formatDateTime(cacamba.createdAt);
        const showSelectAction = selectable && isSelectableInClosure;
        const showEditAction = Boolean(onEdit);
        const showDeleteAction = !selectable && Boolean(onDelete);
        const showReturnToPendingAction = !selectable && Boolean(onReturnToPending);
        const showMissingContentAction =
          selectable && isRetirada && isPendingClosure && missingContentType && Boolean(onEditContentType);
        const showMissingValueAction =
          selectable &&
          (isRetirada || isEntrega) &&
          isPendingClosure &&
          missingValue &&
          Boolean(onEditPrice);
        const showAdminContentAction =
          !selectable && adminMetaActions && isRetirada && Boolean(onEditContentType);
        const showAdminPriceAction =
          adminMetaActions &&
          canEditPrice &&
          (!selectable || !isPendingClosure) &&
          (isRetirada || isEntrega) &&
          Boolean(onEditPrice);
        const hasActions =
          showSelectAction ||
          showEditAction ||
          showDeleteAction ||
          showReturnToPendingAction ||
          showMissingContentAction ||
          showMissingValueAction ||
          showAdminContentAction ||
          showAdminPriceAction;
        const isSelectedForPayment = selectedCacambaIds.includes(cacamba._id);

        return (
          <CacambaCard key={cacamba._id} data-testid={`cacamba-card-${cacamba._id}`}>
            <CardContent $hasImage={Boolean(imageUrl)}>
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
                      key={`${badge.tone}-${badge.label}-${index}`}
                      $tone={badge.tone}
                      data-testid={`cacamba-status-badge-${cacamba._id}-${index}`}
                    >
                      {badge.label}
                    </StatusBadge>
                  ))}
                </HeaderInfo>

                <DetailsGrid data-testid={`cacamba-details-${cacamba._id}`}>
                  {showDeliveryDateForRetirada && isRetirada && (
                    <DetailItem>
                      <DetailLabel>Entregue em:</DetailLabel>
                      <DetailValue>{deliveryDate || 'Data não disponível'}</DetailValue>
                    </DetailItem>
                  )}

                  <DetailItem>
                    <DetailLabel>{isRetirada ? 'Retirada em:' : 'Entregue em:'}</DetailLabel>
                    <DetailValue>{movementDate || 'Data não disponível'}</DetailValue>
                  </DetailItem>

                  {cacamba.local && (
                    <DetailItem>
                      <DetailLabel>Local:</DetailLabel>
                      <DetailValue>
                        {cacamba.local === 'via_publica'
                          ? 'Via pública'
                          : cacamba.local === 'canteiro_obra'
                            ? 'Canteiro de obra'
                            : cacamba.local}
                      </DetailValue>
                    </DetailItem>
                  )}

                  {hasResponsibleInfo && (
                    <>
                      <DetailItem>
                        <DetailLabel>Motorista:</DetailLabel>
                        <DetailValue>{responsible.driverName || '-'}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Placa:</DetailLabel>
                        <DetailValue>{responsible.placa || '-'}</DetailValue>
                      </DetailItem>
                    </>
                  )}

                  {cacamba.contentType && (
                    <DetailItem>
                      <DetailLabel>Conteúdo:</DetailLabel>
                      <DetailValue>{cacamba.contentType}</DetailValue>
                    </DetailItem>
                  )}

                  {hasValidPrice && (
                    <DetailItem>
                      <DetailLabel>Valor:</DetailLabel>
                      <DetailValue>
                        {cacamba.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </DetailValue>
                    </DetailItem>
                  )}
                </DetailsGrid>

                {warningText && <BlockedWarning>{warningText}</BlockedWarning>}
              </InfoSection>

              {cacamba.imageUrl && imageUrl && (
                <ImageContainer>
                  <ImageButton
                    type="button"
                    aria-label={`Ampliar foto da caçamba ${cacamba.numero}`}
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
                  >
                    <CacambaImage
                      src={thumbs[thumbKey] || imageUrl || cacamba.imageUrl}
                      alt={`Foto da caçamba ${cacamba.numero}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span aria-hidden="true" className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">⌕</span>
                  </ImageButton>
                </ImageContainer>
              )}
            </CardContent>

            {hasActions && (
              <ActionRow data-testid={`cacamba-actions-${cacamba._id}`}>
                {showSelectAction && (
                  <SelectionLabel
                    className={cn(
                      isSelectedForPayment && 'border-brand bg-brand-soft text-brand',
                    )}
                  >
                    <SelectionInput
                      checked={isSelectedForPayment}
                      onChange={(event) => onToggleSelect?.(cacamba, event.target.checked)}
                      aria-label="Selecionar para pagamento"
                    />
                    Selecionar para pagamento
                  </SelectionLabel>
                )}
                {showEditAction && onEdit && (
                  <ActionButton type="button" $variant="secondary" onClick={() => onEdit(cacamba)}>
                    {editLabel}
                  </ActionButton>
                )}
                {showDeleteAction && onDelete && (
                  <ActionButton type="button" $variant="danger" onClick={() => onDelete(cacamba._id)} aria-label={`Excluir caçamba ${cacamba.numero}`}>
                    Excluir
                  </ActionButton>
                )}
                {showReturnToPendingAction && onReturnToPending && (
                  returnToPendingSelectable ? (
                    <SelectionLabel>
                      <SelectionInput
                        checked={selectedReturnToPendingIds.includes(cacamba._id)}
                        onChange={(event) => onToggleReturnToPending?.(cacamba, event.target.checked)}
                        aria-label={`Selecionar caçamba ${cacamba.numero} para voltar a pendente`}
                      />
                      Voltar para pendente
                    </SelectionLabel>
                  ) : (
                    <ActionButton
                      type="button"
                      $variant="secondary"
                      onClick={() => onReturnToPending(cacamba)}
                    >
                      Voltar para pendente
                    </ActionButton>
                  )
                )}
                {showMissingContentAction && onEditContentType && (
                  <ActionButton type="button" $variant="secondary" onClick={() => onEditContentType(cacamba)}>
                    Adicionar conteúdo
                  </ActionButton>
                )}
                {showMissingValueAction && onEditPrice && (
                  <ActionButton type="button" $variant="secondary" onClick={() => onEditPrice(cacamba)}>
                    Adicionar valor
                  </ActionButton>
                )}
                {showAdminContentAction && onEditContentType && (
                  <ActionButton type="button" $variant="secondary" onClick={() => onEditContentType(cacamba)}>
                    Editar conteúdo
                  </ActionButton>
                )}
                {showAdminPriceAction && onEditPrice && (
                  <ActionButton type="button" $variant="secondary" onClick={() => onEditPrice(cacamba)}>
                    {typeof cacamba.price === 'number' ? 'Editar valor' : 'Adicionar valor'}
                  </ActionButton>
                )}
              </ActionRow>
            )}
          </CacambaCard>
        );
      })}
    </Container>
  );
};

export default CacambaList;
