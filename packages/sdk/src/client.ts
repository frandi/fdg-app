import type {
  SessionConfig,
  SessionSummary,
  Utterance,
  ParticipantDefinition,
  LlmProvider,
  SessionUsage,
} from '@fdg/contracts';
import type { SessionRow } from '@fdg/db';
import type { EngineEventStream } from './events.js';

export interface ReplayOptions {
  charsPerChunk?: number;
  chunkDelayMs?: number;
  onFinished?: () => void;
}

export interface ResumedSession {
  sessionId: string;
  config: SessionConfig;
  transcript: Utterance[];
  summary: SessionSummary | null;
}

export interface SessionHandle {
  sessionId: string;
  events: EngineEventStream;
  submitWhisper(message: string): void;
  respondToTurnLimit(action: 'conclude' | 'extend', extraTurns?: number): void;
  wait(): Promise<SessionSummary>;
}

export interface ReplayHandle {
  events: EngineEventStream;
  start(): void;
  stop(): void;
}

export interface ParticipantCreateInput {
  name: string;
  persona: string;
  llmProvider: LlmProvider;
  llmModel: string;
}

export type ParticipantPatch = Partial<
  Pick<ParticipantDefinition, 'name' | 'persona' | 'llmProvider' | 'llmModel'>
>;

export interface ParticipantPoolApi {
  list(): ParticipantDefinition[];
  create(input: ParticipantCreateInput): ParticipantDefinition;
  update(id: string, patch: ParticipantPatch): void;
  delete(id: string): void;
}

export interface FdgClient {
  startSession(config: SessionConfig): SessionHandle;
  resumeSession(sessionId: string): ResumedSession | null;
  listSessions(): SessionRow[];
  getTranscript(sessionId: string): Utterance[];
  getSummary(sessionId: string): SessionSummary | null;
  getUsage(sessionId: string): SessionUsage;
  hasReplayData(sessionId: string): boolean;
  replaySession(sessionId: string, opts?: ReplayOptions): ReplayHandle;
  participants: ParticipantPoolApi;
  close(): void;
}

export interface CreateClientOptions {
  /** Path to the SQLite file. If omitted, defaults to ~/.fdg/fdg.db. */
  dataDir?: string;
  /** Override for the SQLite filename within dataDir. Defaults to "fdg.db". */
  dbFileName?: string;
}
