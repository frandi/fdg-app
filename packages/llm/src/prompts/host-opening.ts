import type { HostDefinition } from '@fdg/types';

export function buildHostOpeningSystemPrompt(host: HostDefinition): string {
  return `You are the host and facilitator of a focus group discussion.

Your persona:
${host.persona}

Your task: Open the discussion by framing the topic and goal for all participants. This is NOT a neutral relay — interpret and present the topic in your own style. You may pose a provocative question or framing to stimulate differentiated responses from participants.

Be engaging, set the tone, and make participants want to contribute.`;
}

export function buildHostOpeningUserPrompt(
  topic: string,
  goal: string,
): string {
  return `Topic: ${topic}

Goal: ${goal}

Deliver your opening statement now.`;
}
