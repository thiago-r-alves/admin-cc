import React, { useRef, useState } from 'react';
import { CACAMBA_CONTENT_TYPES, type CacambaContentType, type ICacamba } from '../interfaces';
import { cn } from '../utils/cn';

const fieldClass = 'box-border min-h-10 w-full max-w-full rounded-ui-md border border-gray-300 px-[0.6rem] py-2';

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
  const shouldCloseOnMouseUpRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    shouldCloseOnMouseUpRef.current = event.target === event.currentTarget;
  };

  const handleOverlayMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (shouldCloseOnMouseUpRef.current && event.target === event.currentTarget) {
      onClose();
    }
    shouldCloseOnMouseUpRef.current = false;
  };

  return (
    <div onMouseDown={handleOverlayMouseDown} onMouseUp={handleOverlayMouseUp} className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(17,24,39,0.62)] p-4">
      <div
        onMouseDown={() => {
          shouldCloseOnMouseUpRef.current = false;
        }}
        onMouseUp={(e) => e.stopPropagation()}
        className="w-[min(460px,96vw)] max-w-full rounded-lg border border-red-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.3)]"
      >
        <div className="flex items-center justify-between border-b border-red-100 px-[1.1rem] py-4">
          <h3 className="m-0 text-base font-black text-gray-950">
            {mode === 'contentType' ? 'Editar tipo de conteúdo' : (cacamba.price ? 'Editar valor da caçamba' : 'Adicionar valor da caçamba')}
          </h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="cursor-pointer border-0 bg-transparent text-[1.4rem] leading-none text-gray-500">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} onClick={(event) => event.stopPropagation()} className="w-full max-w-full">
          <div className="grid gap-3 px-[1.1rem] py-4">
            {mode === 'contentType' ? (
              <>
                <label htmlFor="cacamba-content-type" className="text-[0.76rem] font-black uppercase text-gray-600">Tipo de conteúdo</label>
                <select
                  id="cacamba-content-type"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as CacambaContentType | '')}
                  required
                  className={fieldClass}
                >
                  <option value="">Selecione...</option>
                  {CACAMBA_CONTENT_TYPES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label htmlFor="cacamba-price" className="text-[0.76rem] font-black uppercase text-gray-600">Valor (R$)</label>
                <input
                  id="cacamba-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className={fieldClass}
                />
              </>
            )}
            {error && <div className="rounded-ui-md border border-red-200 bg-red-50 px-[0.7rem] py-[0.6rem] text-[0.82rem] text-red-700">{error}</div>}
          </div>

          <div className="flex justify-end gap-[0.6rem] border-t border-red-100 px-[1.1rem] py-[0.9rem]">
            <button type="button" onClick={onClose} disabled={saving} className="box-border min-h-[38px] cursor-pointer rounded-ui-md border border-gray-300 bg-white px-[0.85rem] py-[0.55rem] text-[0.8rem] font-black uppercase text-gray-700">Cancelar</button>
            <button
              type="submit"
              disabled={saving}
              onClick={(event) => event.stopPropagation()}
              className={cn('box-border min-h-[38px] cursor-pointer rounded-ui-md border px-[0.85rem] py-[0.55rem] text-[0.8rem] font-black uppercase', 'border-brand bg-brand text-white')}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CacambaMetaModal;
