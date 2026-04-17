import type BetterSqlite3 from 'better-sqlite3';

export function migrate003(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_usage (
      session_id            TEXT NOT NULL REFERENCES sessions(id),
      seq                   INTEGER NOT NULL,
      timestamp_ms          INTEGER NOT NULL,
      turn_number           INTEGER,
      actor                 TEXT NOT NULL,
      call_type             TEXT NOT NULL,
      provider              TEXT NOT NULL,
      model                 TEXT NOT NULL,
      input_tokens          INTEGER NOT NULL,
      output_tokens         INTEGER NOT NULL,
      cache_read_tokens     INTEGER,
      cache_creation_tokens INTEGER,
      PRIMARY KEY (session_id, seq)
    );

    CREATE INDEX IF NOT EXISTS idx_llm_usage_session
      ON llm_usage(session_id, seq);
  `);
}
