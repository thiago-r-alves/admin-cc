import React from 'react';

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Foto ampliada da caçamba" className="fixed inset-0 z-[2000] box-border flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] items-center justify-center">
        <button ref={closeRef} type="button" onClick={onClose} className="absolute right-2 top-2 z-10 min-h-11 min-w-11 rounded-full border border-white bg-black/75 text-2xl font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white" aria-label="Fechar foto ampliada">×</button>
        <img src={url} alt="Imagem ampliada" className="h-auto max-h-[calc(100dvh-32px)] w-auto max-w-[calc(100vw-32px)] rounded-lg bg-white object-contain" />
      </div>
    </div>
  );
};

export default ImageModal;
