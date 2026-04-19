import type { LlmProvider } from './enums.js';

export type LlmCallType =
  | 'opening'
  | 'bid'
  | 'speak'
  | 'evaluate_bids'
  | 'checkpoint'
  | 'closing'
  | 'summary';

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
