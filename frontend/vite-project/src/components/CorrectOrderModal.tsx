import React, { useMemo, useState } from 'react';
import type { IDriver, IOrder, OrderType } from '../interfaces';
import { formatDriverName } from '../utils/formatDriverName';
import { twComponent } from '../utils/twComponent';

const fieldClass = 'min-h-[42px] w-full rounded-ui-md border border-brand-border bg-white px-[0.7rem] py-[0.6rem] text-[0.9rem] text-gray-700 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus';
const footerButtonClass = 'min-h-[42px] min-w-[150px] cursor-pointer rounded-ui-md px-4 py-[0.7rem] text-[0.82rem] font-black uppercase max-[560px]:w-full';

const Overlay = twComponent('div', 'fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-4');
const Modal = twComponent('div', 'flex max-h-[min(90dvh,720px)] w-[min(560px,96vw)] flex-col overflow-hidden rounded-[10px] border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] max-[640px]:h-[100dvh] max-[640px]:max-h-[100dvh] max-[640px]:w-screen max-[640px]:rounded-none');
const Header = twComponent('div', 'flex items-center justify-between gap-4 border-b border-red-100 px-5 py-4');
const Title = twComponent('h2', 'm-0 text-[1.1rem] font-black text-gray-950');
const CloseButton = twComponent('button', 'h-[34px] w-[34px] cursor-pointer rounded-ui-lg border-0 bg-transparent text-[1.55rem] leading-none text-gray-500 hover:bg-brand-soft hover:text-brand');
const Body = twComponent('div', 'flex-auto overflow-y-auto p-5');
const Intro = twComponent('p', 'm-0 mb-4 leading-normal text-gray-600');
const Section = twComponent('section', 'grid gap-[0.85rem]');
const Label = twComponent('label', 'mb-[0.35rem] block text-[0.72rem] font-black uppercase tracking-[0.02em] text-gray-600');
const Select = twComponent('select', fieldClass);
const Input = twComponent('input', fieldClass);
const Summary = twComponent('div', 'rounded-lg border border-red-100 bg-[#fffafa] px-4 py-[0.95rem] text-[0.88rem] leading-[1.55] text-gray-700 [&_strong]:text-gray-950');
const ErrorMessage = twComponent('p', 'm-0 mt-[0.2rem] text-sm font-bold text-red-500');
const Footer = twComponent('div', 'flex justify-end gap-3 border-t border-red-100 bg-[#fffafa] px-5 py-4 max-[560px]:flex-col-reverse');
const CancelButton = twComponent('button', `${footerButtonClass} border border-brand-border bg-white text-[#6b1f1f]`);
const SubmitButton = twComponent('button', `${footerButtonClass} border border-brand bg-brand text-white disabled:cursor-not-allowed disabled:border-[#f39aa0] disabled:bg-[#f39aa0]`);

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
  const [cacambaPrice, setCacambaPrice] = useState(
    typeof order.cacambaPrice === 'number' && Number.isFinite(order.cacambaPrice) ? String(order.cacambaPrice) : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentDriverName = useMemo(() => {
    const driverName =
      typeof order.motorista === 'object' && order.motorista?.username
        ? order.motorista.username
        : drivers.find((driver) => driver._id === getDriverId(order))?.username;
    return formatDriverName(driverName);
  }, [drivers, order]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!driverId) {
      setError('Selecione um motorista para continuar.');
      return;
    }
    const parsedCacambaPrice = Number(cacambaPrice.replace(',', '.'));
    if (type === 'entrega' && (!Number.isFinite(parsedCacambaPrice) || parsedCacambaPrice <= 0)) {
      setError('Informe o valor da caçamba para pedidos de entrega.');
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
        body: JSON.stringify({
          type,
          motorista: driverId,
          ...(Number.isFinite(parsedCacambaPrice) && parsedCacambaPrice > 0 ? { cacambaPrice: parsedCacambaPrice } : {}),
        }),
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

              {type && (
                <div>
                  <Label htmlFor="correct-order-cacamba-price">Valor da caçamba (R$)</Label>
                  <Input
                    id="correct-order-cacamba-price"
                    type="text"
                    value={cacambaPrice}
                    onChange={(event) => {
                      setCacambaPrice(event.target.value);
                      setError('');
                    }}
                    placeholder="Ex: 180,00"
                    inputMode="decimal"
                    required={type === 'entrega'}
                  />
                </div>
              )}

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
                      {formatDriverName(driver.username)}
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
