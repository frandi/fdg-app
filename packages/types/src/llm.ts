export interface StructuredRequest {
  systemPrompt: string;
  userPrompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TextRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmClientInterface {
  generateStructured<T>(request: StructuredRequest): Promise<T>;
  generateStream(request: StreamRequest): AsyncIterable<string>;
  generateText(request: TextRequest): Promise<string>;
}
