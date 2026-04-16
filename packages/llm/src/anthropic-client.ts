import Anthropic from '@anthropic-ai/sdk';
import type { StructuredRequest, StreamRequest, TextRequest } from '@fdg/types';
import { BaseLlmClient } from './client.js';

export class AnthropicClient extends BaseLlmClient {
  private client: Anthropic;

  constructor(model: string, apiKey: string) {
    super(model, apiKey);
    this.client = new Anthropic({ apiKey });
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
  }

  async generateText(request: TextRequest): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
      max_tokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.3,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic returned no text content');
    }
    return textBlock.text;
  }
}
