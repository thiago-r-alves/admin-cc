# Refactoring Standards

Refactor in small, verifiable steps. The goal is to reduce file size and coupling without changing behavior.

## Large Page Strategy

For files like admin pages:

1. Extract pure helpers and constants.
2. Extract repeated presentational blocks into local components.
3. Move feature-specific sections to `src/features/<area>/`.
4. Extract hooks only when state/effects become reusable or clearly separate orchestration from rendering.
5. Keep the page as a composition layer.

## Suggested Boundaries

- `pages`: routing, top-level loading/error state, feature composition.
- `features`: business UI for a specific workflow.
- `components`: shared UI or modals used across workflows.
- `components/ui`: generic primitives with no business knowledge.
- `utils`: pure functions with no React.
- `services`: API calls and transport concerns.

## Safe Extraction Checklist

- Preserve imports/exports used by existing code.
- Preserve `data-testid`, labels, and button text.
- Keep prop names explicit and typed.
- Run focused tests after each extraction.
- Avoid changing layout and behavior in the same refactor unless the task asks for it.

## Tailwind Migration Policy

- Do not mix a large component extraction with a styling-system migration unless necessary.
- Convert styles first when removing a styling dependency.
- After migration, remove unused packages and search for old APIs.

Search command:

```bash
rg -n 'styled-components|styled\.|createGlobalStyle|import styled' frontend/vite-project/src frontend/vite-project/package.json frontend/vite-project/package-lock.json
```

Expected result after migration: no matches.
