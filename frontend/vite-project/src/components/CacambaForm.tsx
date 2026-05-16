import React, { useState } from 'react';
import styled from 'styled-components';
import type { ICacamba, OrderType } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
    max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  background: rgba(17, 24, 39, 0.62);

  @media (max-width: 768px) {
    align-items: stretch;
    padding: 0;
  }
`;

const ModalContent = styled.div`
  width: min(720px, 94vw);
  max-height: min(90dvh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #fecaca;
  border-radius: 6px;
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
`;

const TitleAccent = styled.span`
  width: 4px;
  height: 28px;
  border-radius: 999px;
  background: #e30613;
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.2rem;
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
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: #fff1f2;
    color: #e30613;
  }
`;

const Form = styled.form`
  min-height: 0;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
`;

const ModalBody = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1.25rem;
  -webkit-overflow-scrolling: touch;
`;

const Section = styled.section`
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  color: #e30613;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div<{ $span?: 1 | 2 }>`
  min-width: 0;
  grid-column: span ${({ $span }) => $span || 1};

  @media (max-width: 640px) {
    grid-column: span 1;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  color: #4b5563;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.02em;
`;

const Input = styled.input`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.65rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 2px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const Select = styled.select`
  width: 100%;
  min-height: 43px;
  box-sizing: border-box;
  padding: 0.65rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 2px;
  background: #ffffff;
  color: #374151;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #e30613;
    box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.12);
  }
`;

const TypeBadge = styled.div`
  min-height: 43px;
  display: inline-flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 0.8rem;
  border: 1px solid #fecaca;
  border-radius: 2px;
  background: #fff5f5;
  color: #e30613;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const FileInputWrap = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const FileHint = styled.small`
  color: #6b7280;
  font-size: 0.78rem;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  background-color: #fef2f2;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #fecaca;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex: 0 0 auto;
  padding: 1rem 1.25rem;
  border-top: 1px solid #fee2e2;
  background: #ffffff;

  @media (max-width: 560px) {
    flex-direction: column-reverse;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  min-width: 150px;
  min-height: 42px;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#e30613' : '#d8b4b4')};
  border-radius: 2px;
  background: ${({ $variant }) => ($variant === 'primary' ? '#e30613' : '#ffffff')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : '#6b1f1f')};
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover:not(:disabled) {
    background: ${({ $variant }) => ($variant === 'primary' ? '#c9000b' : '#fff1f2')};
    border-color: #e30613;
    color: ${({ $variant }) => ($variant === 'primary' ? '#ffffff' : '#e30613')};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`;

interface CacambaFormProps {
  orderId: string;
  orderType: OrderType;
  onCacambaAdded: (c: ICacamba) => void;
  onClose: () => void;
  beforeUploadFiles?: (files: File[]) => Promise<{ allowed: File[]; error?: string }>; // alterado
}

const CacambaForm: React.FC<CacambaFormProps> = (props) => {
  const { orderId, orderType, onCacambaAdded, onClose, beforeUploadFiles } = props;
  const [numero, setNumero] = useState('');
  const [horaServicoDigitos, setHoraServicoDigitos] = useState('');
  const [local, setLocal] = useState<'via_publica' | 'canteiro_obra'>('via_publica');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');             // ErrorMessage único
  // REMOVA o estado não usado:
  // const [submitAttempted, setSubmitAttempted] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limpa a mensagem vermelha ao alterar a seleção
    setError('');

    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) {
      setFiles([]);
      return;
    }

    if (beforeUploadFiles) {
      const result = await beforeUploadFiles(incoming);
      setFiles(result.allowed);
      // Se houve bloqueio por duplicidade, mostra no ErrorMessage
      setError(result.error ?? '');
    } else {
      setFiles(incoming);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numero.trim()) {
      setError('Número da caçamba é obrigatório');
      return;
    }
    if (files.length === 0) {
      setError('Imagem é obrigatória');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('numero', numero);
      formData.append('tipo', orderType);
      formData.append('local', local);
      formData.append('horaServicoDigitos', horaServicoDigitos);
      files.forEach(file => formData.append('image', file));
      const apiUrl = import.meta.env.VITE_API_URL;

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/driver/orders/${orderId}/cacambas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao registrar caçamba');
      }

      const data = await response.json();
      onCacambaAdded(data.cacamba);

      // Reset form
      setNumero('');
      setHoraServicoDigitos('');
      setLocal('via_publica');
      setFiles([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar caçamba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <TitleWrap>
            <TitleAccent />
            <Title>Registrar Caçamba</Title>
          </TitleWrap>
          <CloseButton type="button" onClick={onClose} aria-label="Fechar modal">
            ×
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <Section>
              <SectionTitle>Dados da Caçamba</SectionTitle>
              <FieldGrid>
                <Field>
                  <Label htmlFor="cacamba-numero">Número da Caçamba</Label>
                  <Input
                    id="cacamba-numero"
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="Ex: 501"
                    required
                  />
                </Field>

                <Field>
                  <Label htmlFor="cacamba-os">3 últimos dígitos da OS</Label>
                  <Input
                    id="cacamba-os"
                    type="text"
                    value={horaServicoDigitos}
                    onChange={(e) => setHoraServicoDigitos(e.target.value)}
                    placeholder="Ex: 123"
                    maxLength={3}
                    inputMode="numeric"
                    pattern="[0-9]{3}"
                    required
                  />
                </Field>

                <Field>
                  <Label>Tipo</Label>
                  <TypeBadge>{orderType === 'entrega' ? 'Entrega' : 'Retirada'}</TypeBadge>
                </Field>

                <Field>
                  <Label htmlFor="cacamba-local">Local</Label>
                  <Select
                    id="cacamba-local"
                    value={local}
                    onChange={e => setLocal(e.target.value as 'via_publica' | 'canteiro_obra')}
                    required
                  >
                    <option value="via_publica">Via pública</option>
                    <option value="canteiro_obra">Canteiro de obra</option>
                  </Select>
                </Field>
              </FieldGrid>
            </Section>

            <Section>
              <SectionTitle>Imagem</SectionTitle>
              <FileInputWrap>
                <Label htmlFor="cacamba-imagem">Foto da caçamba</Label>
                <Input
                  id="cacamba-imagem"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  onClick={() => setError('')}
                />
                <FileHint>
                  {files.length > 0
                    ? `${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}.`
                    : 'Selecione uma ou mais imagens para registrar a caçamba.'}
                </FileHint>
              </FileInputWrap>
            </Section>

            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ModalBody>

          <ModalFooter>
            <Button type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" $variant="primary" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CacambaForm;
