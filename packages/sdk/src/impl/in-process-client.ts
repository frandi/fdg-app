import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import type {
  SessionConfig,
  SessionSummary,
  Utterance,
  ParticipantDefinition,
  SessionUsage,
} from '@fdg/contracts';
import { Database, type SessionRow } from '@fdg/db';
import {
  SessionOrchestrator,
  EngineEventBus,
  SessionReplayer,
} from '@fdg/engine';
import type {
  FdgClient,
  CreateClientOptions,
  SessionHandle,
  ReplayHandle,
  ReplayOptions,
  ResumedSession,
  ParticipantPoolApi,
  ParticipantCreateInput,
  ParticipantPatch,
} from '../client.js';
import { createEngineEventStream } from './event-stream.js';
import { reconstructConfig } from './reconstruct-config.js';

export function createFdgClient(opts: CreateClientOptions = {}): FdgClient {
  if (opts.database) {
    return new InProcessFdgClient(opts.database, /* ownsDb */ false);
  }

  const dataDir = opts.dataDir ?? join(homedir(), '.fdg');
  mkdirSync(dataDir, { recursive: true });

  const dbPath = join(dataDir, opts.dbFileName ?? 'fdg.db');
  const db = new Database(dbPath);

  return new InProcessFdgClient(db, /* ownsDb */ true);
}

class InProcessFdgClient implements FdgClient {
  readonly participants: ParticipantPoolApi;

  constructor(
    private db: Database,
    private ownsDb: boolean,
  ) {
    this.participants = createParticipantPoolApi(db);
  }

  startSession(config: SessionConfig): SessionHandle {
    const bus = new EngineEventBus();
    const orchestrator = new SessionOrchestrator(config, this.db, bus);
    const events = createEngineEventStream(bus);
    const runPromise = orchestrator.run();

    return {
      sessionId: orchestrator.getSessionId(),
      events,
      submitWhisper: (message) => orchestrator.submitWhisper(message),
      respondToTurnLimit: (action, extraTurns) =>
        orchestrator.respondToTurnLimit(action, extraTurns),
      wait: () => runPromise,
    };
  }

  resumeSession(sessionId: string): ResumedSession | null {
    const row = this.db.sessions.getById(sessionId);
    if (!row) return null;

    const participants = this.db.sessions.getParticipants(sessionId);
    const config = reconstructConfig(row, participants);
    const transcript = this.db.utterances.getBySession(sessionId);
    const summary = this.getSummary(sessionId);

    return { sessionId, config, transcript, summary };
  }

  listSessions(): SessionRow[] {
    return this.db.sessions.listCompletedWithSummary();
  }

  getTranscript(sessionId: string): Utterance[] {
    return this.db.utterances.getBySession(sessionId);
  }

  getSummary(sessionId: string): SessionSummary | null {
    const content = this.db.summaryReports.getBySession(sessionId);
    if (!content) return null;
    return JSON.parse(content) as SessionSummary;
  }

  getUsage(sessionId: string): SessionUsage {
    return this.db.llmUsage.aggregateBySession(sessionId);
  }

  hasReplayData(sessionId: string): boolean {
    return this.db.sessionEvents.getBySession(sessionId).length > 0;
  }

  replaySession(sessionId: string, opts: ReplayOptions = {}): ReplayHandle {
    const bus = new EngineEventBus();
    const replayer = new SessionReplayer(sessionId, this.db, bus, opts);
    const events = createEngineEventStream(bus);

    return {
      events,
      start: () => replayer.start(),
      stop: () => replayer.stop(),
    };
  }

  close(): void {
    if (this.ownsDb) {
      this.db.close();
    }
  }
}

function createParticipantPoolApi(db: Database): ParticipantPoolApi {
  return {
    list(): ParticipantDefinition[] {
      return db.participants.getAll();
    },
    create(input: ParticipantCreateInput): ParticipantDefinition {
      const id = db.participants.create(
        input.name,
        input.persona,
        input.llmProvider,
        input.llmModel,
      );
      const created = db.participants.getById(id);
      if (!created) {
        throw new Error(`Participant ${id} vanished immediately after create`);
      }
      return created;
    },
    update(id: string, patch: ParticipantPatch): void {
      db.participants.update(id, patch);
    },
    delete(id: string): void {
      db.participants.delete(id);
    },
  };
}
