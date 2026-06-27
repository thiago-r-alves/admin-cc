import React from 'react';
import { cn } from '../../utils/cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Container: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-col gap-4', className)} {...props} />
);

export const Header: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-4', className)} {...props} />
);

export const Title: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('m-0 text-[clamp(1.45rem,2vw,2rem)] leading-[1.15] text-gray-800', className)} {...props} />
);

export const Toolbar: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-end gap-[0.8rem] max-[720px]:flex-col max-[720px]:items-stretch', className)} {...props} />
);

export const SearchWrap: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('relative min-w-[260px] flex-auto pt-[1.3rem] max-[720px]:w-full max-[720px]:min-w-0 max-[720px]:pt-0', className)} {...props} />
);

export const SearchIcon: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span
    className={cn(
      'pointer-events-none absolute left-[0.9rem] top-[calc(50%+0.65rem)] inline-flex -translate-y-1/2 text-gray-400 max-[720px]:top-1/2',
      className,
    )}
    {...props}
  />
);

export const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    className={cn(
      'box-border w-full rounded-ui-lg border border-red-200 bg-white px-[0.9rem] py-[0.82rem] pl-[2.45rem] text-[0.92rem] text-gray-700 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus',
      className,
    )}
    {...props}
  />
);

export const AddButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    className={cn(
      'min-h-[43px] flex-none whitespace-nowrap rounded-ui-md border-0 bg-brand px-4 py-3 text-[0.82rem] font-black uppercase text-white shadow-[0_8px_16px_rgba(227,6,19,0.18)] hover:bg-brand-hover max-[720px]:w-full',
      className,
    )}
    {...props}
  />
);
