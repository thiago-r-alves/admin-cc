import React from 'react';
import styled, { keyframes } from 'styled-components';

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  fullHeight?: boolean;
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 80%, 100% {
    transform: scale(0.7);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const Wrapper = styled.div<{ $fullHeight: boolean }>`
  min-height: ${({ $fullHeight }) => ($fullHeight ? '100vh' : '240px')};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: linear-gradient(180deg, #f8fafc 0%, #fdf2f2 100%);
`;

const Card = styled.div`
  width: min(420px, 100%);
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
  padding: 1.25rem 1.15rem;
  text-align: center;
`;

const Spinner = styled.div`
  width: 42px;
  height: 42px;
  margin: 0 auto 0.9rem;
  border-radius: 50%;
  border: 4px solid #fee2e2;
  border-top-color: #e30613;
  animation: ${spin} 0.9s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: clamp(1.05rem, 2vw, 1.28rem);
  font-weight: 900;
`;

const Subtitle = styled.p`
  margin: 0.45rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
`;

const Dots = styled.div`
  margin-top: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #e30613;
    animation: ${pulse} 1s ease-in-out infinite;
  }

  span:nth-child(2) {
    animation-delay: 0.14s;
  }

  span:nth-child(3) {
    animation-delay: 0.28s;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
      opacity: 0.8;
      transform: none;
    }
  }
`;

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = 'Sistema carregando...',
  subtitle = 'Estamos preparando os dados para você.',
  fullHeight = true,
}) => {
  return (
    <Wrapper $fullHeight={fullHeight}>
      <Card role="status" aria-live="polite" aria-busy="true">
        <Spinner aria-hidden="true" />
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <Dots aria-hidden="true">
          <span />
          <span />
          <span />
        </Dots>
      </Card>
    </Wrapper>
  );
};

export default LoadingScreen;
