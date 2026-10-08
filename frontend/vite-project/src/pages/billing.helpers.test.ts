import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatBillingDateRange,
  getBillingDatePreset,
  getDefaultBillingDateRange,
} from './billing.helpers';

afterEach(() => {
  vi.useRealTimers();
});

describe('getBillingDatePreset', () => {
  it('limita o mês atual ao dia de referência', () => {
    expect(getBillingDatePreset('current-month', new Date(2026, 9, 8, 15, 30))).toEqual({
      startDate: '2026-10-01',
      endDate: '2026-10-08',
    });
  });

  it('seleciona dezembro do ano anterior ao consultar o mês anterior em janeiro', () => {
    expect(getBillingDatePreset('previous-month', new Date(2026, 0, 20))).toEqual({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
  });

  it.each([
    [2024, '2024-02-29'],
    [2025, '2025-02-28'],
  ] as const)('respeita a duração de fevereiro em %i', (year, expectedEnd) => {
    expect(getBillingDatePreset('previous-month', new Date(year, 2, 31))).toEqual({
      startDate: `${year}-02-01`,
      endDate: expectedEnd,
    });
  });

  it.each([
    [new Date(2026, 0, 15), '2025-11-01', '2026-01-15'],
    [new Date(2026, 1, 20), '2025-12-01', '2026-02-20'],
  ] as const)('inclui o mês atual e os dois anteriores na virada de ano (%s)', (referenceDate, startDate, endDate) => {
    expect(getBillingDatePreset('last-three-months', referenceDate)).toEqual({ startDate, endDate });
  });

  it('limita o ano atual ao dia de referência', () => {
    expect(getBillingDatePreset('current-year', new Date(2026, 9, 8))).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-10-08',
    });
  });
});

describe('getDefaultBillingDateRange', () => {
  it.each([
    [new Date(2026, 0, 1, 0, 15), '2026-01-01'],
    [new Date(2026, 11, 31, 23, 45), '2026-12-31'],
  ] as const)('usa o dia local sem deslocamento UTC perto da meia-noite (%s)', (referenceDate, endDate) => {
    expect(getDefaultBillingDateRange(referenceDate)).toEqual({
      startDate: '2026-01-01',
      endDate,
    });
  });

  it('usa a data local do relógio quando a referência é omitida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 23, 45));

    expect(getDefaultBillingDateRange()).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(getBillingDatePreset('current-month')).toEqual({
      startDate: '2026-12-01',
      endDate: '2026-12-31',
    });
  });
});

describe('formatBillingDateRange', () => {
  it.each([
    ['2026-01-01', '2026-01-02', '01 de jan de 2026 a 02 de jan de 2026'],
    ['2025-12-31', '2026-01-01', '31 de dez de 2025 a 01 de jan de 2026'],
    ['2024-02-29', '2024-03-01', '29 de fev de 2024 a 01 de mar de 2024'],
  ] as const)('preserva os dias informados em %s a %s', (startDate, endDate, expected) => {
    expect(formatBillingDateRange(startDate, endDate)).toBe(expected);
  });
});
