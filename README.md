# Amateur Sports Matchmaking Platform

Web app for finding and organizing informal amateur games (1-on-1 and team). Built as a bachelor thesis project.

## What you need

- Node.js 20+
- npm
- Docker Desktop (for PostgreSQL + PostGIS), with `docker` available in PATH

## Setup

1. Start the database:

```bash
docker compose up -d
```

Wait a few seconds until Postgres is ready.

2. Copy env files (already filled with local defaults):

```bash
copy packages\db\.env.example packages\db\.env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```

On macOS/Linux use `cp` instead of `copy`.

3. Install packages from the repo root:

```bash
npm install
```

4. Run migrations (creates tables + PostGIS `location` column) and seed data:

```bash
npm run db:migrate
npm run db:seed
```

Seed creates sports and a demo user:

- email: `demo@sports.local`
- password: `demo1234`

## Run in development

From the repo root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:4000

## Notes

Search with location + radius uses PostGIS `ST_DWithin`. Joining a game locks the game row (`SELECT FOR UPDATE`) inside a transaction so the player cap cannot be exceeded if two people join at the same time.

Chat is only available after you join the game.
