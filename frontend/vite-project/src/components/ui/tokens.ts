export const uiTokens = {
  color: {
    primary: '#e30613',
    primaryHover: '#c9000b',
    onPrimary: '#ffffff',
    border: '#d1d5db',
    borderSoft: '#d8b4b4',
    text: '#374151',
    textMuted: '#6b7280',
    danger: '#dc2626',
    dangerHover: '#b91c1c',
    focusRing: 'rgba(227, 6, 19, 0.12)',
    focusRingStrong: 'rgba(227, 6, 19, 0.2)',
    bg: '#ffffff',
    bgSoft: '#fff1f2'
  },
  radius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    pill: '999px'
  },
  space: {
    xs: '0.5rem',
    sm: '0.65rem',
    md: '0.8rem',
    lg: '1rem'
  },
  transition: {
    fast: '0.18s ease'
  }
};

export type UiTokens = typeof uiTokens;
