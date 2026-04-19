import type { ParticipantDefinition } from '@fdg/contracts';

export function buildSpeakSystemPrompt(participant: ParticipantDefinition): string {
  return `You are ${participant.name}, participating in a focus group discussion. You have been granted the floor to speak.

Your persona:
${participant.persona}

Deliver your response now. Speak naturally and in character. Be substantive but concise — aim for a focused contribution that advances the discussion. Do not repeat what others have already said unless you are building on it in a meaningful way.`;
}

export function buildSpeakUserPrompt(
  formattedTranscript: string,
  bidSummary: string,
): string {
  return `Here is the discussion so far:

${formattedTranscript}

You indicated you wanted to say: "${bidSummary}"

Now deliver your full response.`;
}
