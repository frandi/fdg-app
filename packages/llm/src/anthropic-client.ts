import Anthropic from '@anthropic-ai/sdk';
import {
  LlmProvider,
  type LlmCallMetadata,
  type StructuredRequest,
  type StreamRequest,
  type TextRequest,
} from '@fdg/types';
import { BaseLlmClient } from './client.js';

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

export class AnthropicClient extends BaseLlmClient {
  private client: Anthropic;

  constructor(model: string, apiKey: string) {
    super(model, apiKey);
    this.client = new Anthropic({ apiKey });
  }

  private reportUsage(
    metadata: LlmCallMetadata | undefined,
    usage: AnthropicUsage | undefined,
  ): void {
    if (!metadata || !this.usageSink || !usage) return;
    this.usageSink({
      actor: metadata.actor,
      callType: metadata.callType,
      provider: LlmProvider.Anthropic,
      model: this.model,
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      cacheReadTokens: usage.cache_read_input_tokens ?? null,
      cacheCreationTokens: usage.cache_creation_input_tokens ?? null,
      timestampMs: Date.now(),
    });
  }

  async generateStructured<T>(request: StructuredRequest): Promise<T> {
    const response = await this.client.messages.create({
      model: this.model,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
      max_tokens: request.maxTokens ?? 500,
      temperature: request.temperature ?? 0.3,
      tools: [
        {
          name: 'structured_response',
          description: 'Provide a structured response',
          input_schema: request.schema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: 'structured_response' },
    });

    this.reportUsage(request.metadata, response.usage);

    const toolBlock = response.content.find((block) => block.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('Anthropic did not return tool use response');
    }
    return toolBlock.input as T;
  }

  async *generateStream(request: StreamRequest): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
      max_tokens: request.maxTokens ?? 800,
      temperature: request.temperature ?? 0.7,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }

    const finalMessage = await stream.finalMessage();
    this.reportUsage(request.metadata, finalMessage.usage);
  }

  async generateText(request: TextRequest): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
      max_tokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.3,
    });

    this.reportUsage(request.metadata, response.usage);

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic returned no text content');
    }
    return textBlock.text;
  }
}
