import type { HostDefinition, ParticipantDefinition } from './agent.js';

export interface SessionConfig {
  topic: string;
  goal: string;
  turnLimit: number;
  host: HostDefinition;
  participants: ParticipantDefinition[];
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
