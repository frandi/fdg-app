import type { LlmProvider } from './enums.js';

export type LlmCallType =
  | 'opening'
  | 'bid'
  | 'speak'
  | 'evaluate_bids'
  | 'checkpoint'
  | 'closing'
  | 'summary';

export interface LlmCallMetadata {
  actor: string;
  callType: LlmCallType;
}

export interface LlmUsageRecord {
  actor: string;
  callType: LlmCallType;
  provider: LlmProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number | null;
  cacheCreationTokens: number | null;
  timestampMs: number;
}

export interface LlmUsageRow extends LlmUsageRecord {
  sessionId: string;
  seq: number;
  turnNumber: number | null;
}

export interface UsageBucket {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface SessionUsage {
  totals: UsageBucket;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  byActor: Record<string, UsageBucket>;
  byCallType: Record<LlmCallType, UsageBucket>;
  byModel: Record<string, UsageBucket & { provider: LlmProvider }>;
  largestCall: {
    actor: string;
    callType: LlmCallType;
    model: string;
    totalTokens: number;
  } | null;
  speakCount: number;
  speakAvgTokens: number;
}

export type LlmUsageSink = (record: LlmUsageRecord) => void;
