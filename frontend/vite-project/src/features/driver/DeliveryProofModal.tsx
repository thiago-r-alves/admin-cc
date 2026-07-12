import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { IOrder } from '../../interfaces';

export type DeliveryProofSubmitPayload =
  | { type: 'signed'; signatureDataUrl: string }
  | { type: 'no_responsible'; note?: string };

type Props = {
  order: IOrder;
  onClose: () => void;
  onSubmit: (proof: DeliveryProofSubmitPayload) => Promise<void>;
};

export const DeliveryProofModal = ({ order, onClose, onSubmit }: Props) => {
  const [mode, setMode] = useState<'signed' | 'no_responsible'>('signed');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#111827';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setHasSignature(false);
  }, []);

  useEffect(() => clearSignature(), [clearSignature]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (mode === 'signed' && !hasSignature) {
      setError('Colete a assinatura pelo recebimento da locação.');
      return;
    }
    if (mode === 'no_responsible' && !confirmed) {
      setError('Confirme que não havia responsável no local.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(mode === 'signed'
        ? { type: 'signed', signatureDataUrl: canvasRef.current!.toDataURL('image/png') }
        : { type: 'no_responsible', note: note.trim() });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível concluir o pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-gray-950/65 p-4 max-[720px]:items-stretch max-[720px]:p-0" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="delivery-proof-title" className="flex max-h-[92dvh] w-[min(680px,94vw)] flex-col overflow-hidden rounded-ui-lg border border-red-200 bg-white shadow-2xl max-[720px]:h-dvh max-[720px]:max-h-dvh max-[720px]:w-screen max-[720px]:rounded-none">
        <div className="flex items-start justify-between gap-4 border-b border-red-100 p-4">
          <div><h2 id="delivery-proof-title" className="m-0 text-lg font-black">Comprovante da locação</h2><p className="m-0 mt-1 text-sm text-gray-500">Pedido #{order.orderNumber ?? '-'} • {order.clientName}</p></div>
          <button type="button" aria-label="Fechar" disabled={loading} onClick={onClose} className="h-9 w-9 rounded-ui-md border border-gray-300 bg-white text-xl">×</button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              <button type="button" onClick={() => setMode('signed')} className={`min-h-11 rounded-ui-md border px-3 font-black uppercase ${mode === 'signed' ? 'border-brand bg-brand-soft text-red-800' : 'border-gray-300 bg-white text-gray-700'}`}>Com assinatura</button>
              <button type="button" onClick={() => setMode('no_responsible')} className={`min-h-11 rounded-ui-md border px-3 font-black uppercase ${mode === 'no_responsible' ? 'border-brand bg-brand-soft text-red-800' : 'border-gray-300 bg-white text-gray-700'}`}>Sem responsável</button>
            </div>
            {mode === 'signed' ? (
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3"><strong className="text-sm uppercase text-gray-700">Assinatura</strong><button type="button" onClick={clearSignature} className="min-h-9 rounded-ui-md border border-gray-300 bg-white px-3 font-black">Limpar</button></div>
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={240}
                  aria-label="Área de assinatura pelo recebimento da locação"
                  className="h-[190px] w-full touch-none rounded-ui-md border border-gray-400 bg-white"
                  onPointerDown={(event) => { drawing.current = true; lastPoint.current = point(event); event.currentTarget.setPointerCapture(event.pointerId); }}
                  onPointerMove={(event) => { if (!drawing.current || !lastPoint.current) return; const next = point(event); const context = event.currentTarget.getContext('2d'); context?.beginPath(); context?.moveTo(lastPoint.current.x, lastPoint.current.y); context?.lineTo(next.x, next.y); context?.stroke(); lastPoint.current = next; setHasSignature(true); }}
                  onPointerUp={() => { drawing.current = false; lastPoint.current = null; }}
                  onPointerCancel={() => { drawing.current = false; lastPoint.current = null; }}
                />
              </div>
            ) : (
              <div className="grid gap-4">
                <label className="flex items-start gap-3 font-bold text-gray-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5" />Confirmo que não havia responsável no local.</label>
                <label className="grid gap-2 text-sm font-black uppercase text-gray-700">Observação<textarea aria-label="Observação" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 resize-y rounded-ui-md border border-gray-300 p-3 font-normal normal-case" /></label>
              </div>
            )}
            {error && <div role="alert" className="mt-4 rounded-ui-md border border-red-300 bg-red-50 p-3 font-bold text-red-900">{error}</div>}
          </div>
          <div className="flex justify-end gap-3 border-t border-red-100 p-4 max-[560px]:flex-col-reverse">
            <button type="button" disabled={loading} onClick={onClose} className="min-h-11 rounded-ui-md border border-gray-300 bg-white px-4 font-black">Cancelar</button>
            <button type="submit" disabled={loading} className="min-h-11 rounded-ui-md border border-brand bg-brand px-4 font-black text-white disabled:opacity-60">{loading ? 'Concluindo...' : mode === 'signed' ? 'Concluir pedido' : 'Concluir sem responsável'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
