# Codex Project Guide

Use this file as the first context source before changing the repo. Keep changes scoped, follow existing patterns, and prefer the specific guides in `docs/codex/` only when the task touches that area.

## Repo Map

- `backend/`: Express + TypeScript API, organized by domain in `src/domains/*`.
- `frontend/vite-project/`: React + Vite + Tailwind frontend.
- `frontend/vite-project/src/pages/`: route-level screens. Pages compose feature/components and should not accumulate large UI/function blocks.
- `frontend/vite-project/src/features/`: domain UI and helpers grouped by business area.
- `frontend/vite-project/src/components/`: shared or cross-feature components/modals.
- `frontend/vite-project/src/components/ui/`: base UI primitives.

## Must Follow

- Do not introduce `styled-components`; the project uses Tailwind CSS v4.
- Prefer existing helpers: `cn` for class composition and `twComponent` for local Tailwind wrappers.
- Keep page files thin. Move reusable UI/logic to `features/*`, `components/*`, hooks, helpers, or services.
- Preserve test IDs and user-visible Portuguese copy unless the task explicitly changes behavior.
- Do not refactor unrelated code while fixing a bug.
- Before editing, inspect nearby files and follow their local style.
- Use `rg` for searches.

## Frontend Quick Rules

- Use Tailwind classes and tokens from `frontend/vite-project/src/styles.css`.
- Use `rounded-ui-*`, `brand`, `brand-hover`, `brand-soft`, `brand-border`, and `brand-focus` tokens when they match the design.
- Prefer native semantic elements plus classes. Use `twComponent` when repeated local wrappers keep JSX readable.
- Dynamic styling props should be prefixed with `$` and handled by `twComponent`, which filters them from the DOM.
- Avoid new global CSS except for tokens, app base styles, or shared keyframes.

See `docs/codex/frontend.md` for details.

## Backend Quick Rules

- Keep business logic inside domain services.
- Keep routes/controllers thin: validate inputs, call services, return responses.
- Reuse shared utilities/models instead of duplicating domain rules.

See `docs/codex/backend.md` for details.

## Validation

Frontend:

```bash
cd frontend/vite-project
npm run build
npm run lint
npm run test:unit
npm run test:e2e
```

Backend:

```bash
cd backend
npm run build
npm test
```

Run the smallest relevant tests first, then broader validation for shared or high-risk changes. See `docs/codex/testing.md`.

## Refactor Policy

- Refactor incrementally by area, not the whole app at once.
- For large pages, extract in this order: pure helpers, presentational components, hooks/state orchestration, then feature modules.
- Keep compatibility while extracting. Tests should pass after each meaningful step.

See `docs/codex/refactoring.md`.
