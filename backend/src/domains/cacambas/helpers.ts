import {
  CACAMBA_CONTENT_TYPES,
  CacambaContentType,
} from '../../models/Cacamba';

export const isValidCacambaContentType = (value: unknown): value is CacambaContentType =>
  typeof value === 'string' &&
  (CACAMBA_CONTENT_TYPES as readonly string[]).includes(value);

const cacambaLocals = ['via_publica', 'canteiro_obra'] as const;

export const isValidCacambaLocal = (value: unknown): value is (typeof cacambaLocals)[number] =>
  typeof value === 'string' && cacambaLocals.includes(value as (typeof cacambaLocals)[number]);
