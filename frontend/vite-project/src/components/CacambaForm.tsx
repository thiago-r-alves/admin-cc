import React, { useState } from 'react';
import styled from 'styled-components';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba, type OrderType } from '../interfaces';
import { Button as UIButton, Field as UIField, SelectInput, TextInput } from '../components/ui';

const ModalOverlay = styled.div`position: fixed; inset: 0; z-index: 1000; display:flex; align-items:center; justify-content:center; padding:max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); background: rgba(17, 24, 39, 0.62); @media (max-width: 768px) { align-items: stretch; padding: 0; }`;
const ModalContent = styled.div`width:min(720px,94vw); max-height:min(90dvh,760px); display:flex; flex-direction:column; overflow:hidden; border:1px solid #fecaca; border-radius:6px; background:#fff; box-shadow:0 24px 70px rgba(15,23,42,.28); @media (max-width:768px){ width:100vw; height:100dvh; max-height:100dvh; border-radius:0; }`;
const ModalHeader = styled.div`display:flex; align-items:center; justify-content:space-between; gap:1rem; flex:0 0 auto; padding:1rem 1.25rem; border-bottom:1px solid #fee2e2;`;
const TitleWrap = styled.div`display:flex; align-items:center; gap:.75rem;`;
const TitleAccent = styled.span`width:4px; height:28px; border-radius:999px; background:#e30613;`;
const Title = styled.h2`margin:0; color:#111827; font-size:1.2rem; font-weight:900;`;
const CloseButton = styled(UIButton)`width:34px; height:34px; min-height:34px; min-width:34px; padding:0; font-size:1.55rem; line-height:1;`;
const Form = styled.form`min-height:0; display:flex; flex:1 1 auto; flex-direction:column;`;
const ModalBody = styled.div`flex:1 1 auto; overflow-y:auto; padding:1.25rem;`;
const Section = styled.section`padding-bottom:1.25rem; margin-bottom:1.25rem; border-bottom:1px solid #f3f4f6; &:last-child{margin-bottom:0;}`;
const SectionTitle = styled.h3`display:flex; align-items:center; gap:.5rem; margin:0 0 1rem; color:#e30613; font-size:.78rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase;`;
const FieldGrid = styled.div`display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; @media (max-width:640px){grid-template-columns:1fr;}`;
const GridField = styled.div<{ $span?: 1 | 2 }>`min-width:0; grid-column:span ${({ $span }) => $span || 1}; @media (max-width:640px){grid-column:span 1;}`;
const TypeBadge = styled.div`min-height:43px; display:inline-flex; align-items:center; width:100%; box-sizing:border-box; padding:.65rem .8rem; border:1px solid #fecaca; border-radius:2px; background:#fff5f5; color:#e30613; font-size:.82rem; font-weight:900; letter-spacing:.04em; text-transform:uppercase;`;
const FileInputWrap = styled.div`display:grid; gap:.55rem;`;
const FileHint = styled.small`color:#6b7280; font-size:.78rem;`;
const ErrorMessage = styled.div`color:#dc2626; font-size:.875rem; background:#fef2f2; padding:.75rem; border-radius:4px; border:1px solid #fecaca;`;
const ModalFooter = styled.div`display:flex; justify-content:flex-end; gap:.75rem; flex:0 0 auto; padding:1rem 1.25rem; border-top:1px solid #fee2e2; @media (max-width:560px){flex-direction:column-reverse;}`;
const FooterButton = styled(UIButton)`min-width:150px; @media (max-width:560px){width:100%;}`;

interface CacambaFormProps { orderId: string; orderType: OrderType; onCacambaAdded: (c: ICacamba) => void; onClose: () => void; beforeUploadFiles?: (files: File[]) => Promise<{ allowed: File[]; error?: string }>; }

const CacambaForm: React.FC<CacambaFormProps> = ({ orderId, orderType, onCacambaAdded, onClose, beforeUploadFiles }) => {
  const [numero, setNumero] = useState('');
  const [horaServicoDigitos, setHoraServicoDigitos] = useState('');
  const [local, setLocal] = useState<'via_publica' | 'canteiro_obra'>('via_publica');
  const [contentType, setContentType] = useState<CacambaContentType | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) { setFiles([]); return; }
    if (beforeUploadFiles) {
      const result = await beforeUploadFiles(incoming);
      setFiles(result.allowed);
      setError(result.error ?? '');
    } else {
      setFiles(incoming);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) return setError('Número da caçamba é obrigatório');
    if (files.length === 0) return setError('Imagem é obrigatória');
    if (orderType === 'retirada' && !contentType) return setError('Tipo de conteúdo é obrigatório para retirada.');

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('numero', numero);
      formData.append('tipo', orderType);
      formData.append('local', local);
      formData.append('horaServicoDigitos', horaServicoDigitos);
      if (orderType === 'retirada') formData.append('contentType', contentType);
      files.forEach(file => formData.append('image', file));
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/driver/orders/${orderId}/cacambas`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao registrar caçamba');
      }
      const data = await response.json();
      onCacambaAdded(data.cacamba);
      setNumero(''); setHoraServicoDigitos(''); setLocal('via_publica'); setContentType(''); setFiles([]);
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
          <TitleWrap><TitleAccent /><Title>Registrar Caçamba</Title></TitleWrap>
          <CloseButton type="button" variant="ghost" onClick={onClose} aria-label="Fechar modal">X</CloseButton>
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <Section>
              <SectionTitle>Dados da Caçamba</SectionTitle>
              <FieldGrid>
                <GridField><UIField label="Número da Caçamba" htmlFor="cacamba-numero"><TextInput id="cacamba-numero" type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 501" required /></UIField></GridField>
                <GridField><UIField label="3 Últimos Dígitos da OS" htmlFor="cacamba-os"><TextInput id="cacamba-os" type="text" value={horaServicoDigitos} onChange={(e) => setHoraServicoDigitos(e.target.value)} placeholder="Ex: 123" maxLength={3} inputMode="numeric" pattern="[0-9]{3}" required /></UIField></GridField>
                <GridField><UIField label="Tipo"><TypeBadge>{orderType === 'entrega' ? 'Entrega' : 'Retirada'}</TypeBadge></UIField></GridField>
                <GridField><UIField label="Local" htmlFor="cacamba-local"><SelectInput id="cacamba-local" value={local} onChange={e => setLocal(e.target.value as 'via_publica' | 'canteiro_obra')} required><option value="via_publica">Via pública</option><option value="canteiro_obra">Canteiro de obra</option></SelectInput></UIField></GridField>
                {orderType === 'retirada' && <GridField $span={2}><UIField label="Tipo de conteúdo" htmlFor="cacamba-content-type"><SelectInput id="cacamba-content-type" value={contentType} onChange={e => setContentType(e.target.value as CacambaContentType | '')} required><option value="">Selecione...</option>{CACAMBA_CONTENT_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}</SelectInput></UIField></GridField>}
              </FieldGrid>
            </Section>
            <Section>
              <SectionTitle>Imagem</SectionTitle>
              <FileInputWrap>
                <UIField label="Foto da caçamba" htmlFor="cacamba-imagem"><TextInput id="cacamba-imagem" type="file" multiple accept="image/*" onChange={handleFileChange} onClick={() => setError('')} /></UIField>
                <FileHint>{files.length > 0 ? `${files.length} arquivo${files.length > 1 ? 's' : ''} selecionado${files.length > 1 ? 's' : ''}.` : 'Selecione uma ou mais imagens para registrar a caçamba.'}</FileHint>
              </FileInputWrap>
            </Section>
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ModalBody>
          <ModalFooter>
            <FooterButton type="button" variant="secondary" onClick={onClose}>Cancelar</FooterButton>
            <FooterButton type="submit" variant="primary" loading={loading}>{loading ? 'Registrando...' : 'Registrar'}</FooterButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CacambaForm;
