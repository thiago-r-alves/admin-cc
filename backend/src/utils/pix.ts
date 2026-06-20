const field = (id: string, value: string) =>
  `${id}${String(Buffer.byteLength(value, 'utf8')).padStart(2, '0')}${value}`;

export const normalizePixText = (value: string, maxLength: number) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLength);

export const crc16Ccitt = (value: string) => {
  let crc = 0xffff;
  for (const byte of Buffer.from(value, 'utf8')) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

export const normalizeCnpjPixKey = (value: string) => String(value || '').replace(/\D/g, '');

export const isCnpjPixKey = (value: string) => normalizeCnpjPixKey(value).length === 14;

export const buildPixCopyPaste = ({
  key,
  amount,
  txid,
  merchantName = 'CENTRAL CACAMBAS',
  merchantCity = 'SAO JOSE CAMPOS',
}: {
  key: string;
  amount: number;
  txid: string;
  merchantName?: string;
  merchantCity?: string;
}) => {
  const normalizedKey = normalizeCnpjPixKey(key);
  if (!isCnpjPixKey(normalizedKey)) {
    throw new Error('PIX_KEY deve ser um CNPJ válido com 14 dígitos.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('O valor do Pix deve ser maior que zero.');
  }

  const merchantAccount = field('00', 'BR.GOV.BCB.PIX') + field('01', normalizedKey);
  const additionalData = field('05', normalizePixText(txid, 25) || '***');
  const payloadWithoutCrc = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    field('54', amount.toFixed(2)),
    field('58', 'BR'),
    field('59', normalizePixText(merchantName, 25)),
    field('60', normalizePixText(merchantCity, 15)),
    field('62', additionalData),
    '6304',
  ].join('');

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
};
