import React, { useState } from 'react'; // Remova 'useEffect' daqui
import styled from 'styled-components';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba, type OrderType } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
const ModalContent = styled.div`
  background-color: white; border-radius: 8px; padding: 1.5rem 2rem;
  width: 90%; max-width: 500px;
`;
const Title = styled.h2`
  margin: 0 0 1.5rem 0;
`;
const Form = styled.form`
  display: flex; flex-direction: column; gap: 1rem;
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column;
`;
const Label = styled.label`
  font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;
`;
const Input = styled.input`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;
`;
const Select = styled.select`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;
`;
const ButtonGroup = styled.div`
  display: flex; gap: 1rem; margin-top: 1.5rem;
`;
const Button = styled.button`
  flex: 1; padding: 0.75rem; border: none; border-radius: 6px; cursor: pointer;
  font-size: 1rem;
`;
const SubmitButton = styled(Button)`
  background-color: #e30613; color: white;
`;
const CancelButton = styled(Button)`
  background-color: #e5e7eb;
`;
const ErrorText = styled.p`
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0.5rem 0 0;
`;

interface EditCacambaModalProps {
  cacamba: ICacamba;
  orderType?: OrderType;
  onClose: () => void;
  onUpdate: (updated: Partial<ICacamba> & { image?: File | null }) => void;
  beforeUploadFiles?: (files: File[]) => Promise<{ allowed: File[]; error?: string }>; // alterado
}

const EditCacambaModal: React.FC<EditCacambaModalProps> = ({ beforeUploadFiles, ...props }) => {
  // força o tipo inicial conforme o tipo do pedido (mesma regra do adicionar)
  const forcedTipo: 'entrega' | 'retirada' =
    props.orderType === 'retirada'
      ? 'retirada'
      : props.orderType === 'entrega'
        ? 'entrega'
        : (props.cacamba.tipo === 'retirada' ? 'retirada' : 'entrega');

  const [numero, setNumero] = useState(props.cacamba.numero);
  const [horaServicoDigitos, setHoraServicoDigitos] = useState(props.cacamba.horaServicoDigitos || '');
  const [tipo, setTipo] = useState<'entrega' | 'retirada'>(forcedTipo);
  const [contentType, setContentType] = useState<CacambaContentType | ''>((props.cacamba.contentType || '') as CacambaContentType | '');
  const [formData, setFormData] = useState({ local: props.cacamba.local || 'via_publica' });
  const [file, setFile] = useState<File | null>(null);
  const [imgError, setImgError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // <-- ADICIONADO

  const apiUrl = import.meta.env.VITE_API_URL; // <-- ADICIONADO

  // quais opções mostrar (idêntico ao formulário de adicionar)
  const showEntrega = !props.orderType || props.orderType === 'entrega';
  const showRetirada = !props.orderType || props.orderType === 'retirada';

  // se o pedido não permite trocar o tipo, bloqueia o select
  const lockSelect = props.orderType === 'entrega' || props.orderType === 'retirada';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // limpa erros assim que o usuário seleciona/alterar o arquivo
    setImgError(null);

    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) {
      setFile(null);
      return;
    }

    if (beforeUploadFiles) {
      const result = await beforeUploadFiles(incoming);
      if (result.allowed.length > 0) {
        setFile(result.allowed[0]);
        setImgError(null);
      } else {
        setFile(null);
        setImgError(result.error ?? null);
      }
    } else {
      setFile(incoming[0] || null);
      setImgError(null);
    }
  };

  // SUBSTITUÍDO: agora faz a requisição PATCH diretamente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('numero', numero);
      fd.append('horaServicoDigitos', horaServicoDigitos);
      fd.append('tipo', tipo);
      if (forcedTipo === 'retirada') {
        if (!contentType) {
          setFormError('Tipo de conteúdo é obrigatório para retirada.');
          setSaving(false);
          return;
        }
        fd.append('contentType', contentType);
      }
      fd.append('local', formData.local || ''); // Adicionar fallback para string vazia
      if (file) fd.append('image', file);

      const token = localStorage.getItem('token') || '';
      const resp = await fetch(`${apiUrl}/cacambas/${props.cacamba._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (!resp.ok) {
        console.error('Falha ao atualizar caçamba');
      } else {
        const data = await resp.json();
        // mantém compatibilidade: envia objeto retornado (possui os campos esperados)
        props.onUpdate(data.cacamba || { numero, tipo, local: formData.local, imageUrl: props.cacamba.imageUrl });
        props.onClose();
      }
    } catch (err) {
      console.error('Erro na atualização da caçamba', err);
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
              onChange={e => setNumero(e.target.value)}
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
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onChange={e => setTipo(e.target.value as 'entrega' | 'retirada')}
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
                onChange={e => setContentType(e.target.value as CacambaContentType | '')}
                required
              >
                <option value="">Selecione...</option>
                {CACAMBA_CONTENT_TYPES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
            </FormGroup>
          )}

          <FormGroup>
            <Label>Local</Label>
            <Select name="local" value={formData.local} onChange={handleChange}>
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
              onClick={() => setImgError(null)} // limpa ao abrir o seletor
            />
            {imgError && <ErrorText>{imgError}</ErrorText>}
          </FormGroup>

          <ButtonGroup>
            <SubmitButton type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</SubmitButton>
            <CancelButton type="button" onClick={props.onClose} disabled={saving}>Cancelar</CancelButton>
          </ButtonGroup>
          {formError && <ErrorText>{formError}</ErrorText>}
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditCacambaModal;
