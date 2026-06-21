export const normalizeBrazilianWhatsAppNumber = (value?: string) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const normalizeEmailAddress = (value?: string) => {
  const email = String(value || '').trim();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

export const buildClosureShareMessage = ({
  recipientName,
  cacambaCount,
  totalAmount,
  paymentMethod = 'invoice',
  pixCopyPaste,
  invoiceNumber,
}: {
  recipientName: string;
  cacambaCount: number;
  totalAmount: number;
  paymentMethod?: 'invoice' | 'pix';
  pixCopyPaste?: string;
  invoiceNumber?: string;
}) => {
  const lines = [
    `Olá, ${recipientName}!`,
    '',
    `Segue o fechamento referente a ${cacambaCount} caçamba(s), no valor total de ${formatCurrency(totalAmount)}. O PDF do fechamento segue em anexo.`,
  ];

  const normalizedInvoice = String(invoiceNumber || '').trim();
  if (normalizedInvoice) {
    lines.push('', `NF: ${normalizedInvoice}`);
  }

  if (paymentMethod === 'pix' && pixCopyPaste) {
    lines.push('', 'Pix copia e cola:', pixCopyPaste);
  }

  return lines.join('\n');
};

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
}) =>
  buildClosureShareMessage({
    recipientName,
    cacambaCount,
    totalAmount,
    paymentMethod: 'pix',
    pixCopyPaste,
  });

export const buildWhatsAppUrl = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

export const buildEmailUrl = ({
  email,
  subject,
  body,
}: {
  email: string;
  subject: string;
  body: string;
}) => `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
