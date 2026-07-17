import { useState } from 'react';
import type { ICacamba, IOrder, OrderType } from '../../../interfaces';
import CacambaList from '../../../components/CacambaList';
import { apiUrl } from '../../../services/api';
import { formatDriverName } from '../../../utils/formatDriverName';
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
  onDeleteCacamba: (cacamba: ICacamba) => void;
};

export const AdminOrderCard = ({
  order,
  onOpenImage,
  onEditCacamba,
  onEditCacambaPrice,
  onCorrectOrder,
  onChangeClient,
  onDeleteOrder,
  onDeleteCacamba,
}: AdminOrderCardProps) => {
  const [showPaymentQrChoice, setShowPaymentQrChoice] = useState(false);
  const [isDownloadingOrderPdf, setIsDownloadingOrderPdf] = useState(false);
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
  const proofDriverName = formatDriverName(proof?.driverNameSnapshot);
  const orderDriverName = formatDriverName(
    (typeof order.motorista === 'object' ? order.motorista?.username : '') ||
      proof?.driverNameSnapshot,
  );
  const downloadOrder = async (includePaymentQrCode: boolean) => {
    try {
      setIsDownloadingOrderPdf(true);
      const { downloadOrderPdf } = await import('../../../utils/orderPdf');
      await downloadOrderPdf(order, { includePaymentQrCode });
      setShowPaymentQrChoice(false);
    } finally {
      setIsDownloadingOrderPdf(false);
    }
  };

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
              onDelete={order.status === 'concluido' ? (cacambaId) => {
                const cacamba = (order.cacambas || []).find((item) => item._id === cacambaId);
                if (cacamba) onDeleteCacamba(cacamba);
              } : undefined}
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
                {proof.isReused && <span className="w-fit rounded-ui-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-black uppercase text-blue-800">Comprovante reutilizado</span>}
                {proof.type === 'no_responsible' && <span className="w-fit rounded-ui-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-black uppercase text-red-800">Sem responsável no local</span>}
                <InfoGrid>
                  <InfoTile><InfoLabel>Data/Hora</InfoLabel><InfoValue>{proofDate && !Number.isNaN(proofDate.getTime()) ? proofDate.toLocaleString('pt-BR') : '-'}</InfoValue></InfoTile>
                  <InfoTile><InfoLabel>Comprovante coletado por</InfoLabel><InfoValue>{proofDriverName}</InfoValue></InfoTile>
                  <InfoTile><InfoLabel>Motorista do pedido</InfoLabel><InfoValue>{orderDriverName}</InfoValue></InfoTile>
                  {proof.isReused && <InfoTile><InfoLabel>OS digital de origem</InfoLabel><InfoValue>#{proof.reusedFromOrderNumber ?? '-'}</InfoValue></InfoTile>}
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
                  if (order.type === 'entrega') {
                    setShowPaymentQrChoice(true);
                    return;
                  }
                  await downloadOrder(false);
                }}
              >
                Baixar Pedido
              </DownloadOrderButton>
            )}
          </OrderActions>
        </OrderFooter>
      </OrderCardBody>
      {showPaymentQrChoice && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-gray-900/60 p-4"
          role="presentation"
          onClick={() => {
            if (!isDownloadingOrderPdf) setShowPaymentQrChoice(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`payment-qr-title-${order._id}`}
            className="w-[min(460px,94vw)] rounded-ui-lg border border-red-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-red-100 px-5 py-4">
              <h3 id={`payment-qr-title-${order._id}`} className="m-0 text-[1.05rem] font-black text-gray-950">
                Incluir QR Code de pagamento?
              </h3>
              <p className="mb-0 mt-2 text-[0.88rem] font-semibold leading-5 text-gray-600">
                Deseja que a nota deste pedido de entrega saia com QR Code Pix e informações de pagamento?
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-ui-md border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDownloadingOrderPdf}
                onClick={() => downloadOrder(false)}
              >
                Baixar sem QR Code
              </button>
              <button
                type="button"
                className="min-h-11 cursor-pointer rounded-ui-md border border-brand bg-brand px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDownloadingOrderPdf}
                onClick={() => downloadOrder(true)}
              >
                {isDownloadingOrderPdf ? 'Gerando...' : 'Incluir QR Code Pix'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrderCard>
  );
};
