import OpenAI from 'openai';
import type { StructuredRequest, StreamRequest, TextRequest } from '@fdg/types';
import { BaseLlmClient } from './client.js';

export class OpenAIClient extends BaseLlmClient {
  private client: OpenAI;

  constructor(model: string, apiKey: string) {
    super(model, apiKey);
    this.client = new OpenAI({ apiKey });
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

    const content = response.output_text;
    if (!content) throw new Error('OpenAI returned empty response');
    return content;
  }
}
