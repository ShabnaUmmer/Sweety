# Sweety

Sweety is a small web app for recording blood glucose readings. A user signs up, records up to four readings a day (mg/dl), and views daily, month-to-date and previous-month reports.

Stack: React + Vite, Node.js + Express, PostgreSQL, bcrypt, JWT. Everything runs locally with Node.js, npm and a locally installed PostgreSQL.

Sweety is a tracking tool only. It does not classify readings, show "normal ranges" or give medical advice.

## Implemented features

- Sign up and log in. Passwords are hashed with bcrypt (the `bcryptjs` package) and never returned by the API. Sessions use JWT. A logged-in user sees only their own data.
- Add, view, edit and delete readings in four slots: Morning (fasting), After breakfast, After lunch, After dinner.
- Server-side validation with clear messages next to the field: value required, whole number between 40 and 600, one reading per slot per day, at most 4 per day, no future dates.
- Daily, month-to-date and previous-month reports with highest, lowest, average (1 decimal) and count, plus an empty state. The daily report lists each reading with its slot.
- Delete confirmation, loading and error states, and expired-session handling.

The optional doctor role is **not implemented**.

## Project layout

```
server/   Express API: routes -> controllers -> queries, with validation, dates and constants in their own modules
client/   React app (Vite): pages, a few shared components, one API module
```

## Prerequisites

- Node.js 20 or newer (with npm)
- PostgreSQL 14 or newer, installed locally

## Install PostgreSQL and create the databases

Install PostgreSQL if you do not have it:

- macOS (Homebrew): `brew install postgresql@16` then `brew services start postgresql@16`
- Ubuntu/Debian: `sudo apt install postgresql` then `sudo service postgresql start`
- Windows: use the installer from postgresql.org and remember the password you set for the `postgres` user.

Open a PostgreSQL shell (`psql -U postgres`, or `sudo -u postgres psql` on Linux) and run:

```sql
CREATE USER sweety_user WITH PASSWORD 'your_password';
CREATE DATABASE sweety OWNER sweety_user;
CREATE DATABASE sweety_test OWNER sweety_user;
```

`sweety` holds your data. `sweety_test` is used only by the tests, which empty its tables on every run, so never point it at a database you care about.

## Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set `DATABASE_URL`, `TEST_DATABASE_URL` and `JWT_SECRET` (for example `openssl rand -hex 32`). The file lists every variable with comments. `APP_TIMEZONE` (default `Asia/Kolkata`) decides what "today" means. `.env` is ignored by Git; do not commit it.

## Install, migrate and seed

```bash
npm run install:all     # installs server/ and client/ dependencies and creates package-lock.json files
npm run db:migrate      # creates the tables (safe to run again)
npm run db:seed         # optional: creates the demo account with sample readings
```

Commit the generated `package-lock.json` files (`server/` and `client/`) so installs are repeatable.

### Demo account

After `npm run db:seed`: `demo@sweety.test` / `demo-pass-123`. The seeded readings are made-up sample values for demonstration, covering the current and previous month. Re-running the seed replaces the demo account.

## Run the backend

```bash
npm run dev --prefix server      # http://localhost:4000, restarts on file changes
# or: npm start --prefix server
```

## Run the frontend

In a second terminal:

```bash
npm run dev --prefix client      # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server forwards `/api` requests to the backend on port 4000.

## Run the tests

```bash
npm test
```

This runs the server tests with Node's built-in test runner and `supertest` against `TEST_DATABASE_URL`. PostgreSQL must be running and the test database must exist; the tests create the tables themselves. They cover registration and login, wrong password, missing/invalid/expired tokens, access to another user's reading, valid and invalid readings (missing value, decimal, out of range, future date, duplicate slot, fifth reading on a day, two simultaneous duplicate requests), update and delete, and the daily, month-to-date and previous-month calculations, including empty results and month boundaries. Tests for date and validation logic need no database.

## Build the frontend

```bash
npm run build
```

Creates `client/dist`. Sweety is run locally; this repository has no deployment setup.

## API summary

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Return `{ token, user }` |
| GET | `/api/auth/me` | Current user |
| GET | `/api/meta` | Public: today (in `APP_TIMEZONE`), slots, limits |
| GET | `/api/readings?date=YYYY-MM-DD` | Own readings for that date |
| POST | `/api/readings` | Body `{ date, slot, value }` |
| PUT / DELETE | `/api/readings/:id` | Own readings only; another user's ID returns 404 |
| GET | `/api/reports/daily`, `/month-to-date`, `/monthly` (`?date=`) | `{ from, to, count, highest, lowest, average }`, plus `readings` for daily |

Errors share one shape: `{ "error": { "message", "fields", "code" } }`. Stack traces and database details are never sent to the client.

## Design decisions

- **Time zone.** "Today" is computed in `APP_TIMEZONE` using `Intl`, never the server's or database's local time. Dates are stored as PostgreSQL `DATE` and passed as `'YYYY-MM-DD'` parameters; `CURRENT_DATE` is not used, and the `pg` driver returns dates as strings so they cannot shift a day. The client asks the API for "today" instead of using the browser clock.
- **Duplicates and the daily limit.** A `UNIQUE (user_id, reading_date, slot)` constraint is the only guard, so simultaneous requests cannot both succeed. With exactly four slots it also caps a day at four readings. When it fires, the API says "You can add only 4 readings per day." if the day already has four readings, otherwise it names the duplicate slot. Each write is a single statement, so no transaction is needed.
- **Ownership.** Identity comes only from the verified token. Every reading and report query filters on `user_id`, and all SQL is parameterised.
- **Validation lives on the server.** The client shows the server's messages next to the matching field and gets slots, limits and "today" from `/api/meta`.
- **Sessions.** JWT (HS256, 2 hours by default) sent in the `Authorization` header and kept in `sessionStorage`. An expired or invalid token returns the user to the login page with a message.
- **Dependencies.** Server: `express`, `pg`, `bcryptjs` (a pure-JavaScript bcrypt, so no native build step), `jsonwebtoken`, `cors`, `dotenv`; tests use `supertest`. Client: `react`, `react-dom`, `react-router-dom`, Vite, and two `@fontsource` packages so Atkinson Hyperlegible and Source Serif 4 are bundled rather than loaded from a third party.
- **Look.** Warm off-white, one deep teal, red only for errors and destructive actions. Glucose values are never colour-coded because the app defines no ranges.

## Assumptions

- Editing may change a reading's date, slot and value; the same rules apply as when adding.
- Reports for a future date are rejected. The monthly report is the calendar month before the selected date's month.
- Passwords need 8+ characters; emails are stored lowercase.
- "Future date" is enforced by the API, not the database, because it depends on `APP_TIMEZONE`.

## Known limitations

- No rate limiting or extra security headers (kept out to keep the stack minimal); add them before exposing the app publicly.
- The token is stored in `sessionStorage`, which scripts on the page can read; an httpOnly cookie would need CSRF protection.
- No password reset, email verification or account deletion.
- No frontend automated tests.
- The doctor role is not implemented.
- No screenshots are included; add your own to `docs/screenshots/`.

## Possible future improvements

- The optional doctor role with backend-enforced patient assignment, after everything above is verified.
- Frontend tests and an end-to-end test.
- Password reset, history view and CSV export.

## First run checklist

This version was prepared in an environment without network access or PostgreSQL, so only the date and validation unit tests, a server syntax check and a client import/JSX check were run. Before relying on it, run these on your machine, in order, and fix anything they report:

1. `npm run install:all`
2. `npm test`
3. `npm run build`
