import React from 'react';
import type { IOrder } from '../../interfaces';
import { SelectInput } from '../../components/ui';
import { cn } from '../../utils/cn';
import type { CacambaAgeTone } from './admin.helpers';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
type StatusPanelVariant = 'pending' | 'completed';

const primaryButton =
  'cursor-pointer rounded-ui-md border-0 bg-brand text-white transition-colors duration-200 hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-[#f39aa0]';
const actionButtonLayout =
  'cursor-pointer rounded-ui-md border px-4 py-3 text-[0.82rem] font-black uppercase transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55 max-[768px]:flex-[1_1_140px]';
const actionButton =
  `${actionButtonLayout} border-gray-300 bg-white text-gray-700 hover:border-brand hover:bg-brand-soft hover:text-brand disabled:hover:border-gray-300 disabled:hover:bg-white disabled:hover:text-gray-700`;

const orderStatusBorder: Record<IOrder['status'], string> = {
  pendente: 'border-green-200',
  em_andamento: 'border-blue-200',
  concluido: 'border-red-200',
  cancelado: 'border-red-200',
};

const ageToneClasses: Record<CacambaAgeTone, string> = {
  high: 'border-red-200 bg-red-100 text-red-700',
  medium: 'border-amber-200 bg-amber-100 text-amber-800',
  low: 'border-green-200 bg-green-100 text-green-700',
  unknown: 'border-gray-200 bg-gray-100 text-gray-500',
};

const statusPanelClasses: Record<StatusPanelVariant, string> = {
  pending: 'border-green-300 border-t-green-600',
  completed: 'border-red-300 border-t-brand',
};

const statusPanelHeaderClasses: Record<StatusPanelVariant, string> = {
  pending: 'border-green-200',
  completed: 'border-red-200',
};

const statusPanelBadgeClasses: Record<StatusPanelVariant, string> = {
  pending: 'border-green-300 bg-green-100 text-green-700',
  completed: 'border-red-300 bg-red-100 text-red-900',
};

export const AdminContainer: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('box-border min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#f6f7fb] font-sans text-gray-950', className)} {...props} />
);

export const AdminShell: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex min-h-screen min-w-0 max-w-full', className)} {...props} />
);

export const Sidebar: React.FC<React.HTMLAttributes<HTMLElement> & { $open: boolean }> = ({ $open, className, ...props }) => (
  <aside
    className={cn(
      'fixed inset-y-0 left-0 z-[900] flex w-[272px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out min-[769px]:sticky min-[769px]:top-0 min-[769px]:h-screen min-[769px]:flex-[0_0_272px] min-[769px]:translate-x-0',
      $open ? 'translate-x-0' : '-translate-x-full',
      className,
    )}
    {...props}
  />
);

export const SidebarHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('border-b border-gray-100 px-4 pb-4 pt-[1.35rem]', className)} {...props} />
);

export const SidebarLogo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img className={cn('block h-auto w-full max-w-[200px] object-contain', className)} {...props} />
);

export const SidebarNav: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <nav className={cn('flex flex-col gap-[0.35rem] px-3 py-4', className)} {...props} />
);

export const SidebarItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { $active?: boolean }> = ({
  $active,
  className,
  ...props
}) => (
  <button
    className={cn(
      'flex w-full cursor-pointer items-center gap-[0.7rem] rounded-[5px] border-0 px-[0.85rem] py-3 text-left text-[0.9rem] font-bold transition-colors duration-200 [&_svg]:flex-[0_0_18px]',
      $active ? 'bg-brand text-white hover:bg-brand-hover' : 'bg-transparent text-gray-700 hover:bg-gray-100',
      className,
    )}
    {...props}
  />
);

export const SidebarItemLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('min-w-0 flex-auto', className)} {...props} />
);

export const SidebarCountBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { $active?: boolean }> = ({ $active, className, ...props }) => (
  <span
    className={cn(
      'inline-flex h-[22px] min-w-6 items-center justify-center rounded-full px-[0.45rem] text-[0.72rem] font-black leading-none',
      $active ? 'bg-white text-brand' : 'bg-brand text-white',
      className,
    )}
    {...props}
  />
);

export const SidebarFooter: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mt-auto border-t border-red-100 px-3 pb-4 pt-[0.9rem]', className)} {...props} />
);

export const MainContent: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <main className={cn('min-w-0 flex-1 p-4 min-[769px]:p-8', className)} {...props} />
);

export const MobileTopBar: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'mb-4 box-border flex max-w-full items-center justify-between gap-4 overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 [&_h2]:m-0 [&_h2]:min-w-0 [&_h2]:[overflow-wrap:anywhere] [&_h2]:text-[0.95rem] [&_h2]:leading-tight [&_h2]:text-gray-950 min-[769px]:hidden',
      className,
    )}
    {...props}
  />
);

export const MobilePendingIndicator: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    className={cn(
      'inline-flex min-h-8 min-w-0 max-w-[50%] flex-[0_1_auto] cursor-pointer items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-red-200 bg-red-100 px-[0.65rem] py-[0.35rem] text-[0.72rem] font-black uppercase text-red-900',
      className,
    )}
    {...props}
  />
);

export const MenuButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn('inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-ui-lg border border-gray-300 bg-white text-gray-950', className)} {...props} />
);

export const Backdrop: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { $open: boolean }> = ({ $open, className, ...props }) => (
  <button
    className={cn(
      'fixed inset-0 z-[890] border-0 bg-[rgba(17,24,39,0.45)] transition-opacity duration-200 min-[769px]:hidden',
      $open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      className,
    )}
    {...props}
  />
);

export const ContentContainer: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('box-border min-w-0 max-w-full overflow-x-hidden rounded-lg bg-white p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] max-[768px]:p-4', className)} {...props} />
);

export const OrdersPage: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('flex flex-col gap-5', className)} {...props} />;

export const OrdersHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-4 max-[640px]:flex-col', className)} {...props} />
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(primaryButton, 'px-[1.2rem] py-[0.8rem] text-base', className)} {...props} />
);

export const AddOrderButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button
    className={cn(
      primaryButton,
      'inline-flex items-center justify-center gap-[0.45rem] whitespace-nowrap rounded-ui-md px-[1.2rem] py-[0.8rem] text-base font-extrabold uppercase shadow-[0_8px_16px_rgba(227,6,19,0.18)] max-[640px]:w-full',
      className,
    )}
    {...props}
  />
);

export const OrdersGrid: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('grid grid-cols-1 gap-[1.15rem]', className)} {...props} />;

export const OrderCard: React.FC<DivProps & { status: IOrder['status'] }> = ({ status, className, ...props }) => (
  <div className={cn('overflow-hidden rounded-lg border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]', orderStatusBorder[status] ?? 'border-red-200', className)} {...props} />
);

export const DriverFilterPanel: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid gap-[0.8rem] rounded-lg border border-red-200 bg-[#fffafa] px-4 py-[0.95rem] max-[640px]:p-[0.85rem]', className)} {...props} />
);

export const FilterLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('inline-flex items-center gap-[0.55rem] text-[0.76rem] font-extrabold uppercase tracking-[0.08em] text-gray-500', className)} {...props} />
);

export const AcompanhamentoToolbar: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-[0.85rem] py-[0.2rem]', className)} {...props} />
);

export const AcompanhamentoFiltersGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-4 grid grid-cols-4 gap-[0.65rem] max-[1100px]:grid-cols-3 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1', className)} {...props} />
);

export const AcompanhamentoFilterField: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid gap-[0.28rem]', className)} {...props} />
);

export const AcompanhamentoFilterLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label className={cn('text-[0.72rem] font-extrabold uppercase tracking-[0.05em] text-gray-500', className)} {...props} />
);

export const AcompanhamentoFilterInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input className={cn('box-border w-full rounded-ui-lg border border-red-200 bg-white px-[0.8rem] py-[0.72rem] text-[0.88rem] text-gray-700 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand-focus', className)} {...props} />
);

export const AcompanhamentoSortSelect: React.FC<React.ComponentProps<typeof SelectInput>> = ({ className, ...props }) => (
  <SelectInput className={cn('border-red-200', className)} {...props} />
);

export const SummaryBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('inline-flex min-h-[30px] min-w-[86px] items-center justify-center whitespace-nowrap rounded-full border border-red-300 bg-white px-[0.7rem] py-1 text-[0.95rem] font-black uppercase tracking-[0.01em] text-red-900 max-[640px]:min-w-20 max-[640px]:text-[0.88rem]', className)} {...props} />
);

export const OrdersSectionTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h2 className={cn('m-0 flex items-center gap-[0.65rem] text-xl text-gray-700', className)} {...props}>
    <span aria-hidden className="block h-[26px] w-[3px] rounded-full bg-brand" />
    {children}
  </h2>
);

export const OrderCardHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-center justify-between gap-4 border-b border-red-100 bg-gray-50 px-5 py-4 max-[640px]:flex-col max-[640px]:items-start', className)} {...props} />
);

export const OrderHeaderMeta: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('flex flex-wrap items-center gap-[0.6rem]', className)} {...props} />;

export const OrderNumber: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('text-base font-black text-brand', className)} {...props} />
);

export const OrderTypeBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { $type: IOrder['type'] }> = ({ $type, className, ...props }) => (
  <span className={cn('inline-flex min-h-6 items-center rounded-ui-md border px-[0.55rem] py-1 text-[0.68rem] font-black uppercase', $type === 'retirada' ? 'border-red-200 bg-red-100 text-red-700' : 'border-green-200 bg-green-100 text-green-700', className)} {...props} />
);

export const OrderHeaderBadges: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('inline-flex flex-wrap items-center justify-end gap-2 max-[640px]:justify-start', className)} {...props} />
);

export const CacambaAgeBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { $tone: CacambaAgeTone }> = ({ $tone, className, ...props }) => (
  <span className={cn('inline-flex min-h-6 items-center rounded-ui-md border px-[0.55rem] py-1 text-[0.68rem] font-black uppercase', ageToneClasses[$tone], className)} {...props} />
);

export const OrderCardBody: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('p-5', className)} {...props} />;

export const OrderClientName: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('m-0 mb-[1.15rem] text-[1.15rem] uppercase leading-[1.3] text-gray-800', className)} {...props} />
);

export const OrderAddressBlock: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('mb-4', className)} {...props} />;

export const InfoLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-[0.68rem] font-black uppercase text-gray-400', className)} {...props} />
);

export const InfoValue: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-[0.9rem] leading-[1.45] text-gray-700', className)} {...props} />
);

export const InfoGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mt-4 grid grid-cols-3 gap-4 max-[900px]:grid-cols-1', className)} {...props} />
);

export const InfoTile: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('min-w-0', className)} {...props} />;

export const OrderDetailsDivider: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('my-5 h-px bg-red-100', className)} {...props} />;

export const OrderFooter: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-wrap items-end justify-between gap-4 pt-[0.2rem]', className)} {...props} />
);

export const OrderActions: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('ml-auto flex flex-wrap gap-[0.65rem] max-[640px]:ml-0 max-[640px]:w-full', className)} {...props} />
);

export const AcompanhamentoActions: React.FC<DivProps> = ({ className, ...props }) => (
  <OrderActions className={cn('ml-0 mt-4', className)} {...props} />
);

export const AcompanhamentoImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img className={cn('h-[66px] w-[66px] cursor-pointer rounded-ui-md border border-gray-300 bg-white object-cover', className)} {...props} />
);

export const WithdrawalGroupsStack: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('grid gap-4', className)} {...props} />;

export const WithdrawalClientSection: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <section className={cn('overflow-hidden rounded-lg border border-red-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]', className)} {...props} />
);

export const WithdrawalClientHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-center justify-between gap-4 border-b border-red-100 bg-[#fffafa] px-5 py-4 max-[640px]:flex-col', className)} {...props} />
);

export const WithdrawalClientHeaderText: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('min-w-0 flex-auto', className)} {...props} />;

export const WithdrawalClientHeaderActions: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-none flex-wrap items-center justify-end gap-[0.65rem] max-[640px]:w-full max-[640px]:justify-stretch', className)} {...props} />
);

export const WithdrawalClientTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('m-0 text-[1.05rem] font-black uppercase leading-[1.3] text-gray-800', className)} {...props} />
);

export const WithdrawalAddressGroupBlock: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('border-b border-gray-100 px-5 py-4 last:border-b-0', className)} {...props} />
);

export const WithdrawalAddressHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-[0.9rem] flex items-start justify-stretch gap-4 max-[720px]:flex-col', className)} {...props} />
);

export const WithdrawalAddressInfo: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('w-full min-w-0 flex-auto', className)} {...props} />;

export const WithdrawalInfoGrid: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mt-4 grid w-full grid-cols-[minmax(320px,2fr)_minmax(180px,1fr)_minmax(180px,1fr)] gap-4 max-[900px]:grid-cols-1', className)} {...props} />
);

export const WithdrawalOrderStatusRow: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('mt-3 flex flex-wrap gap-2', className)} {...props} />;

export const WithdrawalOrderStatusBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('inline-flex max-w-full min-w-0 items-center rounded-ui-lg border border-amber-500 bg-amber-50 px-[0.65rem] py-[0.38rem] text-[0.72rem] font-black uppercase leading-[1.3] text-amber-800 [overflow-wrap:anywhere] max-[640px]:w-full max-[640px]:justify-center max-[640px]:text-center', className)} {...props} />
);

export const EmptyState: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-dashed border-red-200 bg-[#fffafa] p-[1.2rem] text-gray-500', className)} {...props} />
);

export const DriversPage: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('flex flex-col gap-4', className)} {...props} />;

export const DriversHeader: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-start justify-between gap-4 max-[720px]:flex-col', className)} {...props} />
);

export const DriversTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('m-0 text-[clamp(1.45rem,2vw,2rem)] leading-[1.15] text-gray-800', className)} {...props} />
);

export const AddDriverButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn('min-h-[43px] flex-none whitespace-nowrap rounded-ui-md border-0 bg-brand px-4 py-3 text-[0.82rem] font-black uppercase text-white shadow-[0_8px_16px_rgba(227,6,19,0.18)] hover:bg-brand-hover max-[720px]:w-full', className)} {...props} />
);

export const DriverList: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('w-full overflow-hidden rounded-ui-lg border border-red-200 bg-white', className)} {...props} />;

export const DriverItem: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex items-center justify-between gap-5 border-b border-red-100 bg-white px-5 py-4 last:border-b-0 max-[640px]:flex-col max-[640px]:items-stretch max-[640px]:gap-4 max-[640px]:p-4', className)} {...props} />
);

export const DriverInfo: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('flex min-w-0 items-center gap-3', className)} {...props} />;

export const DriverAvatar: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('inline-flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-brand-soft text-brand', className)} {...props} />
);

export const DriverName: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('block text-base font-black leading-[1.35] text-gray-800 [overflow-wrap:anywhere]', className)} {...props} />
);

export const DriverRole: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...props }) => (
  <span className={cn('mt-[0.15rem] block text-[0.8rem] font-bold text-gray-500', className)} {...props} />
);

export const DriverActions: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-none items-center justify-end gap-[0.6rem] max-[640px]:flex-wrap max-[640px]:justify-stretch', className)} {...props} />
);

export const DriverActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { $variant?: 'danger' }> = ({
  $variant,
  className,
  ...props
}) => (
  <button
    className={cn(
      'inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-[0.42rem] rounded-ui-md border px-[0.85rem] py-[0.6rem] text-[0.78rem] font-black uppercase transition-[background,border-color,color] duration-[180ms] max-[640px]:flex-[1_1_120px]',
      $variant === 'danger'
        ? 'border-transparent bg-red-600 text-white hover:bg-red-800'
        : 'border-brand-border bg-white text-gray-700 hover:border-brand hover:bg-brand-soft hover:text-brand',
      className,
    )}
    {...props}
  />
);

export const ImageContainer: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('mt-4 flex flex-wrap gap-2.5', className)} {...props} />;

export const OrderImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img className={cn('h-[100px] w-[100px] rounded-ui-md border border-[#ddd] object-cover', className)} {...props} />
);

export const CacambaSection: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mt-4 border-t border-gray-200 pt-4 [&_h4]:m-0 [&_h4]:mb-2 [&_h4]:text-[0.9rem] [&_h4]:text-gray-700', className)} {...props} />
);

export const SectionContainer: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('mb-8 pb-4 [&>h2]:mb-4', className)} {...props} />
);

export const StatusPanelsStack: React.FC<DivProps> = ({ className, ...props }) => <div className={cn('grid gap-6', className)} {...props} />;

export const OrdersStatusPanel: React.FC<React.HTMLAttributes<HTMLElement> & { $variant: StatusPanelVariant }> = ({
  $variant,
  className,
  ...props
}) => (
  <section className={cn('rounded-xl border border-t-4 bg-white p-4 pb-[1.1rem] shadow-[0_12px_28px_rgba(15,23,42,0.05)] max-[640px]:p-[0.85rem] max-[640px]:pb-4', statusPanelClasses[$variant], className)} {...props} />
);

export const OrdersPanelHeader: React.FC<DivProps & { $variant: StatusPanelVariant }> = ({ $variant, className, ...props }) => (
  <div className={cn('mb-4 flex items-start justify-between gap-[0.8rem] border-b pb-[0.9rem] [&_.subtitle]:text-[0.85rem] [&_.subtitle]:font-bold [&_.subtitle]:text-gray-500 [&_.title-copy]:grid [&_.title-copy]:min-w-0 [&_.title-copy]:gap-[0.3rem]', statusPanelHeaderClasses[$variant], className)} {...props} />
);

export const OrdersPanelBadge: React.FC<React.HTMLAttributes<HTMLSpanElement> & { $variant: StatusPanelVariant }> = ({ $variant, className, ...props }) => (
  <span className={cn('inline-flex min-h-7 min-w-[82px] items-center justify-center rounded-full border px-[0.65rem] py-[0.2rem] text-[0.74rem] font-black uppercase tracking-[0.02em]', statusPanelBadgeClasses[$variant], className)} {...props} />
);

export const DeleteOrderButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(primaryButton, 'px-4 py-3 text-[0.82rem] font-black uppercase max-[768px]:flex-[1_1_140px]', className)} {...props} />
);

export const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(actionButton, className)} {...props} />
);

export const DownloadOrderButton = ActionButton;

export const WithdrawalCreateButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn(actionButtonLayout, 'flex-none border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover hover:text-white disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 disabled:hover:border-gray-300 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 max-[720px]:w-full', className)} {...props} />
);

export const DriverTabsBar: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={cn('grid grid-cols-[repeat(3,minmax(180px,1fr))] gap-[0.8rem] max-[980px]:grid-cols-2 max-[640px]:grid-cols-1', className)} {...props} />
);

export const DriverTabButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }> = ({
  active,
  className,
  ...props
}) => (
  <button
    className={cn(
      'grid cursor-pointer grid-cols-[auto_1fr] items-center gap-[0.7rem] rounded-[10px] border bg-white px-[0.85rem] py-[0.8rem] text-left text-gray-950 transition duration-[180ms] hover:-translate-y-px hover:border-brand [&_.initial]:inline-flex [&_.initial]:h-[42px] [&_.initial]:w-[42px] [&_.initial]:items-center [&_.initial]:justify-center [&_.initial]:rounded-xl [&_.initial]:text-[1.15rem] [&_.initial]:font-black [&_.meta]:grid [&_.meta]:min-w-0 [&_.meta]:gap-[0.2rem] [&_.name]:overflow-hidden [&_.name]:text-ellipsis [&_.name]:whitespace-nowrap [&_.name]:text-[1.02rem] [&_.name]:font-black [&_.name]:text-gray-950 [&_.count]:text-[0.74rem] [&_.count]:font-extrabold [&_.count]:uppercase [&_.count]:tracking-[0.06em]',
      active
        ? 'border-brand [&_.count]:text-brand-hover [&_.initial]:bg-brand [&_.initial]:text-white'
        : 'border-[#f1c8c8] [&_.count]:text-gray-500 [&_.initial]:bg-gray-200 [&_.initial]:text-gray-600',
      className,
    )}
    {...props}
  />
);

export const PaginationBar: React.FC<DivProps> = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-3 py-3 [&_.controls]:flex [&_.controls]:flex-[0_1_auto] [&_.controls]:flex-wrap [&_.controls]:items-center [&_.controls]:gap-2 [&>span]:min-w-[220px] [&>span]:flex-auto max-[640px]:justify-center max-[640px]:text-center max-[640px]:[&_.controls]:order-1 max-[640px]:[&_.controls]:w-full max-[640px]:[&_.controls]:justify-center max-[640px]:[&>span]:order-2 max-[640px]:[&>span]:w-full max-[640px]:[&>span]:text-[0.9rem] max-[640px]:[&>span]:text-gray-500',
      className,
    )}
    {...props}
  />
);

export const PageButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <button className={cn('min-w-11 cursor-pointer rounded-ui-lg border border-gray-200 bg-white px-[0.7rem] py-2 text-[0.95rem] leading-[1.2] transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
);

export const GlobalStyle: React.FC = () => null;
