# Community Event Planner

Full-stack event planning app with:
- React + Vite frontend
- Express + Prisma + PostgreSQL backend

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL database (or managed Postgres URL)

## Environment Setup

1. Create backend env file:
   - Copy `backend/.env.example` to `backend/.env`
2. Create frontend env file:
   - Copy `frontend/.env.example` to `frontend/.env`
3. Set `DATABASE_URL` in `backend/.env` to your database.

## Install

```bash
npm install
npm install --prefix frontend
```

## Database Setup

Run once after setting `DATABASE_URL`:

```bash
npm run db:push
```

## Run (One Command)

```bash
npm start
```

`npm start` now performs startup preflight checks and then starts both services with conflict-safe ports:
- validates Node.js version (`>=18`)
- validates `DATABASE_URL` is present and looks like a PostgreSQL URL
- chooses a free backend port (starting at `5001`)
- chooses a free frontend port (starting at `3000`)
- wires frontend proxy to the selected backend origin automatically

If your preferred ports are busy, the app auto-shifts to the next available ports and logs the selected URLs.

## Available Scripts

- `npm start` - runs frontend + backend together
- `npm run dev` - same as `npm start`
- `npm run dev:backend` - backend only (default backend port from env)
- `npm run dev:frontend` - frontend only (default frontend port behavior)
- `npm run lint` - frontend lint
- `npm run build` - frontend build
- `npm run db:push` - sync Prisma schema to DB

## Runtime Safety Notes

- If `backend/.env` is missing or `DATABASE_URL` is invalid, startup fails fast with a clear error.
- Backend verifies database connectivity during boot instead of failing later on the first API call.

## Auth Roles

- `user` role: normal account
- `admin` role: requires `ADMIN_INVITE_KEY` during registration

Keep `.env` files private and never commit them.
