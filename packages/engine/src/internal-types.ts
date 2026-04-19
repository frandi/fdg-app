import type { LlmProvider, LlmCallType } from '@fdg/contracts';

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

export type LlmUsageSink = (record: LlmUsageRecord) => void;

export interface StructuredRequest {
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  metadata?: LlmCallMetadata;
}

export interface StreamRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: LlmCallMetadata;
}

export interface TextRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: LlmCallMetadata;
}

export interface LlmClientInterface {
  generateStructured<T>(request: StructuredRequest): Promise<T>;
  generateStream(request: StreamRequest): AsyncIterable<string>;
  generateText(request: TextRequest): Promise<string>;
  setUsageSink(sink: LlmUsageSink): void;
}
