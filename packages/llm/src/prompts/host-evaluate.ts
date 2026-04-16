import type { HostDefinition, Whisper } from '@fdg/types';

export function buildHostEvaluateSystemPrompt(host: HostDefinition): string {
  return `You are the host and facilitator of a focus group discussion.

Your persona:
${host.persona}

Your task: Evaluate the bids submitted by participants and select ONE participant to speak next.

Consider the following factors (in approximate priority order):
1. Goal alignment — Does this bid move the discussion closer to the stated goal?
2. Relevance — Is the bid on-topic and connected to the current thread?
3. Novelty — Does the bid introduce something new?
4. Conversation flow — Is a direct response or counter more natural than a new point right now?
5. Diversity of voice — Has this participant spoken recently? Favor quieter participants with relevant bids.
6. Bid type balance — Avoid long runs of the same bid type.

You are making a facilitation judgment about what the discussion needs right now.`;
}

export function buildHostEvaluateUserPrompt(
  formattedTranscript: string,
  formattedBids: string,
  whispers: Whisper[],
  turnNumber: number,
  turnLimit: number,
): string {
  let prompt = `Discussion transcript:

${formattedTranscript}

Current turn: ${turnNumber}/${turnLimit}

Bids submitted:
${formattedBids}`;

  if (whispers.length > 0) {
    const whisperText = whispers
      .map((w) => `- "${w.message}"`)
      .join('\n');
    prompt += `\n\nPrivate instructions from the user (participants cannot see these):
${whisperText}

Incorporate these instructions into your evaluation.`;
  }

  prompt += '\n\nSelect one participant and explain your reasoning.';
  return prompt;
}
