# Central Cacambas

Local development uses Docker for MongoDB only. The backend and frontend still run locally with Node.js.

## Requirements

- Docker Desktop
- Node.js and npm

## Project Structure

- `backend/`: Express + TypeScript API
- `frontend/vite-project/`: React + Vite frontend
- `docker-compose.yml`: local MongoDB service

## First-Time Setup

1. Copy the env example files:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/vite-project/.env.example frontend/vite-project/.env
   ```

2. Update the placeholders in `backend/.env`.
3. Start MongoDB with Docker:

   ```powershell
   docker compose up -d
   ```

4. Install dependencies if needed:

   ```powershell
   cd backend
   npm install
   cd ../frontend/vite-project
   npm install
   ```

5. Start the backend:

   ```powershell
   cd backend
   npm run dev
   ```

6. Start the frontend in another terminal:

   ```powershell
   cd frontend/vite-project
   npm run dev
   ```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- MongoDB: `mongodb://localhost:27017/loginapp_db`

## Environment Files

Use the committed example files as templates:

- `backend/.env.example`
- `frontend/vite-project/.env.example`

The real `.env` files are ignored by git. Do not commit real secrets such as JWT keys, VAPID private keys, or Focus NFe tokens.

## MongoDB with Docker

Start MongoDB:

```powershell
docker compose up -d
```

Stop MongoDB:

```powershell
docker compose stop mongodb
```

Start it again later:

```powershell
docker compose start mongodb
```

View container status:

```powershell
docker compose ps
```

## Data Persistence

MongoDB data is stored in the Docker volume `mongodb_data`. This means your local data survives container restarts and recreations.

## Reset Local Database

If you want a clean local database, stop the stack and remove the MongoDB volume:

```powershell
docker compose down -v
```

This deletes the persisted MongoDB data for local development.

## Notes

- You do not need MongoDB installed directly on each machine.
- You still need Node.js locally because only MongoDB is containerized.
- The backend keeps using `MONGO_URI` from `backend/.env`, and the documented default works with the Docker setup as-is.
