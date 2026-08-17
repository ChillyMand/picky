CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  public_code TEXT NOT NULL UNIQUE,
  pair_code TEXT,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_public_code ON sessions(public_code);
CREATE INDEX IF NOT EXISTS idx_sessions_pair_code ON sessions(pair_code);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  pair_key TEXT NOT NULL UNIQUE,
  first_code TEXT NOT NULL,
  second_code TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_viewed_at TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
