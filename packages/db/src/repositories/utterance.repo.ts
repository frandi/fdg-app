import type BetterSqlite3 from 'better-sqlite3';
import type { Utterance, UtteranceType } from '@fdg/types';

export class UtteranceRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(
    sessionId: string,
    speakerId: string,
    speakerName: string,
    type: UtteranceType,
    content: string,
    turnNumber: number | null,
  ): Utterance {
    const result = this.db
      .prepare(
        `INSERT INTO utterances (session_id, speaker_id, speaker_name, type, content, turn_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(sessionId, speakerId, speakerName, type, content, turnNumber);

    return {
      id: Number(result.lastInsertRowid),
      sessionId,
      speakerId,
      speakerName,
      type,
      content,
      turnNumber,
      createdAt: new Date().toISOString(),
    };
  }

  getBySession(sessionId: string): Utterance[] {
    const rows = this.db
      .prepare('SELECT * FROM utterances WHERE session_id = ? ORDER BY id')
      .all(sessionId) as Record<string, unknown>[];

    return rows.map((row) => ({
      id: row.id as number,
      sessionId: row.session_id as string,
      speakerId: row.speaker_id as string,
      speakerName: row.speaker_name as string,
      type: row.type as UtteranceType,
      content: row.content as string,
      turnNumber: row.turn_number as number | null,
      createdAt: row.created_at as string,
    }));
  }
}
