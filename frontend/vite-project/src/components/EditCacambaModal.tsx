import React, { useState } from 'react';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba, type OrderType } from '../interfaces';

const fieldClass = 'rounded-ui-md border border-gray-300 p-2';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="w-[90%] max-w-[500px] rounded-lg bg-white px-8 py-6">
        <h2 className="m-0 mb-6 text-2xl font-bold">Editar Caçamba #{props.cacamba.numero}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Número da Caçamba</label>
            <input type="text" value={numero} onChange={(event) => setNumero(event.target.value)} placeholder="Ex: 501" required className={fieldClass} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">3 Últimos Dígitos da Ordem de serviço</label>
            <input type="text" value={horaServicoDigitos} onChange={(event) => setHoraServicoDigitos(event.target.value)} placeholder="Ex: 123" maxLength={3} inputMode="numeric" pattern="[0-9]{3}" required className={fieldClass} />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Tipo</label>
            <select value={tipo} onChange={(event) => setTipo(event.target.value as OrderType)} required disabled={lockSelect} className={fieldClass}>
              {showEntrega && <option value="entrega">Entrega</option>}
              {showRetirada && <option value="retirada">Retirada</option>}
            </select>
          </div>

          {forcedTipo === 'retirada' && (
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium">Tipo de conteúdo</label>
              <select value={contentType} onChange={(event) => setContentType(event.target.value as CacambaContentType | '')} required className={fieldClass}>
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
            <label className="mb-1 text-sm font-medium">Local</label>
            <select value={local} onChange={(event) => setLocal(event.target.value)} className={fieldClass}>
              <option value="via_publica">Via Pública</option>
              <option value="canteiro_obra">Canteiro de Obra</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Trocar Imagem (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} onClick={() => setImgError(null)} className={fieldClass} />
            {imgError && <p className="m-0 mt-2 text-sm text-red-500">{imgError}</p>}
          </div>

          <div className="mt-6 flex gap-4">
            <button type="submit" disabled={saving} className="flex-1 cursor-pointer rounded-ui-lg border-0 bg-brand p-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button type="button" onClick={props.onClose} disabled={saving} className="flex-1 cursor-pointer rounded-ui-lg border-0 bg-gray-200 p-3 text-base disabled:cursor-not-allowed disabled:opacity-60">
              Cancelar
            </button>
          </div>
          {formError && <p className="m-0 mt-2 text-sm text-red-500">{formError}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditCacambaModal;
