import React, { useState } from 'react';
import styled from 'styled-components';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba, type OrderType } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
`;

const ModalContent = styled.div`
  width: 90%;
  max-width: 500px;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  background-color: white;
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
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
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #e30613;
  color: white;
`;

const CancelButton = styled(Button)`
  background-color: #e5e7eb;
`;

const ErrorText = styled.p`
  margin: 0.5rem 0 0;
  color: #ef4444;
  font-size: 0.875rem;
`;

type UploadGuardResult = { allowed: File[]; error?: string };

interface EditCacambaModalProps {
  cacamba: ICacamba;
  orderType?: OrderType;
  onClose: () => void;
  onUpdate: (updated: Partial<ICacamba> & { image?: File | null }) => Promise<void>;
  beforeUploadFiles?: (files: File[]) => Promise<UploadGuardResult>;
}

const getForcedTipo = (orderType: OrderType | undefined, cacamba: ICacamba): OrderType => {
  if (orderType === 'retirada' || orderType === 'entrega') return orderType;
  return cacamba.tipo === 'retirada' ? 'retirada' : 'entrega';
};

const EditCacambaModal: React.FC<EditCacambaModalProps> = ({ beforeUploadFiles, ...props }) => {
  const forcedTipo = getForcedTipo(props.orderType, props.cacamba);
  const [numero, setNumero] = useState(props.cacamba.numero);
  const [horaServicoDigitos, setHoraServicoDigitos] = useState(props.cacamba.horaServicoDigitos || '');
  const [tipo, setTipo] = useState<OrderType>(forcedTipo);
  const [contentType, setContentType] = useState<CacambaContentType | ''>(
    (props.cacamba.contentType || '') as CacambaContentType | '',
  );
  const [local, setLocal] = useState(props.cacamba.local || 'via_publica');
  const [file, setFile] = useState<File | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showEntrega = !props.orderType || props.orderType === 'entrega';
  const showRetirada = !props.orderType || props.orderType === 'retirada';
  const lockSelect = props.orderType === 'entrega' || props.orderType === 'retirada';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImgError(null);
    const incoming = Array.from(event.target.files || []);

    if (incoming.length === 0) {
      setFile(null);
      return;
    }

    if (!beforeUploadFiles) {
      setFile(incoming[0] || null);
      return;
    }

    const result = await beforeUploadFiles(incoming);
    setFile(result.allowed[0] || null);
    setImgError(result.allowed.length > 0 ? null : result.error ?? null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setFormError(null);

    const normalizedNumero = numero.trim();
    if (!normalizedNumero) {
      setFormError('Número da caçamba é obrigatório.');
      return;
    }

    const normalizedHoraServico = horaServicoDigitos.trim();
    if (!/^\d{3}$/.test(normalizedHoraServico)) {
      setFormError('Ordem de serviço deve conter exatamente 3 dígitos.');
      return;
    }

    if (forcedTipo === 'retirada' && !contentType) {
      setFormError('Tipo de conteúdo é obrigatório para retirada.');
      return;
    }

    setSaving(true);
    try {
      const updates: Partial<ICacamba> & { image?: File | null } = {
        numero: normalizedNumero,
        horaServicoDigitos: normalizedHoraServico,
        tipo,
        local,
      };
      if (forcedTipo === 'retirada') updates.contentType = contentType as CacambaContentType;
      if (file) updates.image = file;

      await props.onUpdate(updates);
      props.onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Editar Caçamba #{props.cacamba.numero}</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Número da Caçamba</Label>
            <Input
              type="text"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
              placeholder="Ex: 501"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>3 Últimos Dígitos da Ordem de serviço</Label>
            <Input
              type="text"
              value={horaServicoDigitos}
              onChange={(event) => setHoraServicoDigitos(event.target.value)}
              placeholder="Ex: 123"
              maxLength={3}
              inputMode="numeric"
              pattern="[0-9]{3}"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onChange={(event) => setTipo(event.target.value as OrderType)}
              required
              disabled={lockSelect}
            >
              {showEntrega && <option value="entrega">Entrega</option>}
              {showRetirada && <option value="retirada">Retirada</option>}
            </Select>
          </FormGroup>

          {forcedTipo === 'retirada' && (
            <FormGroup>
              <Label>Tipo de conteúdo</Label>
              <Select
                value={contentType}
                onChange={(event) => setContentType(event.target.value as CacambaContentType | '')}
                required
              >
                <option value="">Selecione...</option>
                {CACAMBA_CONTENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </FormGroup>
          )}

          <FormGroup>
            <Label>Local</Label>
            <Select value={local} onChange={(event) => setLocal(event.target.value)}>
              <option value="via_publica">Via Pública</option>
              <option value="canteiro_obra">Canteiro de Obra</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Trocar Imagem (Opcional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              onClick={() => setImgError(null)}
            />
            {imgError && <ErrorText>{imgError}</ErrorText>}
          </FormGroup>

          <ButtonGroup>
            <SubmitButton type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </SubmitButton>
            <CancelButton type="button" onClick={props.onClose} disabled={saving}>
              Cancelar
            </CancelButton>
          </ButtonGroup>
          {formError && <ErrorText>{formError}</ErrorText>}
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditCacambaModal;
