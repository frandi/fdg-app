import type BetterSqlite3 from 'better-sqlite3';

export class SummaryReportRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(sessionId: string, content: string): void {
    this.db
      .prepare('INSERT INTO summary_reports (session_id, content) VALUES (?, ?)')
      .run(sessionId, content);
  }

  getBySession(sessionId: string): string | undefined {
    const row = this.db
      .prepare('SELECT content FROM summary_reports WHERE session_id = ?')
      .get(sessionId) as { content: string } | undefined;

    return row?.content;
  }
}
