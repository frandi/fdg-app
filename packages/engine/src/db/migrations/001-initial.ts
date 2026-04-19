import type BetterSqlite3 from 'better-sqlite3';

export function migrate001(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS participant_pool (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      persona     TEXT NOT NULL,
      llm_provider TEXT NOT NULL,
      llm_model   TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id              TEXT PRIMARY KEY,
      topic           TEXT NOT NULL,
      goal            TEXT NOT NULL,
      turn_limit      INTEGER NOT NULL,
      host_persona    TEXT NOT NULL,
      host_llm_provider TEXT NOT NULL,
      host_llm_model  TEXT NOT NULL,
      phase           TEXT NOT NULL DEFAULT 'configuring',
      current_turn    INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at    TEXT
    );

    CREATE TABLE IF NOT EXISTS session_participants (
      session_id     TEXT NOT NULL REFERENCES sessions(id),
      participant_id TEXT NOT NULL,
      name           TEXT NOT NULL,
      persona        TEXT NOT NULL,
      llm_provider   TEXT NOT NULL,
      llm_model      TEXT NOT NULL,
      seat_order     INTEGER NOT NULL,
      PRIMARY KEY (session_id, participant_id)
    );

    CREATE TABLE IF NOT EXISTS utterances (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   TEXT NOT NULL REFERENCES sessions(id),
      speaker_id   TEXT NOT NULL,
      speaker_name TEXT NOT NULL,
      type         TEXT NOT NULL,
      content      TEXT NOT NULL,
      turn_number  INTEGER,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bids (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id     TEXT NOT NULL REFERENCES sessions(id),
      turn_number    INTEGER NOT NULL,
      participant_id TEXT NOT NULL,
      bid_type       TEXT NOT NULL,
      summary        TEXT NOT NULL,
      was_selected   INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS whispers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id   TEXT NOT NULL REFERENCES sessions(id),
      message      TEXT NOT NULL,
      turn_number  INTEGER NOT NULL,
      processed    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS summary_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id  TEXT NOT NULL UNIQUE REFERENCES sessions(id),
      content     TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_utterances_session ON utterances(session_id);
    CREATE INDEX IF NOT EXISTS idx_bids_session_turn ON bids(session_id, turn_number);
    CREATE INDEX IF NOT EXISTS idx_whispers_session ON whispers(session_id);
  `);
}
