const driverNameInitialPattern = /(^|[\s'’_-])(\p{L})/gu;

export const formatDriverName = (
  value?: string | null,
  fallback = '-',
) => {
  const trimmedName = String(value || '').trim();
  if (!trimmedName) return fallback;

  return trimmedName.replace(
    driverNameInitialPattern,
    (_, separator: string, initial: string) =>
      `${separator}${initial.toLocaleUpperCase('pt-BR')}`,
  );
};
