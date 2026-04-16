import type { SessionPhase } from './enums.js';
import type { HostDefinition, ParticipantDefinition } from './agent.js';
import type { Utterance } from './transcript.js';
import type { Whisper } from './whisper.js';

export interface SessionConfig {
  topic: string;
  goal: string;
  turnLimit: number;
  host: HostDefinition;
  participants: ParticipantDefinition[];
}

export interface SessionState {
  id: string;
  config: SessionConfig;
  phase: SessionPhase;
  currentTurn: number;
  transcript: Utterance[];
  pendingWhispers: Whisper[];
}

export interface SessionSummary {
  topicAndGoal: string;
  keyPositions: Array<{ participantName: string; position: string }>;
  pointsOfAgreement: string[];
  pointsOfContention: string[];
  emergingConsensus: string | null;
  unresolvedQuestions: string[];
  recommendation: string | null;
}
