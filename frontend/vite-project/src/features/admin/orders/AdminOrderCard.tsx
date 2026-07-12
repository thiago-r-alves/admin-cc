import type { ICacamba, IOrder, OrderType } from '../../../interfaces';
import CacambaList from '../../../components/CacambaList';
import { apiUrl } from '../../../services/api';
import { SHOW_ORDER_DOWNLOAD_BUTTON, typeLabels } from '../admin.constants';
import { formatOrderAddress } from '../admin.helpers';
import {
  ActionButton,
  CacambaSection,
  DeleteOrderButton,
  DownloadOrderButton,
  ImageContainer,
  InfoGrid,
  InfoLabel,
  InfoTile,
  InfoValue,
  OrderActions,
  OrderAddressBlock,
  OrderCard,
  OrderCardBody,
  OrderCardHeader,
  OrderClientName,
  OrderDetailsDivider,
  OrderFooter,
  OrderHeaderMeta,
  OrderImage,
  OrderNumber,
  OrderTypeBadge,
} from '../admin.styles';

type AdminOrderCardProps = {
  order: IOrder;
  onOpenImage: (url: string) => void;
  onEditCacamba: (payload: { cacamba: ICacamba; orderType: OrderType }) => void;
  onEditCacambaPrice: (cacamba: ICacamba) => void;
  onCorrectOrder: (order: IOrder) => void;
  onChangeClient: (order: IOrder) => void;
  onDeleteOrder: (orderId: string) => void;
};

export const AdminOrderCard = ({
  order,
  onOpenImage,
  onEditCacamba,
  onEditCacambaPrice,
  onCorrectOrder,
  onChangeClient,
  onDeleteOrder,
}: AdminOrderCardProps) => {
  const hasCacambas = (order.cacambas?.length ?? 0) > 0;
  const canCorrectOrder = order.status === 'pendente' && !hasCacambas;
  const contactText = [order.contactName, order.contactNumber ? `(${order.contactNumber})` : '']
    .filter(Boolean)
    .join(' ') || '-';
  const proof = order.deliveryProof;
  const proofDate = proof?.capturedAt ? new Date(proof.capturedAt) : null;
  const proofImageUrl = proof?.signatureImageUrl
    ? (proof.signatureImageUrl.startsWith('http') ? proof.signatureImageUrl : `${apiUrl}${proof.signatureImageUrl}`)
    : '';

  return (
    <OrderCard key={order._id} status={order.status} data-testid={`order-card-${order._id}`}>
      <OrderCardHeader>
        <OrderHeaderMeta>
          <OrderNumber>#{order.orderNumber ?? '-'}</OrderNumber>
        </OrderHeaderMeta>
        <OrderTypeBadge $type={order.type}>{typeLabels[order.type] ?? order.type}</OrderTypeBadge>
      </OrderCardHeader>

      <OrderCardBody>
        <OrderClientName>{order.clientName}</OrderClientName>

        <OrderAddressBlock>
          <div>
            <InfoLabel>Endereço da obra</InfoLabel>
            <InfoValue>{formatOrderAddress(order)}</InfoValue>
          </div>
        </OrderAddressBlock>

        <InfoGrid>
          <InfoTile>
            <div>
              <InfoLabel>Contato</InfoLabel>
              <InfoValue>{contactText}</InfoValue>
            </div>
          </InfoTile>
          <InfoTile>
            <div>
              <InfoLabel>CNPJ/CPF</InfoLabel>
              <InfoValue>{order.cnpjCpf || '-'}</InfoValue>
            </div>
          </InfoTile>
          <InfoTile>
            <div>
              <InfoLabel>Placa veículo</InfoLabel>
              <InfoValue style={{ textTransform: 'uppercase' }}>{order.placa || '-'}</InfoValue>
            </div>
          </InfoTile>
        </InfoGrid>

        {hasCacambas && (
          <CacambaSection>
            <CacambaList
              cacambas={order.cacambas || []}
              onImageClick={onOpenImage}
              showTitle={false}
              onEdit={(cacamba) => onEditCacamba({ cacamba, orderType: order.type })}
              editLabel="Editar caçamba"
              adminMetaActions={order.type === 'retirada'}
              canEditPrice={order.type === 'retirada' && order.status === 'concluido'}
              onEditPrice={onEditCacambaPrice}
              showDeliveryDateForRetirada
              responsibility={{ motorista: order.motorista, placa: order.placa }}
            />
          </CacambaSection>
        )}

        {order.status === 'concluido' && (
          <CacambaSection>
            <h4 className="m-0 mb-3 text-sm font-black text-gray-700">Comprovante da locação</h4>
            {!proof ? (
              <div className="rounded-ui-md border border-dashed border-gray-300 bg-slate-50 p-3 text-sm font-bold text-gray-500">Sem comprovante digital</div>
            ) : (
              <div className="grid gap-3">
                {proof.type === 'no_responsible' && <span className="w-fit rounded-ui-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-black uppercase text-red-800">Sem responsável no local</span>}
                <InfoGrid>
                  <InfoTile><InfoLabel>Data/Hora</InfoLabel><InfoValue>{proofDate && !Number.isNaN(proofDate.getTime()) ? proofDate.toLocaleString('pt-BR') : '-'}</InfoValue></InfoTile>
                  <InfoTile><InfoLabel>Motorista</InfoLabel><InfoValue>{proof.driverNameSnapshot || (typeof order.motorista === 'object' ? order.motorista?.username : '') || '-'}</InfoValue></InfoTile>
                  {proof.type === 'no_responsible' && <InfoTile><InfoLabel>Observação</InfoLabel><InfoValue>{proof.note || '-'}</InfoValue></InfoTile>}
                </InfoGrid>
                {proof.type === 'signed' && proofImageUrl && (
                  <button type="button" className="w-fit cursor-pointer border-0 bg-transparent p-0" onClick={() => onOpenImage(proofImageUrl)}>
                    <img src={proofImageUrl} alt="Assinatura pelo recebimento da locação" className="h-24 w-[min(260px,100%)] rounded-ui-md border border-gray-300 bg-white object-contain" />
                  </button>
                )}
              </div>
            )}
          </CacambaSection>
        )}

        {((order.imageUrls?.length ?? 0) > 0) && (
          <CacambaSection>
            <h4>Imagens Anexadas</h4>
            <ImageContainer>
              {(order.imageUrls ?? []).map((url, index) => (
                <OrderImage
                  key={url || index}
                  src={`${apiUrl}${url}`}
                  alt={`Imagem ${index + 1}`}
                  onClick={() => onOpenImage(`${apiUrl}${url}`)}
                />
              ))}
            </ImageContainer>
          </CacambaSection>
        )}

        <OrderDetailsDivider />

        <OrderFooter>
          <OrderActions>
            {order.status === 'pendente' && (
              <ActionButton
                type="button"
                disabled={!canCorrectOrder}
                title={hasCacambas ? 'Pedidos com caçambas cadastradas não podem ser corrigidos.' : undefined}
                onClick={() => onCorrectOrder(order)}
              >
                Corrigir Pedido
              </ActionButton>
            )}
            <ActionButton type="button" onClick={() => onChangeClient(order)}>
              Corrigir Cliente
            </ActionButton>
            <DeleteOrderButton onClick={() => onDeleteOrder(order._id)}>Excluir</DeleteOrderButton>
            {SHOW_ORDER_DOWNLOAD_BUTTON && order.status === 'concluido' && (
              <DownloadOrderButton
                type="button"
                onClick={async () => {
                  const { downloadOrderPdf } = await import('../../../utils/orderPdf');
                  downloadOrderPdf(order);
                }}
              >
                Baixar Pedido
              </DownloadOrderButton>
            )}
          </OrderActions>
        </OrderFooter>
      </OrderCardBody>
    </OrderCard>
  );
};
