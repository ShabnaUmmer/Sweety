# Sweety

Sweety is a small blood glucose tracker. A patient records up to 4 readings a day (mg/dl) and views daily, month-to-date and previous-month reports. A doctor can view the reports of patients assigned to them.

Built with React (Vite), Node.js + Express, PostgreSQL, bcrypt and JWT.

## Features

- Sign up and log in. Passwords are hashed with bcrypt. Each patient sees only their own data.
- Add, view, edit and delete readings in four slots: Morning (fasting), After breakfast, After lunch, After dinner.
- Validation with clear messages: value required, whole number 40 to 600, one reading per slot per day, max 4 per day, no future dates.
- Reports (daily, month-to-date, previous month) with highest, lowest, average (1 decimal) and count, and an empty state.
- Doctor role (bonus): a doctor sees a list of assigned patients and their reports, read-only.

## Setup

You need Node.js 20+ and PostgreSQL installed locally.

**1. Install dependencies**

```bash
npm run install:all
```

**2. Create the databases.** In `psql`:

```sql
CREATE USER sweety_user WITH PASSWORD 'your_password';
CREATE DATABASE sweety OWNER sweety_user;
CREATE DATABASE sweety_test OWNER sweety_user;
```

**3. Create `server/.env`.** Copy `server/.env.example` to `server/.env` and fill in `DATABASE_URL`, `TEST_DATABASE_URL` (a different database, used only by the tests) and `JWT_SECRET`. The example file explains every variable. Do not commit `.env`.

**4. Create the tables and demo data**

```bash
npm run db:migrate
npm run db:seed
```

## Run

```bash
npm run dev --prefix server      # API on http://localhost:4000
npm run dev --prefix client      # app on http://localhost:5173 (second terminal)
```

## Demo accounts

All use the password `demo-pass-123`. The readings are made-up sample data.

| Email | Role | Notes |
|---|---|---|
| `demo@sweety.test` | Patient | About 6 weeks of readings |
| `patient2@sweety.test` | Patient | Assigned to the doctor |
| `patient3@sweety.test` | Patient | Not assigned to the doctor |
| `doctor@sweety.test` | Doctor | Assigned to the first two patients |

## Tests

```bash
npm test
```

Runs against `TEST_DATABASE_URL`, which must be a separate database whose name ends in `_test` (the tests refuse to run otherwise). They cover registration and login, wrong password, missing or expired tokens, validation rules, duplicate slots, a fifth reading in a day, edit and delete, one user accessing another user's reading, the three report calculations, an empty report, and the doctor rules (assigned and unassigned patients, read-only access).

## Build

```bash
npm run build
```

## How it works

- **Time zone.** "Today" comes from `APP_TIMEZONE` (default `Asia/Kolkata`), not the server or database clock. Dates are stored as `DATE` and handled as `YYYY-MM-DD` strings.
- **Duplicates.** A unique constraint on (user, date, slot) in PostgreSQL stops duplicate readings, even for simultaneous requests. With four slots it also limits a day to four readings.
- **Ownership.** The user comes from the verified JWT, never from the request. Every reading query filters by `user_id`.
- **Doctor access.** Patients and doctors have a `role`. A `doctor_patients` table lists which patients each doctor may view. Doctor routes only have GET endpoints and check that assignment on every request. Doctors get a 403 on the patient routes, so they cannot add, edit or delete readings.

## Notes

**Assumptions**

- Anyone who registers is a patient. Doctor accounts and assignments are created by the seed script (there is no admin screen).
- Reports for a future date are rejected. "Monthly" means the whole month before the selected date's month.
- Passwords need at least 8 characters.
- Sweety is a tracking tool. It does not classify readings or give medical advice.

**Limitations**

- No password reset, email verification or admin screen for assigning doctors.
- No rate limiting or extra security headers.
- The login token is kept in `sessionStorage`.
- No frontend tests.

**With more time**

- An admin page to create doctors and assign patients.
- Frontend tests and an end-to-end test.
- Password reset, and a CSV export of readings.
