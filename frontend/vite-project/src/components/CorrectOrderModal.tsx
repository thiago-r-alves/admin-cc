import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import type { IDriver, IOrder, OrderType } from '../interfaces';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(17, 24, 39, 0.62);
`;

const Modal = styled.div`
  width: min(560px, 96vw);
  max-height: min(90dvh, 720px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);

  @media (max-width: 640px) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #fee2e2;
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.1rem;
  font-weight: 900;
`;

const CloseButton = styled.button`
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.55rem;
  line-height: 1;

  &:hover {
    background: #fff1f2;
    color: #e30613;
  }
`;

const Body = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1.25rem;
`;

const Intro = styled.p`
  margin: 0 0 1rem;
  color: #4b5563;
  line-height: 1.5;
`;

const Section = styled.section`
  display: grid;
  gap: 0.85rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.35rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const Select = styled.select`
  width: 100%;
  min-height: 42px;
  padding: 0.6rem 0.7rem;
  border: 1px solid #d8b4b4;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const Summary = styled.div`
  border: 1px solid #fee2e2;
  border-radius: 8px;
  padding: 0.95rem 1rem;
  background: #fffafa;
  color: #374151;
  font-size: 0.88rem;
  line-height: 1.55;

  strong {
    color: #111827;
  }
`;

const ErrorMessage = styled.p`
  margin: 0.2rem 0 0;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 700;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #fee2e2;
  background: #fffafa;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
  }
`;

const FooterButton = styled.button`
  min-width: 150px;
  min-height: 42px;
  padding: 0.7rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;

  @media (max-width: 560px) {
    width: 100%;
  }
`;

const CancelButton = styled(FooterButton)`
  border: 1px solid #d8b4b4;
  background: #ffffff;
  color: #6b1f1f;
`;

const SubmitButton = styled(FooterButton)`
  border: 1px solid #e30613;
  background: #e30613;
  color: #ffffff;

  &:disabled {
    background: #f39aa0;
    border-color: #f39aa0;
    cursor: not-allowed;
  }
`;

interface CorrectOrderModalProps {
  apiUrl: string;
  order: IOrder;
  drivers: IDriver[];
  onClose: () => void;
  onChanged: (order: IOrder) => void;
}

const typeLabels: Record<OrderType, string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
};

const getDriverId = (order: IOrder) =>
  typeof order.motorista === 'string' ? order.motorista : order.motorista?._id || '';

const CorrectOrderModal: React.FC<CorrectOrderModalProps> = ({
  apiUrl,
  order,
  drivers,
  onClose,
  onChanged,
}) => {
  const [type, setType] = useState<OrderType>(order.type);
  const [driverId, setDriverId] = useState(getDriverId(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentDriverName = useMemo(() => {
    if (typeof order.motorista === 'object' && order.motorista?.username) return order.motorista.username;
    return drivers.find((driver) => driver._id === getDriverId(order))?.username || '-';
  }, [drivers, order]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!driverId) {
      setError('Selecione um motorista para continuar.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/orders/${order._id}/correction`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, motorista: driverId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Erro ao corrigir pedido.');
        return;
      }

      onChanged(data);
      onClose();
    } catch {
      setError('Erro ao corrigir pedido.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(event) => event.stopPropagation()} data-testid="correct-order-modal">
        <Header>
          <Title>Corrigir pedido #{order.orderNumber ?? '-'}</Title>
          <CloseButton type="button" aria-label="Fechar modal" onClick={onClose}>
            ×
          </CloseButton>
        </Header>

        <form onSubmit={handleSubmit}>
          <Body>
            <Intro>Altere o tipo do pedido e o motorista responsável antes de qualquer caçamba ser cadastrada.</Intro>

            <Section>
              <Summary>
                <div><strong>Cliente:</strong> {order.clientName || '-'}</div>
                <div><strong>Tipo atual:</strong> {typeLabels[order.type]}</div>
                <div><strong>Motorista atual:</strong> {currentDriverName}</div>
              </Summary>

              <div>
                <Label htmlFor="correct-order-type">Tipo do pedido</Label>
                <Select
                  id="correct-order-type"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as OrderType);
                    setError('');
                  }}
                >
                  <option value="entrega">Entrega</option>
                  <option value="retirada">Retirada</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="correct-order-driver">Motorista</Label>
                <Select
                  id="correct-order-driver"
                  required
                  value={driverId}
                  onChange={(event) => {
                    setDriverId(event.target.value);
                    setError('');
                  }}
                >
                  <option value="">Selecione...</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.username}
                    </option>
                  ))}
                </Select>
              </div>

              {error && <ErrorMessage>{error}</ErrorMessage>}
            </Section>
          </Body>

          <Footer>
            <CancelButton type="button" onClick={onClose} disabled={saving}>
              Cancelar
            </CancelButton>
            <SubmitButton type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar correção'}
            </SubmitButton>
          </Footer>
        </form>
      </Modal>
    </Overlay>
  );
};

export default CorrectOrderModal;
