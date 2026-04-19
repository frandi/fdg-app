import type BetterSqlite3 from 'better-sqlite3';
import type { Whisper } from '@fdg/contracts';

export class WhisperRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(sessionId: string, message: string, turnNumber: number): Whisper {
    const result = this.db
      .prepare(
        `INSERT INTO whispers (session_id, message, turn_number) VALUES (?, ?, ?)`,
      )
      .run(sessionId, message, turnNumber);

    return {
      id: Number(result.lastInsertRowid),
      sessionId,
      message,
      turnNumber,
      processed: false,
      createdAt: new Date().toISOString(),
    };
  }

  getUnprocessed(sessionId: string): Whisper[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM whispers WHERE session_id = ? AND processed = 0 ORDER BY id',
      )
      .all(sessionId) as Record<string, unknown>[];

    return rows.map((row) => ({
      id: row.id as number,
      sessionId: row.session_id as string,
      message: row.message as string,
      turnNumber: row.turn_number as number,
      processed: false,
      createdAt: row.created_at as string,
    }));
  }

  markProcessed(whisperIds: number[]): void {
    if (whisperIds.length === 0) return;
    const placeholders = whisperIds.map(() => '?').join(',');
    this.db
      .prepare(`UPDATE whispers SET processed = 1 WHERE id IN (${placeholders})`)
      .run(...whisperIds);
  }
}
