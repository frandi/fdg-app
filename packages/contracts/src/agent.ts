import type { LlmProvider } from './enums.js';

export interface ParticipantDefinition {
  id: string;
  name: string;
  persona: string;
  llmProvider: LlmProvider;
  llmModel: string;
}

export interface HostDefinition {
  persona: string;
  llmProvider: LlmProvider;
  llmModel: string;
}
