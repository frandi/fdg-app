import type BetterSqlite3 from 'better-sqlite3';
import type { BidType } from '@fdg/types';

export interface BidRow {
  id: number;
  sessionId: string;
  turnNumber: number;
  participantId: string;
  bidType: BidType;
  summary: string;
  wasSelected: boolean;
  createdAt: string;
}

export class BidRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(
    sessionId: string,
    turnNumber: number,
    participantId: string,
    bidType: BidType,
    summary: string,
  ): number {
    const result = this.db
      .prepare(
        `INSERT INTO bids (session_id, turn_number, participant_id, bid_type, summary)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(sessionId, turnNumber, participantId, bidType, summary);

    return Number(result.lastInsertRowid);
  }

  markSelected(bidId: number): void {
    this.db.prepare('UPDATE bids SET was_selected = 1 WHERE id = ?').run(bidId);
  }

  getBySessionAndTurn(sessionId: string, turnNumber: number): BidRow[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM bids WHERE session_id = ? AND turn_number = ? ORDER BY id',
      )
      .all(sessionId, turnNumber) as Record<string, unknown>[];

    return rows.map((row) => ({
      id: row.id as number,
      sessionId: row.session_id as string,
      turnNumber: row.turn_number as number,
      participantId: row.participant_id as string,
      bidType: row.bid_type as BidType,
      summary: row.summary as string,
      wasSelected: (row.was_selected as number) === 1,
      createdAt: row.created_at as string,
    }));
  }
}
