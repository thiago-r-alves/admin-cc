import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  z-index: 1000;
`;

const ModalContent = styled.div`
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalImage = styled.img`
  width: auto;
  height: auto;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
`;

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(event) => event.stopPropagation()}>
        <ModalImage src={url} alt="Imagem ampliada" />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImageModal;
