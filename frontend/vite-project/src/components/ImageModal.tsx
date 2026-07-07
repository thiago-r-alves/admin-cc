import React from 'react';

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  return (
    <div onClick={onClose} className="fixed inset-0 z-[2000] box-border flex items-center justify-center bg-black/80 p-4">
      <div onClick={(event) => event.stopPropagation()} className="flex max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] items-center justify-center">
        <img src={url} alt="Imagem ampliada" className="h-auto max-h-[calc(100dvh-32px)] w-auto max-w-[calc(100vw-32px)] rounded-lg bg-white object-contain" />
      </div>
    </div>
  );
};

export default ImageModal;
