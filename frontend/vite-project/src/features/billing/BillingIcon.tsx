import type { SVGProps } from 'react';

type BillingIconName = 'revenue' | 'calendar' | 'clients' | 'cacambas' | 'trend' | 'filter' | 'refresh' | 'search' | 'table' | 'arrow-up' | 'arrow-down' | 'chevron-down' | 'arrow-right';

const paths: Record<BillingIconName, string> = {
  revenue: 'M3 6h18v12H3z M3 10h18 M7 14h3',
  calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2',
  clients: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.9 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  cacambas: 'M3 7h18l-3 13H6z M6 7V4h12v3 M9 11v5 M15 11v5',
  trend: 'M3 17l6-6 4 4 8-10 M15 5h6v6',
  filter: 'M4 6h16 M7 12h10 M10 18h4',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M6.1 6.1A8 8 0 0 1 20 12 M4 12a8 8 0 0 0 13.9 5.9',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  table: 'M3 4h18v16H3z M3 10h18 M3 15h18 M9 4v16',
  'arrow-up': 'M12 19V5 M5 12l7-7 7 7',
  'arrow-down': 'M12 5v14 M5 12l7 7 7-7',
  'chevron-down': 'M6 9l6 6 6-6',
  'arrow-right': 'M5 12h14 M12 5l7 7-7 7',
};

export const BillingIcon = ({ name, ...props }: SVGProps<SVGSVGElement> & { name: BillingIconName }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d={paths[name]} />
  </svg>
);
