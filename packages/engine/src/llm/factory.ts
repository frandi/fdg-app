import { LlmProvider } from '@fdg/contracts';
import type { LlmClientInterface } from '../internal-types.js';
import { OpenAIClient } from './openai-client.js';
import { AnthropicClient } from './anthropic-client.js';

export function createLlmClient(
  provider: LlmProvider,
  model: string,
): LlmClientInterface {
  switch (provider) {
    case LlmProvider.OpenAI: {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set');
      return new OpenAIClient(model, apiKey);
    }
    case LlmProvider.Anthropic: {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      return new AnthropicClient(model, apiKey);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
