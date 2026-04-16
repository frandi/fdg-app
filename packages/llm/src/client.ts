import type { LlmClientInterface, StructuredRequest, StreamRequest, TextRequest } from '@fdg/types';

export type { LlmClientInterface as LlmClient };

export abstract class BaseLlmClient implements LlmClientInterface {
  constructor(
    protected model: string,
    protected apiKey: string,
  ) {}

  abstract generateStructured<T>(request: StructuredRequest): Promise<T>;
  abstract generateStream(request: StreamRequest): AsyncIterable<string>;
  abstract generateText(request: TextRequest): Promise<string>;
}
