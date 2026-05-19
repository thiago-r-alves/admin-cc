import React from 'react';
import styled, { css } from 'styled-components';
import { uiTokens } from './tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const sizeStyles = {
  sm: css`
    min-height: 36px;
    padding: 0.55rem 0.8rem;
    font-size: 0.78rem;
  `,
  md: css`
    min-height: 42px;
    padding: 0.7rem 1rem;
    font-size: 0.82rem;
  `,
  lg: css`
    min-height: 46px;
    padding: 0.8rem 1.2rem;
    font-size: 0.9rem;
  `,
};

const variantStyles = {
  primary: css`
    border: 1px solid ${uiTokens.color.primary};
    background: ${uiTokens.color.primary};
    color: ${uiTokens.color.onPrimary};

    &:hover:not(:disabled) {
      background: ${uiTokens.color.primaryHover};
      border-color: ${uiTokens.color.primaryHover};
    }
  `,
  secondary: css`
    border: 1px solid ${uiTokens.color.borderSoft};
    background: ${uiTokens.color.bg};
    color: #6b1f1f;

    &:hover:not(:disabled) {
      background: ${uiTokens.color.bgSoft};
      border-color: ${uiTokens.color.primary};
      color: ${uiTokens.color.primary};
    }
  `,
  danger: css`
    border: 1px solid transparent;
    background: ${uiTokens.color.danger};
    color: ${uiTokens.color.onPrimary};

    &:hover:not(:disabled) {
      background: ${uiTokens.color.dangerHover};
    }
  `,
  quiet: css`
    border: 1px solid ${uiTokens.color.border};
    background: ${uiTokens.color.bg};
    color: ${uiTokens.color.text};

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: ${uiTokens.color.primary};
      color: ${uiTokens.color.primary};
    }
  `,
  ghost: css`
    border: 1px solid transparent;
    background: transparent;
    color: ${uiTokens.color.textMuted};

    &:hover:not(:disabled) {
      background: ${uiTokens.color.bgSoft};
      color: ${uiTokens.color.primary};
    }
  `,
};

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  border-radius: ${uiTokens.radius.md};
  cursor: pointer;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.2;
  transition: background ${uiTokens.transition.fast}, border-color ${uiTokens.transition.fast}, color ${uiTokens.transition.fast}, opacity ${uiTokens.transition.fast};

  ${({ $size }) => sizeStyles[$size]}
  ${({ $variant }) => variantStyles[$variant]}

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${uiTokens.color.focusRingStrong};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  ...props
}) => (
  <StyledButton
    {...props}
    disabled={disabled || loading}
    $variant={variant}
    $size={size}
    $fullWidth={fullWidth}
  >
    {iconLeft}
    {loading ? 'Carregando...' : children}
    {iconRight}
  </StyledButton>
);

export default Button;
