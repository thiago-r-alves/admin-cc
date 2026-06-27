import type { SidebarIconName } from './admin.types';

export const SidebarIcon = ({ name }: { name: SidebarIconName }) => {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'pedidos') {
    return (
      <svg {...common}>
        <path d="M9 5h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
        <path d="M5 4h14v16H5z" />
      </svg>
    );
  }

  if (name === 'clientes') {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === 'acompanhamentos') {
    return (
      <svg {...common}>
        <path d="M2 12c2.5-4.5 6.5-7 10-7s7.5 2.5 10 7c-2.5 4.5-6.5 7-10 7s-7.5-2.5-10-7z" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 9v-2" />
        <path d="M9.5 10.5l-1.5-1.5" />
        <path d="M14.5 10.5l1.5-1.5" />
      </svg>
    );
  }

  if (name === 'retiradas') {
    return (
      <svg {...common}>
        <path d="M7 7h10" />
        <path d="M7 11h7" />
        <path d="M5 3h14v11H5z" />
        <path d="M9 18h6" />
        <path d="M12 14v7" />
        <path d="M8 21h8" />
      </svg>
    );
  }

  if (name === 'motoristas') {
    return (
      <svg {...common}>
        <path d="M10 17H5V6h9v11" />
        <path d="M14 9h4l3 4v4h-3" />
        <path d="M10 17h4" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="16" cy="17" r="2" />
      </svg>
    );
  }

  if (name === 'fechamento') {
    return (
      <svg {...common}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 14h8" />
        <path d="M8 18h5" />
      </svg>
    );
  }

  if (name === 'faturamento') {
    return (
      <svg {...common}>
        <path d="M4 19h16" />
        <path d="M7 16V9" />
        <path d="M12 16V5" />
        <path d="M17 16v-7" />
      </svg>
    );
  }

  if (name === 'menu') {
    return (
      <svg {...common}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
};

export const DriverPersonIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export const DriverEditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const DriverTrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 6V4h8v2M6 6l1 15h10l1-15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
