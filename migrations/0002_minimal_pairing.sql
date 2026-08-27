DELETE FROM sessions;
DROP INDEX IF EXISTS idx_sessions_started_at;
DROP INDEX IF EXISTS idx_matches_created_at;
DROP TABLE IF EXISTS matches;
