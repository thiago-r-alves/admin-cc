export const normClosureSearch = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const getClosureActionLabel = (paymentStatus: string) =>
  paymentStatus === 'metadata_pending'
    ? 'Ver caçambas com informações pendentes'
    : 'Gerar fechamento do cliente';
