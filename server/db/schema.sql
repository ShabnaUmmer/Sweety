-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot         TEXT NOT NULL CHECK (slot IN
                 ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')),
  -- Same limits as GLUCOSE_MIN / GLUCOSE_MAX in src/constants.js, kept here as a last line of defence.
  value        INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One reading per slot per day. With four slots this also caps a day at four readings,
  -- and it holds even when two requests arrive at the same time.
  CONSTRAINT readings_one_per_slot_per_day UNIQUE (user_id, reading_date, slot)
);
-- The UNIQUE constraint's index also serves report queries filtered by user and date range.
-- "Date cannot be in the future" depends on APP_TIMEZONE, so the API enforces it, not the database.
