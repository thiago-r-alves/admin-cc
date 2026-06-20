import { describe, expect, it } from 'vitest';
import {
  buildPixWhatsAppMessage,
  buildWhatsAppUrl,
  normalizeBrazilianWhatsAppNumber,
} from './whatsapp';

describe('WhatsApp helpers', () => {
  it('normaliza telefones brasileiros com e sem DDI', () => {
    expect(normalizeBrazilianWhatsAppNumber('(12) 98195-6675')).toBe('5512981956675');
    expect(normalizeBrazilianWhatsAppNumber('+55 12 98195-6675')).toBe('5512981956675');
    expect(normalizeBrazilianWhatsAppNumber('123')).toBeNull();
  });

  it('monta mensagem Pix e URL codificada', () => {
    const message = buildPixWhatsAppMessage({
      recipientName: 'Samiir',
      cacambaCount: 3,
      totalAmount: 320.5,
      pixCopyPaste: 'PIX-COPIA-E-COLA',
    });

    expect(message).toContain('Olá, Samiir!');
    expect(message).toContain('3 caçamba(s)');
    expect(message).toContain('R$ 320,50');
    expect(message).toContain('PIX-COPIA-E-COLA');
    expect(buildWhatsAppUrl('5512981956675', message)).toContain(
      'https://wa.me/5512981956675?text=',
    );
  });
});
