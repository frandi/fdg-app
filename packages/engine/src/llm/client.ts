import type {
  LlmClientInterface,
  LlmUsageSink,
  StructuredRequest,
  StreamRequest,
  TextRequest,
} from '../internal-types.js';

export type { LlmClientInterface as LlmClient };

export abstract class BaseLlmClient implements LlmClientInterface {
  protected usageSink?: LlmUsageSink;

  constructor(
    protected model: string,
    protected apiKey: string,
  ) {}

  setUsageSink(sink: LlmUsageSink): void {
    this.usageSink = sink;
  }

  abstract generateStructured<T>(request: StructuredRequest): Promise<T>;
  abstract generateStream(request: StreamRequest): AsyncIterable<string>;
  abstract generateText(request: TextRequest): Promise<string>;
}
