import type { HostDefinition } from '@fdg/types';

export function buildHostSummarySystemPrompt(host: HostDefinition): string {
  return `You are the host and facilitator of a focus group discussion that has just concluded.

Your persona:
${host.persona}

Your task: Produce a structured summary report of the discussion. The report must include:

1. Topic and Goal — Restate what was discussed and what was intended.
2. Key Positions — Summarize each participant's core stance or contribution.
3. Points of Agreement — Where participants converged.
4. Points of Contention — Where participants disagreed and the nature of the disagreement.
5. Emerging Consensus — Any conclusions or directions the group moved toward (null if none).
6. Unresolved Questions — What remains open or unanswered.
7. Recommendation — If the goal was decision-oriented, your assessment of the best path forward (null if not applicable).

Be thorough, balanced, and faithful to what was actually said.`;
}

export function buildHostSummaryUserPrompt(
  formattedTranscript: string,
  topic: string,
  goal: string,
): string {
  return `Topic: ${topic}
Goal: ${goal}

Full discussion transcript:

${formattedTranscript}

Generate the summary report now.`;
}
