import React, { useEffect, useRef, useState } from 'react';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba, type OrderType } from '../interfaces';
import { Button as UIButton, Field as UIField, SelectInput, TextInput } from '../components/ui';
import { twComponent } from '../utils/twComponent';
import { cn } from '../utils/cn';

const ModalOverlay = twComponent('div', 'fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-[max(16px,env(safe-area-inset-top))_max(16px,env(safe-area-inset-right))_max(16px,env(safe-area-inset-bottom))_max(16px,env(safe-area-inset-left))] max-[768px]:items-stretch max-[768px]:p-0');
const ModalContent = twComponent('div', 'flex max-h-[min(90dvh,760px)] w-[min(720px,94vw)] flex-col overflow-hidden rounded-ui-lg border border-red-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] max-[768px]:h-[100dvh] max-[768px]:max-h-[100dvh] max-[768px]:w-screen max-[768px]:rounded-none');
const ModalHeader = twComponent('div', 'flex flex-none items-center justify-between gap-4 border-b border-red-100 px-5 py-4');
const TitleWrap = twComponent('div', 'flex items-center gap-3');
const TitleAccent = twComponent('span', 'h-7 w-1 rounded-full bg-brand');
const Title = twComponent('h2', 'm-0 text-[1.2rem] font-black text-gray-950');
const CloseButton: React.FC<React.ComponentProps<typeof UIButton>> = ({ className, ...props }) => (
  <UIButton className={cn('h-[34px] min-h-[34px] w-[34px] min-w-[34px] p-0 text-[1.55rem] leading-none', className)} {...props} />
);
const Form = twComponent('form', 'flex min-h-0 flex-auto flex-col');
const ModalBody = twComponent('div', 'flex-auto overflow-y-auto p-5');
const Section = twComponent('section', 'mb-5 border-b border-gray-100 pb-5 last:mb-0');
const SectionTitle = twComponent('h3', 'm-0 mb-4 flex items-center gap-2 text-[0.78rem] font-black uppercase tracking-[0.04em] text-brand');
const FieldGrid = twComponent('div', 'grid grid-cols-2 gap-4 max-[640px]:grid-cols-1');
const GridField = twComponent<'div', { $span?: 1 | 2 }>('div', 'min-w-0 max-[640px]:col-span-1', ({ $span }) => ($span === 2 ? 'col-span-2' : 'col-span-1'));
const TypeBadge = twComponent('div', 'box-border inline-flex min-h-[43px] w-full items-center rounded-ui-sm border border-red-200 bg-[#fff5f5] px-[0.8rem] py-[0.65rem] text-[0.82rem] font-black uppercase tracking-[0.04em] text-brand');
const FileInputWrap = twComponent('div', 'grid gap-[0.55rem]');
const FileHint = twComponent('small', 'text-[0.78rem] text-gray-500');
const EmptyHint = twComponent('small', 'mt-[0.45rem] block text-[0.8rem] font-bold text-red-900');
const ErrorMessage = twComponent('div', 'sticky top-0 z-[2] mb-4 rounded-ui-md border border-red-300 bg-red-50 p-[0.85rem] text-[0.9rem] font-bold leading-[1.45] text-red-900 shadow-[0_4px_12px_rgba(153,27,27,0.08)]');
const ModalFooter = twComponent('div', 'flex flex-none justify-end gap-3 border-t border-red-100 px-5 py-4 max-[560px]:flex-col-reverse');
const FooterButton: React.FC<React.ComponentProps<typeof UIButton>> = ({ className, ...props }) => (
  <UIButton className={cn('min-w-[150px] max-[560px]:w-full', className)} {...props} />
);

interface CacambaFormProps { orderId: string; orderType: OrderType; onCacambaAdded: (c: ICacamba) => void; onClose: () => void; beforeUploadFiles?: (files: File[]) => Promise<{ allowed: File[]; error?: string }>; }

type AvailableCacamba = {
  numero: string;
  deliveredAt?: string | Date | null;
  deliveryOrderNumber?: number | null;
};

const formatDeliveredAt = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
};

const formatAvailableCacambaLabel = (cacamba: AvailableCacamba) => {
  const deliveredAt = formatDeliveredAt(cacamba.deliveredAt);
  return deliveredAt ? `${cacamba.numero} - entregue em ${deliveredAt}` : cacamba.numero;
};

const CacambaForm: React.FC<CacambaFormProps> = ({ orderId, orderType, onCacambaAdded, onClose, beforeUploadFiles }) => {
  const [numero, setNumero] = useState('');
  const [horaServicoDigitos, setHoraServicoDigitos] = useState('');
  const [local, setLocal] = useState<'via_publica' | 'canteiro_obra'>('via_publica');
  const [contentType, setContentType] = useState<CacambaContentType | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(orderType === 'retirada');
  const [availableCacambas, setAvailableCacambas] = useState<AvailableCacamba[]>([]);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    const timer = window.setTimeout(() => (firstFieldRef.current ?? focusable()[0])?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    errorRef.current?.focus({ preventScroll: true });
  }, [error]);

  useEffect(() => {
    if (orderType !== 'retirada') return;

    let active = true;
    const loadAvailableCacambas = async () => {
      setLoadingAvailable(true);
      setError('');
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/driver/orders/${orderId}/available-cacambas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};
        if (!response.ok) {
          throw new Error(data.message || 'Não foi possível carregar as caçambas disponíveis.');
        }
        if (active) setAvailableCacambas(Array.isArray(data.cacambas) ? data.cacambas : []);
      } catch (err) {
        if (active) {
          setAvailableCacambas([]);
          setError(err instanceof Error ? err.message : 'Não foi possível carregar as caçambas disponíveis.');
        }
      } finally {
        if (active) setLoadingAvailable(false);
      }
    };

    loadAvailableCacambas();
    return () => {
      active = false;
    };
  }, [orderId, orderType]);

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
    if (!/^\d{3}$/.test(numero)) {
      return setError('Número da caçamba deve conter exatamente 3 dígitos.');
    }
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
        const responseText = await response.text();
        let message = '';
        try {
          message = String(JSON.parse(responseText)?.message || '').trim();
        } catch {
          message = responseText.trim();
        }
        throw new Error(message || 'Não foi possível registrar a caçamba. Verifique os dados e tente novamente.');
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

  const isFormValid =
    /^\d{3}$/.test(numero) &&
    /^\d{3}$/.test(horaServicoDigitos) &&
    files.length > 0 &&
    Boolean(local) &&
    (orderType !== 'retirada' || Boolean(contentType));

  return (
    <ModalOverlay>
      <ModalContent ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="register-cacamba-title">
        <ModalHeader>
          <TitleWrap><TitleAccent /><Title id="register-cacamba-title">Registrar Caçamba</Title></TitleWrap>
          <CloseButton type="button" variant="ghost" onClick={onClose} aria-label="Fechar modal">X</CloseButton>
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            {error && (
              <ErrorMessage ref={errorRef} role="alert" aria-live="assertive" tabIndex={-1}>
                {error}
              </ErrorMessage>
            )}
            <Section>
              <SectionTitle>Dados da Caçamba</SectionTitle>
              <FieldGrid>
                <GridField>
                  <UIField label="Número da Caçamba" htmlFor="cacamba-numero" required>
                    {orderType === 'retirada' ? (
                      <>
                        <SelectInput
                          id="cacamba-numero"
                          autoFocus
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          disabled={loadingAvailable || availableCacambas.length === 0}
                          required
                        >
                          <option value="">
                            {loadingAvailable ? 'Carregando caçambas...' : 'Selecione a caçamba'}
                          </option>
                          {availableCacambas.map((cacamba) => (
                            <option key={cacamba.numero} value={cacamba.numero}>
                              {formatAvailableCacambaLabel(cacamba)}
                            </option>
                          ))}
                        </SelectInput>
                        {!loadingAvailable && availableCacambas.length === 0 && (
                          <EmptyHint>Nenhuma caçamba está disponível para retirada deste cliente.</EmptyHint>
                        )}
                      </>
                    ) : (
                      <TextInput
                        id="cacamba-numero"
                        ref={firstFieldRef}
                        type="text"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="Ex: 501"
                        maxLength={3}
                        inputMode="numeric"
                      />
                    )}
                  </UIField>
                </GridField>
                <GridField><UIField label="3 Últimos Dígitos da OS" htmlFor="cacamba-os" required><TextInput id="cacamba-os" type="text" value={horaServicoDigitos} onChange={(e) => setHoraServicoDigitos(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex: 123" maxLength={3} inputMode="numeric" pattern="[0-9]{3}" required /></UIField></GridField>
                <GridField><UIField label="Tipo"><TypeBadge>{orderType === 'entrega' ? 'Entrega' : 'Retirada'}</TypeBadge></UIField></GridField>
                <GridField><UIField label="Local" htmlFor="cacamba-local" required><SelectInput id="cacamba-local" value={local} onChange={e => setLocal(e.target.value as 'via_publica' | 'canteiro_obra')} required><option value="via_publica">Via pública</option><option value="canteiro_obra">Canteiro de obra</option></SelectInput></UIField></GridField>
                {orderType === 'retirada' && <GridField $span={2}><UIField label="Tipo de conteúdo" htmlFor="cacamba-content-type" required><SelectInput id="cacamba-content-type" value={contentType} onChange={e => setContentType(e.target.value as CacambaContentType | '')} required><option value="">Selecione...</option>{CACAMBA_CONTENT_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}</SelectInput></UIField></GridField>}
              </FieldGrid>
            </Section>
            <Section>
              <SectionTitle>Imagem</SectionTitle>
              <FileInputWrap>
                <UIField label="Foto da caçamba" htmlFor="cacamba-imagem" required>
                  <TextInput id="cacamba-imagem" type="file" accept="image/*" onChange={handleFileChange} onClick={() => setError('')} />
                </UIField>
                <FileHint>{files.length > 0 ? 'Foto pronta para envio.' : 'Selecione uma imagem para registrar a caçamba.'}</FileHint>
              </FileInputWrap>
            </Section>
          </ModalBody>
          <ModalFooter>
            <FooterButton type="button" variant="secondary" onClick={onClose}>Cancelar</FooterButton>
            <FooterButton
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!isFormValid || (orderType === 'retirada' && (loadingAvailable || availableCacambas.length === 0))}
            >
              {loading ? 'Registrando...' : 'Registrar'}
            </FooterButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CacambaForm;
