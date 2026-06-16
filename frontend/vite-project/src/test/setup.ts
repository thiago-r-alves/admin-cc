import '@testing-library/jest-dom/vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });
} catch {
  // Node 26 exposes an experimental localStorage global in some modes.
}
