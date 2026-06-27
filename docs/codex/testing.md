# Testing Standards

Use the smallest validation that proves the change, then expand based on risk.

## Frontend

Unit/component tests:

```bash
cd frontend/vite-project
npm run test:unit
```

Static/build checks:

```bash
npm run lint
npm run build
```

E2E:

```bash
npm run test:e2e
```

Playwright may update `frontend/vite-project/playwright-report/index.html`; do not commit that generated report unless explicitly requested.

## Backend

```bash
cd backend
npm test
npm run build
```

## When To Add Tests

- Add unit tests for pure helpers and component behavior.
- Add Playwright tests for important user workflows, responsive behavior, or regressions in navigation/modals.
- Add backend integration tests for domain service changes, persistence side effects, and API contracts.
- Update existing tests instead of adding broad duplicated coverage when a nearby test already owns the behavior.

## Test Stability Notes

- Preserve `data-testid` values during refactors.
- Tailwind v4 can emit OKLCH palette colors; use stable arbitrary hex/RGB classes when tests assert computed CSS colors.
- Prefer user-visible queries in tests, but keep test IDs for dense admin workflows where labels repeat.
