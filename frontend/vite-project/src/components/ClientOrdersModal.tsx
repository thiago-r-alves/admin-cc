import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { IClient, IOrder } from '../interfaces';
import CacambaList from './CacambaList';
import ImageModal from './ImageModal';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(17, 24, 39, 0.68);

  @media (max-width: 768px) {
    align-items: stretch;
    padding: 0;
  }
`;

const ModalContent = styled.div`
  width: min(980px, 94vw);
  max-height: min(90dvh, 820px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);

  @media (max-width: 768px) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
  background: #ffffff;
`;

const TitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

const TitleAccent = styled.span`
  flex: 0 0 auto;
  width: 4px;
  height: 28px;
  border-radius: 999px;
  background: #e30613;
`;

const Title = styled.h2`
  min-width: 0;
  margin: 0;
  color: #111827;
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 900;
  line-height: 1.25;
`;

const CloseButton = styled.button`
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.55rem;
  line-height: 1;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: #fff1f2;
    color: #e30613;
  }
`;

const ModalBody = styled.div`
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fffafa;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  min-width: 0;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
`;

const fieldStyles = `
  width: 100%;
  min-height: 39px;
  box-sizing: border-box;
  padding: 0.58rem 0.65rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  background: #ffffff;
  color: #374151;
  font-size: 0.88rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const Input = styled.input`
  ${fieldStyles}
`;

const Select = styled.select`
  ${fieldStyles}
`;

const OrdersList = styled.div`
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.25rem;
  -webkit-overflow-scrolling: touch;
`;

const OrderCard = styled.article`
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);

  & + & {
    margin-top: 1rem;
  }
`;

const OrderCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-bottom: 1px solid #fee2e2;
  background: #f8fafc;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const OrderHeading = styled.div`
  min-width: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
`;

const OrderDate = styled.span`
  color: #6b7280;
  font-weight: 800;
`;

const TypeBadge = styled.span`
  flex: 0 0 auto;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  background: #23324a;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const OrderCardBody = styled.div`
  padding: 1rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.8rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const InfoBlock = styled.div<{ $span?: number }>`
  min-width: 0;
  grid-column: span ${({ $span }) => $span || 1};
  padding: 0.8rem;
  border: 1px solid #f1d4d4;
  border-radius: 4px;
  background: #fffafa;

  @media (max-width: 860px) {
    grid-column: span 1;
  }
`;

const InfoLabel = styled.div`
  margin-bottom: 0.35rem;
  color: #9ca3af;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const InfoValue = styled.div`
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.45;
  word-break: break-word;
`;

const CacambaSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #fee2e2;
`;

const SectionTitle = styled.h4`
  margin: 0 0 0.75rem;
  color: #111827;
  font-size: 0.95rem;
  font-weight: 900;
`;

const ImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const OrderImage = styled.img`
  width: 68px;
  height: 68px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
`;

const EmptyState = styled.div`
  padding: 1rem;
  border: 1px dashed #fecaca;
  border-radius: 6px;
  background: #fffafa;
  color: #6b7280;
  font-size: 0.92rem;
`;

const ImageLayer = styled.div``;

interface ClientOrdersModalProps {
  client: IClient;
  onClose: () => void;
}

const typeLabels: Record<IOrder['type'], string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
};

const statusLabels: Record<IOrder['status'], string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
};

const ClientOrdersModal: React.FC<ClientOrdersModalProps> = ({ client, onClose }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    local: '',
  });

  useEffect(() => {
    const fetchOrders = async () => {
      const query = new URLSearchParams();
      const apiUrl = import.meta.env.VITE_API_URL;
      if (filters.startDate) query.append('startDate', filters.startDate);
      if (filters.endDate) query.append('endDate', filters.endDate);
      if (filters.type) query.append('type', filters.type);
      if (filters.local) query.append('local', filters.local);

      const response = await fetch(`${apiUrl}/clients/${client._id}/orders?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    };

    fetchOrders();
  }, [client._id, filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const apiUrl = import.meta.env.VITE_API_URL;

  return (
    <ModalOverlay onClick={onClose}>
      {modalImage && (
        <ImageLayer onClick={(event) => event.stopPropagation()}>
          <ImageModal url={modalImage} onClose={() => setModalImage(null)} />
        </ImageLayer>
      )}

      <ModalContent onClick={(event) => event.stopPropagation()}>
        <ModalHeader>
          <TitleWrap>
            <TitleAccent />
            <Title>Pedidos de {client.clientName}</Title>
          </TitleWrap>
          <CloseButton type="button" onClick={onClose} aria-label="Fechar modal">
            ×
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <FiltersContainer>
            <FormGroup>
              <Label htmlFor="orders-start-date">Data Inicial</Label>
              <Input id="orders-start-date" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="orders-end-date">Data Final</Label>
              <Input id="orders-end-date" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="orders-type">Tipo</Label>
              <Select id="orders-type" name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">Todos</option>
                <option value="entrega">Entrega</option>
                <option value="retirada">Retirada</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="orders-local">Local</Label>
              <Select id="orders-local" name="local" value={filters.local} onChange={handleFilterChange}>
                <option value="">Todos</option>
                <option value="via_publica">Via pública</option>
                <option value="canteiro_obra">Canteiro de obra</option>
              </Select>
            </FormGroup>
          </FiltersContainer>

          <OrdersList>
            {orders.length > 0 ? (
              orders.map(order => {
                const conclusionLabel = order.status === 'concluido' ? 'Data de conclusão' : 'Atualizado em';
                const conclusionDate = order.status === 'concluido'
                  ? formatDateTime(order.updatedAt ?? order.createdAt)
                  : formatDateTime(order.updatedAt);

                return (
                  <OrderCard key={order._id}>
                    <OrderCardHeader>
                      <OrderHeading>
                        Pedido #{order.orderNumber ?? '-'} <OrderDate>- {formatDate(order.createdAt)}</OrderDate>
                      </OrderHeading>
                      <TypeBadge>{typeLabels[order.type] ?? order.type}</TypeBadge>
                    </OrderCardHeader>

                    <OrderCardBody>
                      <InfoGrid>
                        <InfoBlock $span={order.cnpjCpf ? 1 : 2}>
                          <InfoLabel>Endereço</InfoLabel>
                          <InfoValue>
                            {order.address}, {order.addressNumber} - {order.neighborhood}
                            {order.city ? ` - ${order.city}` : ''}
                            {order.cep ? ` - CEP ${order.cep}` : ''}
                          </InfoValue>
                        </InfoBlock>
                        <InfoBlock>
                          <InfoLabel>Contato</InfoLabel>
                          <InfoValue>{order.contactName} ({order.contactNumber})</InfoValue>
                        </InfoBlock>
                        {order.cnpjCpf && (
                          <InfoBlock>
                            <InfoLabel>CNPJ/CPF</InfoLabel>
                            <InfoValue>{order.cnpjCpf}</InfoValue>
                          </InfoBlock>
                        )}
                        <InfoBlock>
                          <InfoLabel>Status</InfoLabel>
                          <InfoValue>{statusLabels[order.status] ?? order.status}</InfoValue>
                        </InfoBlock>
                        <InfoBlock>
                          <InfoLabel>{conclusionLabel}</InfoLabel>
                          <InfoValue>{conclusionDate}</InfoValue>
                        </InfoBlock>
                      </InfoGrid>

                      {order.cacambas && order.cacambas.length > 0 && (
                        <CacambaSection>
                          <SectionTitle>Caçambas Registradas</SectionTitle>
                          <CacambaList
                            cacambas={order.cacambas || []}
                            onImageClick={setModalImage}
                            showTitle={false}
                          />
                        </CacambaSection>
                      )}

                      {order.imageUrls && order.imageUrls.length > 0 && (
                        <CacambaSection>
                          <SectionTitle>Imagens Anexadas ao Pedido</SectionTitle>
                          <ImageContainer>
                            {order.imageUrls.map((url, index) => (
                              <OrderImage
                                key={index}
                                src={`${apiUrl}${url}`}
                                alt={`Imagem ${index + 1}`}
                                onClick={() => setModalImage(`${apiUrl}${url}`)}
                              />
                            ))}
                          </ImageContainer>
                        </CacambaSection>
                      )}
                    </OrderCardBody>
                  </OrderCard>
                );
              })
            ) : (
              <EmptyState>Nenhum pedido encontrado para os filtros selecionados.</EmptyState>
            )}
          </OrdersList>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ClientOrdersModal;
