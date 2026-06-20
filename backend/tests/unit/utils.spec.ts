import { describe, expect, it, vi } from 'vitest';
import { buildLocalDateRange, mapPriority, parseLocalDate } from '../../src/utils/order';
import { buildPixCopyPaste, crc16Ccitt, normalizePixText } from '../../src/utils/pix';

describe('Utils de negócio', () => {
  it('mapPriority suporta número, string e fallback', () => {
    expect(mapPriority(2)).toBe(2);
    expect(mapPriority('baixa')).toBe(0);
    expect(mapPriority('media')).toBe(1);
    expect(mapPriority('alta')).toBe(2);
    expect(mapPriority('qualquer')).toBe(1);
    expect(mapPriority(undefined)).toBe(1);
  });

  it('parseLocalDate e buildLocalDateRange tratam datas válidas e inválidas', () => {
    const parsed = parseLocalDate('2026-05-19');
    expect(parsed).not.toBeNull();
    expect(parsed?.getHours()).toBe(0);

    expect(parseLocalDate('abc')).toBeNull();

    const range = buildLocalDateRange('2026-05-19', '2026-05-19');
    expect(range).not.toBeNull();
    expect(range?.start.getHours()).toBe(0);
    expect(range?.end.getHours()).toBe(23);
    expect(range?.end.getMinutes()).toBe(59);

    expect(buildLocalDateRange('x', '2026-05-19')).toBeNull();
  });

  it('extractGridFsIdFromUrl extrai id e compressImage retorna metadados esperados', async () => {
    const actualImageUtils = await vi.importActual<typeof import('../../src/utils/image')>('../../src/utils/image');

    expect(actualImageUtils.extractGridFsIdFromUrl('/files/507f1f77bcf86cd799439011')).toBe(
      '507f1f77bcf86cd799439011',
    );
    expect(actualImageUtils.extractGridFsIdFromUrl('/foo')).toBeNull();

    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn8x9QAAAAASUVORK5CYII=',
      'base64',
    );
    const out = await actualImageUtils.compressImage(tinyPng, 'img.png', { format: 'webp', quality: 70 });
    expect(out.contentType).toBe('image/webp');
    expect(out.filename.endsWith('.webp')).toBe(true);
    expect(Buffer.isBuffer(out.buffer)).toBe(true);
  });

  it('gera Pix copia e cola com valor, texto normalizado e CRC válido', () => {
    const payload = buildPixCopyPaste({
      key: '14.071.560/0001-41',
      amount: 320.5,
      txid: 'CCCLIENTEG1',
      merchantName: 'Central Caçambas',
      merchantCity: 'São José dos Campos',
    });

    expect(payload).toContain('5406320.50');
    expect(payload).toContain('14071560000141');
    expect(payload).toContain('CENTRAL CACAMBAS');
    expect(payload).toContain('SAO JOSE DOS CA');
    expect(payload.slice(-4)).toBe(crc16Ccitt(payload.slice(0, -4)));
    expect(normalizePixText('Caçambas & Cia', 25)).toBe('CACAMBAS  CIA');
  });
});
