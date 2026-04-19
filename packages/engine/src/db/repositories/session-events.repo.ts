import type BetterSqlite3 from 'better-sqlite3';

export interface SessionEventRow {
  seq: number;
  timestampMs: number;
  type: string;
  payload: unknown;
}

export class SessionEventsRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(
    sessionId: string,
    seq: number,
    timestampMs: number,
    type: string,
    payload: unknown,
  ): void {
    this.db
      .prepare(
        `INSERT INTO session_events (session_id, seq, timestamp_ms, event_type, payload)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(sessionId, seq, timestampMs, type, JSON.stringify(payload ?? {}));
  }

  getBySession(sessionId: string): SessionEventRow[] {
    const rows = this.db
      .prepare(
        `SELECT seq, timestamp_ms, event_type, payload
         FROM session_events
         WHERE session_id = ?
         ORDER BY seq`,
      )
      .all(sessionId) as Record<string, unknown>[];

    return rows.map((row) => ({
      seq: row.seq as number,
      timestampMs: row.timestamp_ms as number,
      type: row.event_type as string,
      payload: JSON.parse(row.payload as string),
    }));
  }
}
