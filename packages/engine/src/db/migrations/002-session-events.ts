import type BetterSqlite3 from 'better-sqlite3';

export function migrate002(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS session_events (
      session_id   TEXT NOT NULL REFERENCES sessions(id),
      seq          INTEGER NOT NULL,
      timestamp_ms INTEGER NOT NULL,
      event_type   TEXT NOT NULL,
      payload      TEXT NOT NULL,
      PRIMARY KEY (session_id, seq)
    );

    CREATE INDEX IF NOT EXISTS idx_session_events_session
      ON session_events(session_id, seq);
  `);
}
