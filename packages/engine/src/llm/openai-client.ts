import OpenAI from 'openai';
import { LlmProvider } from '@fdg/contracts';
import type {
  LlmCallMetadata,
  StructuredRequest,
  StreamRequest,
  TextRequest,
} from '../internal-types.js';
import { BaseLlmClient } from './client.js';

interface OpenAIUsage {
  input_tokens?: number;
  output_tokens?: number;
}

export class OpenAIClient extends BaseLlmClient {
  private client: OpenAI;

  constructor(model: string, apiKey: string) {
    super(model, apiKey);
    this.client = new OpenAI({ apiKey });
  }

  private reportUsage(
    metadata: LlmCallMetadata | undefined,
    usage: OpenAIUsage | null | undefined,
  ): void {
    if (!metadata || !this.usageSink || !usage) return;
    this.usageSink({
      actor: metadata.actor,
      callType: metadata.callType,
      provider: LlmProvider.OpenAI,
      model: this.model,
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      cacheReadTokens: null,
      cacheCreationTokens: null,
      timestampMs: Date.now(),
    });
  }

  async generateStructured<T>(request: StructuredRequest): Promise<T> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: request.systemPrompt,
      input: request.userPrompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'response',
          strict: true,
          schema: request.schema,
        },
      },
      temperature: request.temperature ?? 0.3,
      max_output_tokens: request.maxTokens ?? 500,
    });

    this.reportUsage(request.metadata, response.usage);

    const content = response.output_text;
    if (!content) throw new Error('OpenAI returned empty response');
    return JSON.parse(content) as T;
  }

  async *generateStream(request: StreamRequest): AsyncIterable<string> {
    const stream = await this.client.responses.create({
      model: this.model,
      instructions: request.systemPrompt,
      input: request.userPrompt,
      temperature: request.temperature ?? 0.7,
      max_output_tokens: request.maxTokens ?? 800,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        yield event.delta;
      } else if (event.type === 'response.completed') {
        this.reportUsage(request.metadata, event.response.usage);
      }
    }
  }

  async generateText(request: TextRequest): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions: request.systemPrompt,
      input: request.userPrompt,
      temperature: request.temperature ?? 0.3,
      max_output_tokens: request.maxTokens ?? 2000,
    });

    this.reportUsage(request.metadata, response.usage);

    const content = response.output_text;
    if (!content) throw new Error('OpenAI returned empty response');
    return content;
  }
}
