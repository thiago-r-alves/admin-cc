import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { IClient, IOrder } from '../interfaces';
import CacambaList from './CacambaList'; // Importe o CacambaList
import ImageModal from './ImageModal'; // Verifique se este arquivo existe

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
const ModalContent = styled.div`
  background-color: white; border-radius: 8px; padding: 1.5rem 2rem;
  width: 90%; max-width: 900px; max-height: 90vh;
  display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 1rem;
`;
const Title = styled.h2`
  margin: 0; color: #111827; font-size: 1.25rem;
`;
const CloseButton = styled.button`
  background: none; border: none; font-size: 1.5rem; cursor: pointer;
`;
const FiltersContainer = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem; margin-bottom: 1rem;
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column;
`;
const Label = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;
`;
const Input = styled.input`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;
`;
const Select = styled.select`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;
`;
const OrdersList = styled.div`
  overflow-y: auto;
  padding-right: 10px; // Espaço para a barra de rolagem
`;

// Estilos do OrderCard
const OrderCard = styled.div<{ status: string }>`
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-left: 5px solid ${({ status }) => {
    if (status === 'concluido') return '#10b981';
    if (status === 'em_andamento') return '#f59e0b';
    return '#6b7280';
  }};
`;

const CacambaSection = styled.div`
  margin-top: 1rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
`;

const ImageContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const OrderImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
`;

const DateText = styled.span`
  font-weight: 500;
  color: #111827;
`;

interface ClientOrdersModalProps {
  client: IClient;
  onClose: () => void;
}

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
    <ModalOverlay>
      {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}
      <ModalContent>
        <ModalHeader>
          <Title>Pedidos de {client.clientName}</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <FiltersContainer>
          <FormGroup>
            <Label>Data Inicial</Label>
            <Input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </FormGroup>
          <FormGroup>
            <Label>Data Final</Label>
            <Input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </FormGroup>
          <FormGroup>
            <Label>Tipo</Label>
            <Select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="entrega">Entrega</option>
              <option value="retirada">Retirada</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Local</Label>
            <Select name="local" value={filters.local} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="via_publica">Via Pública</option>
              <option value="canteiro_obra">Canteiro de Obra</option>
            </Select>
          </FormGroup>
        </FiltersContainer>

        <OrdersList>
          {orders.length > 0 ? (
            orders.map(order => {
              // Datas seguras (evita passar undefined para new Date)
              const createdAtStr = order.createdAt ?? '';
              const createdAtDate = createdAtStr ? new Date(createdAtStr) : null;

              const completedAtStr = order.updatedAt ?? order.createdAt ?? '';
              const completedAtDate = completedAtStr ? new Date(completedAtStr) : null;

              return (
                <OrderCard key={order._id} status={order.status}>
                  <h3>
                    Pedido #{order.orderNumber} - {createdAtDate ? createdAtDate.toLocaleDateString('pt-BR') : '-'}
                  </h3>
                  <p><strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood}</p>
                  <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>
                  <p><strong>Status:</strong> {order.status} | <strong>Tipo:</strong> {order.type}</p>
                  <p>
                    <strong>Data de Conclusão:</strong>{' '}
                    <DateText>{completedAtDate ? completedAtDate.toLocaleString('pt-BR') : '-'}</DateText>
                  </p>

                  {order.cacambas && order.cacambas.length > 0 && (
                    <CacambaSection>
                      <CacambaList
                        cacambas={order.cacambas || []}
                        onImageClick={setModalImage}
                      />
                    </CacambaSection>
                  )}

                  {order.imageUrls && order.imageUrls.length > 0 && (
                    <div>
                      <h4>Imagens Anexadas ao Pedido:</h4>
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
                    </div>
                  )}
                </OrderCard>
              );
            })
          ) : (
            <p>Nenhum pedido encontrado para os filtros selecionados.</p>
          )}
        </OrdersList>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ClientOrdersModal;
