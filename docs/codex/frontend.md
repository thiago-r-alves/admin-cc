# Frontend Standards

Frontend lives in `frontend/vite-project` and uses React 19, Vite, TypeScript, Tailwind CSS v4, Vitest, and Playwright.

## File Placement

- `src/pages/*Page.tsx`: route composition and page-level state only.
- `src/features/<area>/`: feature-specific tabs, panels, helpers, constants, types, and styles wrappers.
- `src/components/`: shared components and cross-feature modals.
- `src/components/ui/`: small reusable primitives such as buttons, inputs, selects, and fields.
- `src/services/`: API access.
- `src/utils/`: pure utility functions.

When a page grows, move feature UI into `src/features/<area>/` instead of adding more code to the page.

## Styling

- Tailwind is the styling standard. Do not add `styled-components`.
- Global Tailwind setup is in `src/styles.css`.
- Vite Tailwind plugin is configured in `vite.config.ts`.
- Use `cn(...classes)` from `src/utils/cn.ts` for conditional class composition.
- Use `twComponent(tag, baseClasses, dynamicClasses?)` for repeated local wrappers.

Example:

```tsx
const StatusBadge = twComponent<'span', { $tone: 'danger' | 'warning' }>(
  'span',
  'inline-flex rounded-ui-md border px-2 py-1 text-xs font-black',
  ({ $tone }) => ($tone === 'danger' ? 'border-[#ef4444] text-[#991b1b]' : 'border-[#f59e0b] text-[#92400e]'),
);
```

## Tailwind Conventions

- Prefer design tokens: `bg-brand`, `text-brand`, `border-brand-border`, `bg-brand-soft`, `focus:ring-brand-focus`.
- Use `rounded-ui-sm`, `rounded-ui-md`, `rounded-ui-lg` for app controls.
- Use arbitrary values only when matching an existing layout or exact tested color.
- For colors asserted by E2E with `toHaveCSS`, prefer stable hex/RGB arbitrary classes such as `text-[#991b1b]` instead of Tailwind palette OKLCH output.
- Keep responsive classes local and explicit, for example `max-[640px]:grid-cols-1`.
- Avoid adding CSS files for component styles.

## Component Conventions

- Keep components typed with explicit props interfaces.
- Preserve `data-testid` values when refactoring.
- Keep Portuguese UI copy consistent with existing screens.
- Prefer base UI components from `components/ui` for common buttons/fields.
- For modals, keep the established structure: overlay, content, header, body, footer.
- Avoid putting business calculations directly in JSX; extract pure helpers near the component or into a feature helper file.

## State and Data

- API calls should stay in services or existing hooks.
- Derived view data should use pure helper functions or `useMemo` when it is expensive or clarifies rendering.
- Do not duplicate backend business rules unless the frontend needs display-only derivation.

## Common Commands

```bash
cd frontend/vite-project
npm run build
npm run lint
npm run test:unit
npm run test:e2e
```
