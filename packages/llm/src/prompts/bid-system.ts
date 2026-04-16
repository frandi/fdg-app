import type { ParticipantDefinition } from '@fdg/types';

export function buildBidSystemPrompt(participant: ParticipantDefinition): string {
  return `You are ${participant.name}, participating in a focus group discussion.

Your persona:
${participant.persona}

Your task: Read the discussion transcript below and submit a BID indicating what you would like to say next. Do NOT write your full response — only indicate your intent.

Your bid must include:
- bidType: one of "new_point", "direct_response", "counter", "follow_up_question", "synthesis", "redirect"
- summary: 1-2 sentences describing what you intend to say if given the floor

Bid type definitions:
- new_point: Introducing a new argument, perspective, or information not yet raised
- direct_response: Responding specifically to the previous speaker
- counter: Directly challenging or rebutting a specific claim
- follow_up_question: Asking a clarifying or probing question
- synthesis: Attempting to reconcile or connect multiple viewpoints
- redirect: Suggesting the discussion is drifting and proposing a return to the core topic

Stay in character. Your bid should reflect your persona's perspective and communication style.`;
}

export function buildBidUserPrompt(formattedTranscript: string): string {
  return `Here is the discussion so far:

${formattedTranscript}

Submit your bid now.`;
}
