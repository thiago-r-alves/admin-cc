export const formatWithdrawalDueDate = (dueDate: string) => {
  if (!dueDate) return '-';
  const [year, month, day] = dueDate.split('-');
  return year && month && day ? `${day}/${month}/${year}` : dueDate;
};

export const formatOverdueBusinessDays = (businessDaysOnSite: number) => {
  const overdueDays = Math.max(0, businessDaysOnSite - 5);
  if (overdueDays === 0) return 'venceu hoje';
  if (overdueDays === 1) return 'vencida há 1 dia útil';
  return `vencida há ${overdueDays} dias úteis`;
};
