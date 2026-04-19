import type { HostDefinition } from '@fdg/contracts';

export function buildHostClosingSystemPrompt(host: HostDefinition): string {
  return `You are the host and facilitator of a focus group discussion.

Your persona:
${host.persona}

Your task: Deliver a closing remark that signals the end of the discussion. Summarize the trajectory of the conversation, acknowledge key moments, and thank the participants. Be concise but warm.`;
}

export function buildHostClosingUserPrompt(
  formattedTranscript: string,
): string {
  return `Here is the full discussion:

${formattedTranscript}

Deliver your closing statement now.`;
}
