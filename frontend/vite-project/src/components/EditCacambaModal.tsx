import React, { useState } from 'react';
import styled from 'styled-components';
import type { ICacamba } from '../interfaces';

interface EditCacambaModalProps {
  cacamba: ICacamba;
  onClose: () => void;
  onSave: (updated: Partial<ICacamba> & { image?: File | null }) => void;
}

// ====== Styled Components (iguais ao CacambaForm) ======
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

const FileInfo = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const SubmitButton = styled.button`
  flex: 1;
  background-color: #e30613;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #c9000b;
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
// ====== Fim dos Styled Components ======

const EditCacambaModal: React.FC<EditCacambaModalProps> = ({ cacamba, onClose, onSave }) => {
  const [numero, setNumero] = useState(cacamba.numero);
  const [tipo, setTipo] = useState<'entrega' | 'retirada'>(cacamba.tipo);
  const [local, setLocal] = useState<'via_publica' | 'canteiro_obra'>(
    (cacamba as any).local || 'via_publica'
  );
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      numero,
      tipo,
      local,
      image,
    });
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Editar Caçamba</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              Número da Caçamba
            </Label>
            <Input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <Label>
              Tipo
            </Label>
            <Select value={tipo} onChange={e => setTipo(e.target.value as 'entrega' | 'retirada')}>
              <option value="entrega">Entrega</option>
              <option value="retirada">Retirada</option>
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
            <Label>
              Nova Imagem
            </Label>
            <Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
            {image && (
              <FileInfo>
                Arquivo selecionado: {image.name}
              </FileInfo>
            )}
          </FormGroup>
          <ButtonGroup>
            <SubmitButton type="submit">Salvar</SubmitButton>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditCacambaModal;
