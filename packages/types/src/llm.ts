import type { LlmCallMetadata, LlmUsageSink } from './llm-usage.js';

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
