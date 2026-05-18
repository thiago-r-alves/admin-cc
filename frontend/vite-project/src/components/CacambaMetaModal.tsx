import React, { useState } from 'react';
import styled from 'styled-components';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba } from '../interfaces';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(17, 24, 39, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const Modal = styled.div`
  width: min(460px, 96vw);
  max-width: 100%;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.3);
`;

const Header = styled.div`
  padding: 1rem 1.1rem;
  border-bottom: 1px solid #fee2e2;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1rem;
  font-weight: 900;
`;

const CloseButton = styled.button`
  border: 0;
  background: transparent;
  color: #6b7280;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
`;

const Body = styled.div`
  padding: 1rem 1.1rem;
  display: grid;
  gap: 0.75rem;
`;

const Label = styled.label`
  color: #4b5563;
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Select = styled.select`
  width: 100%;
  max-width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.5rem 0.6rem;
`;

const Input = styled.input`
  width: 100%;
  max-width: 100%;
  min-height: 40px;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.5rem 0.6rem;
`;

const ErrorMessage = styled.div`
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 0.6rem 0.7rem;
  font-size: 0.82rem;
`;

const Footer = styled.div`
  padding: 0.9rem 1.1rem;
  border-top: 1px solid #fee2e2;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 38px;
  padding: 0.55rem 0.85rem;
  box-sizing: border-box;
  border-radius: 4px;
  border: 1px solid ${({ $primary }) => ($primary ? '#e30613' : '#d1d5db')};
  background: ${({ $primary }) => ($primary ? '#e30613' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#374151')};
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
`;

const Form = styled.form`
  width: 100%;
  max-width: 100%;
`;

interface CacambaMetaModalProps {
  mode: 'contentType' | 'price';
  cacamba: ICacamba;
  onClose: () => void;
  onSave: (updates: { contentType?: CacambaContentType; price?: number }) => Promise<void>;
}

const CacambaMetaModal: React.FC<CacambaMetaModalProps> = ({ mode, cacamba, onClose, onSave }) => {
  const [contentType, setContentType] = useState<CacambaContentType | ''>((cacamba.contentType || '') as CacambaContentType | '');
  const [price, setPrice] = useState(
    typeof cacamba.price === 'number' && Number.isFinite(cacamba.price) ? String(cacamba.price) : ''
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'contentType') {
      if (!contentType) {
        setError('Selecione o tipo de conteúdo.');
        return;
      }
    } else {
      if (!price.trim()) {
        setError('Informe o valor da caçamba.');
        return;
      }
      const parsed = Number(price.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Informe um valor válido (>= 0).');
        return;
      }
    }

    setSaving(true);
    try {
      if (mode === 'contentType') {
        await onSave({ contentType: contentType as CacambaContentType });
      } else {
        await onSave({ price: Number(price.replace(',', '.')) });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            {mode === 'contentType' ? 'Editar tipo de conteúdo' : (cacamba.price ? 'Editar valor da caçamba' : 'Adicionar valor da caçamba')}
          </Title>
          <CloseButton type="button" onClick={onClose} aria-label="Fechar">
            ×
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <Body>
            {mode === 'contentType' ? (
              <>
                <Label htmlFor="cacamba-content-type">Tipo de conteúdo</Label>
                <Select
                  id="cacamba-content-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as CacambaContentType | '')}
                  required
                >
                  <option value="">Selecione...</option>
                  {CACAMBA_CONTENT_TYPES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              </>
            ) : (
              <>
                <Label htmlFor="cacamba-price">Valor (R$)</Label>
                <Input
                  id="cacamba-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </>
            )}
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </Body>

          <Footer>
            <Button type="button" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" $primary disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Footer>
        </Form>
      </Modal>
    </Overlay>
  );
};

export default CacambaMetaModal;
