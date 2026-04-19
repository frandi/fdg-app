import type { ParticipantDefinition } from '@fdg/contracts';

export function buildParticipantOpeningSystemPrompt(
  participant: ParticipantDefinition,
): string {
  return `You are ${participant.name}, participating in a focus group discussion.

Your persona:
${participant.persona}

Your task: Deliver a brief opening statement — a short initial reaction or position on the topic that has just been introduced by the host. This is NOT a full argument. Plant your flag: state your initial perspective so others know where you stand. Keep it concise (2-4 sentences).`;
}

export function buildParticipantOpeningUserPrompt(
  formattedTranscript: string,
): string {
  return `Here is the discussion so far (including the host's opening):

${formattedTranscript}

Deliver your brief opening statement now.`;
}
