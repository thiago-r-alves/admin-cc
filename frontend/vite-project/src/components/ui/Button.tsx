import React from 'react';
import { cn } from '../../utils/cn';

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

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-[0.8rem] py-[0.55rem] text-[0.78rem]',
  md: 'min-h-[42px] px-4 py-[0.7rem] text-[0.82rem]',
  lg: 'min-h-[46px] px-[1.2rem] py-[0.8rem] text-[0.9rem]',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-brand bg-brand text-white hover:not-disabled:border-brand-hover hover:not-disabled:bg-brand-hover',
  secondary:
    'border-brand-border bg-white text-[#6b1f1f] hover:not-disabled:border-brand hover:not-disabled:bg-brand-soft hover:not-disabled:text-brand',
  danger: 'border-transparent bg-red-600 text-white hover:not-disabled:bg-red-800',
  quiet:
    'border-gray-300 bg-white text-gray-700 hover:not-disabled:border-brand hover:not-disabled:bg-gray-50 hover:not-disabled:text-brand',
  ghost: 'border-transparent bg-transparent text-gray-500 hover:not-disabled:bg-brand-soft hover:not-disabled:text-brand',
};

const ButtonSpinner = () => (
  <span
    aria-hidden="true"
    className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-current border-t-transparent opacity-85 motion-reduce:animate-none"
  />
);

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  children,
  className,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={cn(
      'inline-flex items-center justify-center gap-[0.45rem] rounded-ui-md border font-black uppercase leading-[1.2] tracking-[0.04em] transition-[background,border-color,color,opacity] duration-[180ms] ease-in-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus-strong disabled:cursor-not-allowed disabled:opacity-60',
      fullWidth ? 'w-full' : 'w-auto',
      sizeClasses[size],
      variantClasses[variant],
      className,
    )}
  >
    {loading ? (
      <>
        <ButtonSpinner />
        Carregando...
      </>
    ) : (
      <>
        {iconLeft}
        {children}
        {iconRight}
      </>
    )}
  </button>
);

export default Button;
