# Frontend

This app is the React + Vite frontend for Central Cacambas.

## Requirements

- Node.js and npm
- The backend running locally on `http://localhost:3001`

## Environment Setup

Copy the example file before starting the app:

```powershell
Copy-Item .env.example .env
```

Default local env:

```env
VITE_API_URL=http://localhost:3001
VITE_VAPID_PUBLIC_KEY=replace_with_the_matching_backend_vapid_public_key
```

`VITE_VAPID_PUBLIC_KEY` must match the public VAPID key configured in the backend env file.

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the dev server:

```powershell
npm run dev
```

The default Vite dev URL is `http://localhost:5173`.

## Scripts

- `npm run dev`: start the Vite dev server
- `npm run build`: build the production bundle
- `npm run lint`: run ESLint
- `npm run test:unit`: run Vitest unit tests
- `npm run test:e2e`: run Playwright end-to-end tests

## Related Setup

For the full local development flow, including Dockerized MongoDB and backend setup, use the root [README](../../README.md).
