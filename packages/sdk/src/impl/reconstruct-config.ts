import type { SessionConfig, ParticipantDefinition } from '@fdg/contracts';
import type { SessionRow } from '@fdg/engine';

export function reconstructConfig(
  row: SessionRow,
  participants: ParticipantDefinition[],
): SessionConfig {
  return {
    topic: row.topic,
    goal: row.goal,
    turnLimit: row.turnLimit,
    host: {
      persona: row.hostPersona,
      llmProvider: row.hostLlmProvider as ParticipantDefinition['llmProvider'],
      llmModel: row.hostLlmModel,
    },
    participants,
  };
}
