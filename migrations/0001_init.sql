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
