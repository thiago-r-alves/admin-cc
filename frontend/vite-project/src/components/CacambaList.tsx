import React from 'react';
import styled from 'styled-components';
import type { ICacamba } from '../interfaces';

const EmptyState = styled.div`
  color: #6b7280;
  text-align: center;
  padding: 1rem 0;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Title = styled.h3`
  font-size: 1.05rem;
  font-weight: 900;
  color: #111827;
  margin: 0;
`;

const CacambaCard = styled.div`
  background-color: #f8fafc;
  padding: 0.78rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
`;

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.72rem;
`;

const InfoSection = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SelectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 36px;
  padding: 0.42rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
`;

const SelectionInput = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const CacambaNumber = styled.span`
  font-weight: 900;
  color: #111827;
  font-size: 1.02rem;
`;

const TypeBadge = styled.span<{ tipo: 'entrega' | 'retirada' }>`
  padding: 0.15rem 0.45rem;
  font-size: 0.66rem;
  border-radius: 9999px;
  background-color: ${(props) => (props.tipo === 'entrega' ? '#dcfce7' : '#fee2e2')};
  color: ${(props) => (props.tipo === 'entrega' ? '#166534' : '#b91c1c')};
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const PaymentBadge = styled.span`
  padding: 0.15rem 0.45rem;
  font-size: 0.66rem;
  border-radius: 9999px;
  background-color: #dcfce7;
  color: #166534;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const DateInfo = styled.p`
  font-size: 0.82rem;
  color: #4b5563;
  margin: 0.2rem 0 0 0;
  line-height: 1.35;
`;

const LocalInfo = styled.span`
  display: block;
  font-size: 0.82rem;
  color: #374151;
  margin-top: 0.18rem;
`;

const ServiceOrder = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: #374151;

  strong {
    color: #111827;
  }
`;

const ContentTypeInfo = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: #374151;

  strong {
    color: #111827;
  }
`;

const PriceInfo = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: #374151;

  strong {
    color: #111827;
  }
`;

const BlockedWarning = styled.div`
  margin-top: 0.5rem;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.55rem 0.7rem;
  white-space: pre-line;
`;

const ImageContainer = styled.div`
  margin-left: 0.35rem;
  flex: 0 0 auto;
`;

const CacambaImage = styled.img`
  width: 66px;
  height: 66px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #fff;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'secondary' }>`
  background-color: ${({ $variant }) => ($variant === 'danger' ? '#e30613' : '#ffffff')};
  color: ${({ $variant }) => ($variant === 'danger' ? '#ffffff' : '#374151')};
  border: 1px solid ${({ $variant }) => ($variant === 'danger' ? '#e30613' : '#d1d5db')};
  border-radius: 4px;
  padding: 0.42rem 0.9rem;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

  &:hover {
    background-color: ${({ $variant }) => ($variant === 'danger' ? '#c9000b' : '#fff1f2')};
    border-color: ${({ $variant }) => ($variant === 'danger' ? '#c9000b' : '#e30613')};
    color: ${({ $variant }) => ($variant === 'danger' ? '#ffffff' : '#e30613')};
  }
`;

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
}

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString('pt-BR');
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
}) => {
  if (cacambas.length === 0) {
    return <EmptyState>Nenhuma caçamba registrada ainda</EmptyState>;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  const [thumbs, setThumbs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    cacambas.forEach((c) => {
      if (c.imageUrl && !thumbs[c._id]) {
        const full = c.imageUrl.startsWith('http') ? c.imageUrl : `${apiUrl}${c.imageUrl}`;
        import('../utils/image')
          .then(({ resizeImage }) => resizeImage(full, 66, 1))
          .then((r) => setThumbs((prev) => ({ ...prev, [c._id]: r })))
          .catch(console.error);
      }
    });
  }, [cacambas, apiUrl, thumbs]);

  return (
    <Container>
      {showTitle && <Title>Caçambas Registradas:</Title>}

      {cacambas.map((cacamba) => {
        const isRetirada = cacamba.tipo === 'retirada';
        const isPaid = cacamba.paymentStatus === 'paga';
        const hasValidPrice = typeof cacamba.price === 'number' && Number.isFinite(cacamba.price);
        const hasValidContentType =
          typeof cacamba.contentType === 'string' && cacamba.contentType.trim().length > 0;

        const missingValue = isRetirada && !hasValidPrice;
        const missingContentType = isRetirada && !hasValidContentType;
        const isSelectableInClosure = selectable && isRetirada && !isPaid && hasValidPrice && hasValidContentType;
        const deliveryDate = formatDateTime(cacamba.closureDelivery?.date);

        let warningText = '';
        if (selectable && !isPaid && isRetirada && (missingValue || missingContentType)) {
          if (missingValue && missingContentType) {
            warningText = 'Caçamba sem valor e tipo de conteúdo definidos.\nDefina os dados para liberar o pagamento.';
          } else if (missingValue) {
            warningText = 'Caçamba sem valor definido.\nDefina os dados para liberar o pagamento.';
          } else {
            warningText = 'Caçamba sem tipo de conteúdo definido.\nDefina os dados para liberar o pagamento.';
          }
        }

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
                </HeaderInfo>

                {showDeliveryDateForRetirada && isRetirada && (
                  <DateInfo>
                    <strong>Entregue em:</strong> {deliveryDate || 'Data não disponível'}
                  </DateInfo>
                )}

                <DateInfo>
                  {isRetirada ? <strong>Retirada em:</strong> : 'Registrada em:'}{' '}
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
                    src={thumbs[cacamba._id] || cacamba.imageUrl}
                    alt="Foto da caçamba"
                    onClick={async () => {
                      if (onImageClick && cacamba.imageUrl) {
                        const full = cacamba.imageUrl.startsWith('http')
                          ? cacamba.imageUrl
                          : `${apiUrl}${cacamba.imageUrl}`;
                        try {
                          const mod = await import('../utils/image');
                          const large = await mod.resizeImage(full, 1200, 0.8);
                          onImageClick(large);
                        } catch (e) {
                          console.error('Erro redimensionando imagem:', e);
                          onImageClick(full);
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
              {!selectable && onEdit && (
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
              {selectable && isRetirada && !isPaid && missingContentType && onEditContentType && (
                <ActionButton $variant="secondary" onClick={() => onEditContentType(cacamba)}>
                  Adicionar conteúdo
                </ActionButton>
              )}
              {selectable && isRetirada && !isPaid && missingValue && onEditPrice && (
                <ActionButton $variant="secondary" onClick={() => onEditPrice(cacamba)}>
                  Adicionar valor
                </ActionButton>
              )}
              {!selectable && adminMetaActions && isRetirada && onEditContentType && (
                <ActionButton $variant="secondary" onClick={() => onEditContentType(cacamba)}>
                  Editar conteúdo
                </ActionButton>
              )}
              {!selectable && adminMetaActions && canEditPrice && isRetirada && onEditPrice && (
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
