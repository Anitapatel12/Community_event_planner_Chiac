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

This starts:
- backend on `http://localhost:5001`
- frontend on `http://localhost:3000` (auto-falls back to next free port if occupied)

## Available Scripts

- `npm start` - runs frontend + backend together
- `npm run dev:backend` - backend only
- `npm run dev:frontend` - frontend only
- `npm run lint` - frontend lint
- `npm run build` - frontend build
- `npm run db:push` - sync Prisma schema to DB

## Auth Roles

- `user` role: normal account
- `admin` role: requires `ADMIN_INVITE_KEY` during registration

Keep `.env` files private and never commit them.
