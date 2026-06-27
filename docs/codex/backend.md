# Backend Standards

Backend lives in `backend` and uses Express, TypeScript, Mongoose, Vitest, Supertest, and mongodb-memory-server.

## File Placement

- `src/domains/<domain>/`: domain routes, controllers, services, helpers, and tests when present.
- `src/models/`: Mongoose models.
- `src/shared/`: shared middleware/utilities.
- `src/utils/`: pure utilities.
- `src/app/`: app/server wiring.

Keep domain behavior close to the domain that owns it.

## Layering

- Routes/controllers should stay thin: parse request, validate simple inputs, call service, return response.
- Services own business rules, persistence orchestration, and cross-model updates.
- Models define schema shape and indexes, not workflow logic.
- Shared utilities should be stable and domain-neutral.

## Change Rules

- Reuse existing domain helpers before creating new abstractions.
- Avoid changing API response shape unless the task requires it and frontend/tests are updated together.
- Keep ObjectId/date handling consistent with nearby service code.
- For high-risk business flows such as orders, drivers, closures, billing, and withdrawals, add or update integration tests.

## Tests

Run focused tests first, then broader tests:

```bash
cd backend
npm test
npm run build
```

If a test uses mongodb-memory-server or network-like local resources and the sandbox blocks it, rerun with elevated permissions.
