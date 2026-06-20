export const normalizeBrazilianWhatsAppNumber = (value?: string) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const buildPixWhatsAppMessage = ({
  recipientName,
  cacambaCount,
  totalAmount,
  pixCopyPaste,
}: {
  recipientName: string;
  cacambaCount: number;
  totalAmount: number;
  pixCopyPaste: string;
}) => [
  `Olá, ${recipientName}!`,
  '',
  `Segue o fechamento referente a ${cacambaCount} caçamba(s), no valor total de ${formatCurrency(totalAmount)}. O PDF da nota segue em anexo.`,
  '',
  'Pix copia e cola:',
  pixCopyPaste,
].join('\n');

export const buildWhatsAppUrl = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
