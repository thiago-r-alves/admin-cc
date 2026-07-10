import React, { useEffect, useRef, useState } from 'react';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba, type OrderType } from '../interfaces';

const fieldClass = 'min-h-11 rounded-ui-md border border-gray-300 p-2 text-base focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus';

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
  const onClose = props.onClose;
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    const timer = window.setTimeout(() => firstInputRef.current?.focus(), 0);
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
    <div className="fixed inset-0 z-[1200] flex items-center justify-center overflow-y-auto bg-black/70 p-3 max-sm:items-start">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-cacamba-title" className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[500px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_60px_rgba(15,23,42,0.3)] max-sm:my-0">
        <div className="flex-none border-b border-gray-100 px-5 py-4 sm:px-8">
          <h2 id="edit-cacamba-title" className="m-0 text-xl font-bold sm:text-2xl">Editar Caçamba #{props.cacamba.numero}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 py-4 sm:px-8">
            <div className="flex flex-col">
              <label htmlFor="edit-cacamba-numero" className="mb-1 text-sm font-medium">Número da Caçamba *</label>
              <input ref={firstInputRef} id="edit-cacamba-numero" type="text" value={numero} onChange={(event) => setNumero(event.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex: 501" inputMode="numeric" maxLength={3} required className={fieldClass} />
            </div>

          <div className="flex flex-col">
            <label htmlFor="edit-cacamba-os" className="mb-1 text-sm font-medium">3 Últimos Dígitos da Ordem de serviço *</label>
            <input id="edit-cacamba-os" type="text" value={horaServicoDigitos} onChange={(event) => setHoraServicoDigitos(event.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex: 123" maxLength={3} inputMode="numeric" pattern="[0-9]{3}" required className={fieldClass} />
          </div>

          <div className="flex flex-col">
            <label htmlFor="edit-cacamba-tipo" className="mb-1 text-sm font-medium">Tipo</label>
            <select id="edit-cacamba-tipo" value={tipo} onChange={(event) => setTipo(event.target.value as OrderType)} required disabled={lockSelect} className={fieldClass}>
              {showEntrega && <option value="entrega">Entrega</option>}
              {showRetirada && <option value="retirada">Retirada</option>}
            </select>
          </div>

          {forcedTipo === 'retirada' && (
            <div className="flex flex-col">
              <label htmlFor="edit-cacamba-content-type" className="mb-1 text-sm font-medium">Tipo de conteúdo *</label>
              <select id="edit-cacamba-content-type" value={contentType} onChange={(event) => setContentType(event.target.value as CacambaContentType | '')} required className={fieldClass}>
                <option value="">Selecione...</option>
                {CACAMBA_CONTENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col">
            <label htmlFor="edit-cacamba-local" className="mb-1 text-sm font-medium">Local *</label>
            <select id="edit-cacamba-local" value={local} onChange={(event) => setLocal(event.target.value)} className={fieldClass}>
              <option value="via_publica">Via Pública</option>
              <option value="canteiro_obra">Canteiro de Obra</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor="edit-cacamba-imagem" className="mb-1 text-sm font-medium">Trocar imagem (opcional)</label>
            <input id="edit-cacamba-imagem" type="file" accept="image/*" onChange={handleFileChange} onClick={() => setImgError(null)} className={fieldClass} />
            {imgError && <p className="m-0 mt-2 text-sm text-red-500">{imgError}</p>}
          </div>
          </div>

          <div className="flex flex-none flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:px-8">
            {formError && <p role="alert" className="m-0 text-sm font-bold text-red-700">{formError}</p>}
            <div className="flex gap-3 max-sm:flex-col">
              <button type="submit" disabled={saving} className="flex-1 cursor-pointer rounded-ui-lg border-0 bg-brand p-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button type="button" onClick={props.onClose} disabled={saving} className="flex-1 cursor-pointer rounded-ui-lg border-0 bg-gray-200 p-3 text-base disabled:cursor-not-allowed disabled:opacity-60">
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCacambaModal;
