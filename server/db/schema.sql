-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For a database created before the doctor role existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'doctor'));

CREATE TABLE IF NOT EXISTS readings (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot         TEXT NOT NULL CHECK (slot IN
                 ('morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner')),
  value        INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One reading per slot per day. With four slots this also limits a day to four readings.
  CONSTRAINT readings_one_per_slot_per_day UNIQUE (user_id, reading_date, slot)
);

-- Which patients a doctor may view.
CREATE TABLE IF NOT EXISTS doctor_patients (
  doctor_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, patient_id),
  CHECK (doctor_id <> patient_id)
);
