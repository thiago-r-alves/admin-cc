import React from 'react';
import { cn } from '../../utils/cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type HeaderVariant = 'primary' | 'danger' | 'success' | 'quiet';

const headerButtonVariants: Record<HeaderVariant, string> = {
  primary: 'border-brand bg-brand text-white hover:bg-brand-hover hover:text-white',
  danger: 'border-brand bg-brand text-white hover:bg-brand-hover hover:text-white',
  success: 'border-brand bg-brand text-white hover:bg-brand-hover hover:text-white',
  quiet: 'border-brand-border bg-white text-[#6b1f1f] hover:bg-brand-soft hover:text-brand',
};

export const DriverContainer: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('min-h-screen bg-[#f5f6f8] p-6 font-sans text-gray-950 max-[640px]:p-4', className)} {...props} />
);

export const DriverShell: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mx-auto w-[min(1120px,100%)]', className)} {...props} />
);

export const DriverHeader: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <header
    className={cn(
      'mb-6 flex items-center justify-between gap-4 rounded-ui-lg border border-red-200 bg-white px-6 py-[1.35rem] shadow-[0_18px_40px_rgba(15,23,42,0.05)] max-[760px]:flex-col max-[760px]:items-stretch max-[760px]:p-[1.1rem]',
      className,
    )}
    {...props}
  />
);

export const HeaderText: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('min-w-0', className)} {...props} />;

export const PageTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h1 className={cn('m-0 text-[clamp(1.45rem,2.2vw,2rem)] font-black text-gray-800', className)} {...props} />
);

export const PageSubtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('m-0 mt-[0.35rem] text-[0.9rem] text-gray-500', className)} {...props} />
);

export const HeaderActions: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-wrap items-center justify-end gap-3 max-[760px]:justify-stretch', className)} {...props} />
);

export const HeaderButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { $variant?: HeaderVariant }> = ({
  $variant = 'quiet',
  className,
  ...props
}) => (
  <button
    className={cn(
      'min-h-10 cursor-pointer rounded-ui-md border px-[0.95rem] py-[0.65rem] text-[0.78rem] font-black uppercase tracking-[0.04em] transition-[background,border-color,color,transform] duration-[180ms] ease-in-out hover:not-disabled:-translate-y-px hover:not-disabled:border-brand disabled:cursor-not-allowed disabled:opacity-55 max-[560px]:w-full',
      headerButtonVariants[$variant],
      className,
    )}
    {...props}
  />
);

export const NotificationStatus: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('text-[0.82rem] font-extrabold text-green-700', className)} {...props} />
);

export const NotificationError: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('w-full text-[0.8rem] font-bold text-red-600', className)} {...props} />
);

export const OrdersSection: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <section className={cn('flex flex-col gap-4', className)} {...props} />
);

export const OrdersSectionTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h2 className={cn('m-0 flex items-center gap-[0.65rem] text-xl font-black text-gray-800', className)} {...props}>
    <span aria-hidden className="h-[26px] w-1 rounded-full bg-brand" />
    {children}
  </h2>
);

export const OrdersGrid: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('grid grid-cols-1 gap-4', className)} {...props} />;

export const EmptyState: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('rounded-ui-lg border border-dashed border-red-200 bg-white p-5 text-[0.95rem] text-gray-500', className)} {...props} />
);

export const OrderCard: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <article className={cn('overflow-hidden rounded-ui-lg border border-red-200 bg-white shadow-[0_16px_34px_rgba(15,23,42,0.04)]', className)} {...props} />
);

export const OrderCardHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-center justify-between gap-4 border-b border-red-100 bg-slate-50 px-5 py-4 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-3', className)} {...props} />
);

export const OrderIdentifier: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex min-w-0 items-center gap-[0.65rem] text-[1.05rem] font-black text-brand', className)} {...props} />
);

export const OrderNumber: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('whitespace-nowrap', className)} {...props} />
);

export const OrderTypeBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('inline-flex min-h-[30px] items-center justify-center rounded-ui-md bg-[#23324a] px-[0.65rem] py-[0.4rem] text-[0.72rem] font-black uppercase tracking-[0.03em] text-white', className)} {...props} />
);

export const OrderCardBody: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('p-5 max-[560px]:p-4', className)} {...props} />
);

export const ClientName: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('m-0 mb-4 text-[clamp(1.05rem,2vw,1.28rem)] font-black leading-tight text-gray-950', className)} {...props} />
);

export const InfoGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 grid grid-cols-[1.4fr_1fr_1fr] gap-[0.95rem] max-[860px]:grid-cols-1', className)} {...props} />
);

export const InfoBlock: React.FC<DivProps & { $span?: number }> = ({ $span = 1, className, ...props }) => (
  <div
    className={cn(
      'min-w-0 rounded-ui-md border border-[#f1d4d4] bg-[#fffafa] p-[0.85rem] max-[860px]:col-span-1',
      $span === 2 ? 'col-span-2' : $span === 3 ? 'col-span-3' : 'col-span-1',
      className,
    )}
    {...props}
  />
);

export const InfoLabel: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-[0.35rem] text-[0.72rem] font-black uppercase tracking-[0.04em] text-gray-400', className)} {...props} />
);

export const InfoValue: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('break-words text-[0.92rem] leading-[1.45] text-gray-700', className)} {...props} />
);

export const ActionRow: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mt-4 flex flex-wrap gap-3 max-[560px]:flex-col', className)} {...props} />
);

export const CacambaButton = HeaderButton;

export const CacambaSection: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mt-[1.15rem] border-t border-red-100 pt-[1.15rem]', className)} {...props} />
);

export const CacambaHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 flex items-center justify-end gap-3 max-[640px]:flex-col max-[640px]:items-stretch', className)} {...props} />
);
