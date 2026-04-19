import BetterSqlite3 from 'better-sqlite3';
import { migrate001 } from './migrations/001-initial.js';
import { migrate002 } from './migrations/002-session-events.js';
import { migrate003 } from './migrations/003-llm-usage.js';
import { ParticipantPoolRepository } from './repositories/participant-pool.repo.js';
import { SessionRepository } from './repositories/session.repo.js';
import { UtteranceRepository } from './repositories/utterance.repo.js';
import { BidRepository } from './repositories/bid.repo.js';
import { WhisperRepository } from './repositories/whisper.repo.js';
import { SummaryReportRepository } from './repositories/summary-report.repo.js';
import { SessionEventsRepository } from './repositories/session-events.repo.js';
import { LlmUsageRepository } from './repositories/llm-usage.repo.js';

export class Database {
  private db: BetterSqlite3.Database;

  readonly participants: ParticipantPoolRepository;
  readonly sessions: SessionRepository;
  readonly utterances: UtteranceRepository;
  readonly bids: BidRepository;
  readonly whispers: WhisperRepository;
  readonly summaryReports: SummaryReportRepository;
  readonly sessionEvents: SessionEventsRepository;
  readonly llmUsage: LlmUsageRepository;

  constructor(dbPath: string) {
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.runMigrations();

    this.participants = new ParticipantPoolRepository(this.db);
    this.sessions = new SessionRepository(this.db);
    this.utterances = new UtteranceRepository(this.db);
    this.bids = new BidRepository(this.db);
    this.whispers = new WhisperRepository(this.db);
    this.summaryReports = new SummaryReportRepository(this.db);
    this.sessionEvents = new SessionEventsRepository(this.db);
    this.llmUsage = new LlmUsageRepository(this.db);
  }

  private runMigrations(): void {
    migrate001(this.db);
    migrate002(this.db);
    migrate003(this.db);
  }

  close(): void {
    this.db.close();
  }
}
