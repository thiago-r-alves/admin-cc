import { describe, expect, it } from 'vitest';
import { formatDriverName } from './formatDriverName';

describe('formatDriverName', () => {
  it('deixa as iniciais do nome do motorista em maiusculo', () => {
    expect(formatDriverName('adalberto')).toBe('Adalberto');
    expect(formatDriverName('joao da silva')).toBe('Joao Da Silva');
    expect(formatDriverName("ana-maria d'ávila")).toBe("Ana-Maria D'Ávila");
  });

  it('remove espacos externos sem alterar o restante do nome', () => {
    expect(formatDriverName('  jHONATAN silva  ')).toBe('JHONATAN Silva');
  });

  it('usa o fallback informado quando o nome esta vazio', () => {
    expect(formatDriverName('')).toBe('-');
    expect(formatDriverName(undefined, 'Nao informado')).toBe('Nao informado');
  });
});
