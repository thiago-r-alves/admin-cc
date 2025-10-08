import React, { useState } from 'react';
import styled from 'styled-components';
import type { ICacamba } from '../interfaces';

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 28rem;
  margin: 0 1rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
      width: -webkit-fill-available;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  background-color: #fef2f2;
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #fecaca;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const SubmitButton = styled.button`
  flex: 1;
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #1d4ed8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  background-color: #d1d5db;
  color: #374151;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #9ca3af;
  }
`;

interface CacambaFormProps {
  orderId: string;
  orderType: 'entrega' | 'retirada' | 'troca';
  onCacambaAdded: (c: ICacamba) => void;
  onClose: () => void;
  beforeUploadFiles?: (files: File[]) => Promise<{ allowed: File[]; error?: string }>; // alterado
}

const CacambaForm: React.FC<CacambaFormProps> = (props) => {
  const { orderId, orderType, onCacambaAdded, onClose, beforeUploadFiles } = props;
  const [numero, setNumero] = useState('');
  const [horaServicoDigitos, setHoraServicoDigitos] = useState('');
  const [tipo, setTipo] = useState<'entrega' | 'retirada'>('entrega');
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
      formData.append('tipo', tipo);
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
      setTipo('entrega');
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
    <ModalOverlay>
      <ModalContent>
        <Title>Registrar Caçamba</Title>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              Número da Caçamba
            </Label>
            <Input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 501"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>3 Últimos Dígitos da Ordem de serviço</Label>
            <Input
              type="text"
              value={horaServicoDigitos}
              onChange={(e) => setHoraServicoDigitos(e.target.value)}
              placeholder="Ex: 123"
              maxLength={3}
              inputMode="numeric"
              pattern="[0-9]{3}"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>
              Tipo
            </Label>
            <Select
              value={tipo}
              onChange={e => setTipo(e.target.value as 'entrega' | 'retirada')}
              required
            >
              {(orderType === 'entrega' || orderType === 'troca') && (
                <option value="entrega">Entrega</option>
              )}
              {(orderType === 'retirada' || orderType === 'troca') && (
                <option value="retirada">Retirada</option>
              )}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>
              Local
            </Label>
            <Select
              value={local}
              onChange={e => setLocal(e.target.value as 'via_publica' | 'canteiro_obra')}
              required
            >
              <option value="via_publica">Via pública</option>
              <option value="canteiro_obra">Canteiro de obra</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Imagem</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              onClick={() => setError('')}
            />
          </FormGroup>

          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          <ButtonGroup>
            <SubmitButton
              type="submit"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </SubmitButton>
            <CancelButton
              type="button"
              onClick={onClose}
            >
              Cancelar
            </CancelButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CacambaForm;
