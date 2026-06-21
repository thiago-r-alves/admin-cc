import { describe, expect, it } from 'vitest';
import {
  buildClosureShareMessage,
  buildEmailUrl,
  buildPixWhatsAppMessage,
  buildWhatsAppUrl,
  normalizeEmailAddress,
  normalizeBrazilianWhatsAppNumber,
} from './whatsapp';

describe('WhatsApp helpers', () => {
  it('normaliza telefones brasileiros com e sem DDI', () => {
    expect(normalizeBrazilianWhatsAppNumber('(12) 98195-6675')).toBe('5512981956675');
    expect(normalizeBrazilianWhatsAppNumber('+55 12 98195-6675')).toBe('5512981956675');
    expect(normalizeBrazilianWhatsAppNumber('123')).toBeNull();
  });

  it('normaliza email cadastrado', () => {
    expect(normalizeEmailAddress(' cliente@example.com ')).toBe('cliente@example.com');
    expect(normalizeEmailAddress('cliente-invalido')).toBeNull();
    expect(normalizeEmailAddress('')).toBeNull();
  });

  it('monta mensagem de NF sem Pix e com numero de nota quando existir', () => {
    const message = buildClosureShareMessage({
      recipientName: 'Cliente Teste',
      cacambaCount: 2,
      totalAmount: 250,
      paymentMethod: 'invoice',
      invoiceNumber: 'NF-123',
    });

    expect(message).toContain('Olá, Cliente Teste!');
    expect(message).toContain('2 caçamba(s)');
    expect(message).toContain('R$');
    expect(message).toContain('250,00');
    expect(message).toContain('NF: NF-123');
    expect(message).not.toContain('Pix copia e cola');
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

  it('monta mailto com assunto e corpo codificados', () => {
    const url = buildEmailUrl({
      email: 'cliente@example.com',
      subject: 'Fechamento Cliente Teste',
      body: 'Olá!\nSegue o fechamento.',
    });

    expect(url).toContain('mailto:cliente%40example.com?subject=');
    expect(url).toContain(encodeURIComponent('Fechamento Cliente Teste'));
    expect(url).toContain(encodeURIComponent('Olá!\nSegue o fechamento.'));
  });
});
