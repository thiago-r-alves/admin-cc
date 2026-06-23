export const mapPriority = (p: any) => {
  if (typeof p === 'number') return p;
  if (typeof p === 'string') {
    const m = { baixa: 0, media: 1, alta: 2 } as const;
    return p in m ? m[p as keyof typeof m] : 1;
  }
  return 1;
};

export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const buildLocalDateRange = (startDate: string, endDate: string) => {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) return null;
  end.setHours(23, 59, 59, 999);
  if (start.getTime() > end.getTime()) return null;
  return { start, end };
};
