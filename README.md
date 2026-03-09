# Urlopy v2 (Leave Management App)

A leave management application built with Next.js, Prisma, and SQLite.

## Overview

This app supports:

- User registration and login (JWT in `httpOnly` cookie)
- Role-based access (`employee`, `leader`)
- Creating and managing leave requests
- Leader approval flow (`approved`, `rejected`, `nextDay`)
- Business-day leave counting (excludes weekends and Polish holidays)
- User management for leaders (roles, assigned leader, leave day limits)
- CSV export of leave requests
- Optional Google Calendar sync for approved requests
- Basic API rate limiting for login/registration

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma ORM
- SQLite (`better-sqlite3`)
- Tailwind CSS 4 + Radix UI components

## Project Structure

- `app/` - pages and API routes
- `components/` - reusable UI and feature components
- `lib/` - auth, validation, leave logic, calendar integration
- `prisma/` - schema, migrations, and seed scripts
- `docker-compose.yml` / `docker-compose.prod.yml` - containerized runtime

## Environment Variables

Create a `.env` file with at least:

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=replace-with-a-long-random-secret
```

Optional Google Calendar integration:

```env
GOOGLE_CALENDAR_CLIENT_EMAIL=
GOOGLE_CALENDAR_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=primary
```

## Local Development

1. Install dependencies:

```bash
npm ci
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Apply migrations:

```bash
npm run prisma:migrate
```

4. (Optional) Seed users:

```bash
npm run prisma:seed
```

5. Start dev server:

```bash
npm run dev
```

App runs on `http://localhost:3000`.

## Docker

Development-like container:

```bash
docker compose up --build
```

Production compose variant:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The container entrypoint runs Prisma migrations on startup.

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET|POST /api/leave-requests`
- `GET|PUT|DELETE /api/leave-requests/:id`
- `GET|POST|DELETE /api/request-type`
- `GET /api/users`
- `PUT /api/users/:id`
- `POST /api/users/add-days`
- `GET /api/export`

## Notes

- Middleware protects `/leave-request` and `/list-requests`.
- Random passwords created by seed set `mustChangePassword=true` and force password change after first login.
- Google Calendar sync is best-effort (request flow still works if calendar credentials are missing).
