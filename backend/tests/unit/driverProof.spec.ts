import { describe, expect, it } from 'vitest';
import { getReusableDeliveryProofRange } from '../../src/domains/drivers/service';

describe('reutilização temporária do comprovante', () => {
  it('limita o reaproveitamento às últimas 2 horas', () => {
    const range = getReusableDeliveryProofRange(new Date('2026-07-12T12:30:00.000Z'));

    expect(range.start.toISOString()).toBe('2026-07-12T10:30:00.000Z');
    expect(range.end.toISOString()).toBe('2026-07-12T12:30:00.000Z');
  });
});
