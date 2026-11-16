-- Library API schema. Run this on an empty database.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100),
  birth_year INTEGER,
  CONSTRAINT unique_name_birth_year UNIQUE (name, birth_year)
);

CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  published_year INTEGER,
  author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
  total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  CONSTRAINT chk_available_copies CHECK (available_copies <= total_copies)
);

CREATE TABLE IF NOT EXISTS borrowings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  borrowed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  returned_at TIMESTAMP,
  CHECK (due_date >= borrowed_at),
  CHECK (returned_at IS NULL OR returned_at >= borrowed_at)
);

-- One active loan per member per book (rows with returned_at set are not counted)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_borrowing
ON borrowings (user_id, book_id)
WHERE returned_at IS NULL;