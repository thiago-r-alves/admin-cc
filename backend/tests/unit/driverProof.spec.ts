import { describe, expect, it } from 'vitest';
import { getSaoPauloDayRange } from '../../src/domains/drivers/service';

describe('reutilização diária do comprovante', () => {
  it('respeita a virada do dia em America/Sao_Paulo', () => {
    const beforeMidnight = getSaoPauloDayRange(new Date('2026-07-12T02:59:59.000Z'));
    expect(beforeMidnight.start.toISOString()).toBe('2026-07-11T03:00:00.000Z');
    expect(beforeMidnight.end.toISOString()).toBe('2026-07-12T02:59:59.999Z');

    const afterMidnight = getSaoPauloDayRange(new Date('2026-07-12T03:00:00.000Z'));
    expect(afterMidnight.start.toISOString()).toBe('2026-07-12T03:00:00.000Z');
    expect(afterMidnight.end.toISOString()).toBe('2026-07-13T02:59:59.999Z');
  });
});
