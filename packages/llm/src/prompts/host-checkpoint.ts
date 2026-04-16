import type { HostDefinition, Whisper } from '@fdg/types';

export function buildHostCheckpointSystemPrompt(host: HostDefinition): string {
  return `You are the host and facilitator of a focus group discussion.

Your persona:
${host.persona}

Your task: Assess the current state of the discussion and decide what to do next.

You must choose one action:
- "continue": The discussion is progressing well. Proceed to the next bid round.
- "narrow": The discussion needs steering. Issue a brief comment that narrows the focus toward the goal, then continue.
- "conclude": The goal has been sufficiently addressed or it's time to wrap up. Move to the closing phase.

If you choose "narrow", provide a facilitation comment in the "comment" field (e.g., "Let's bring this back to..." or "We've covered X well, now let's focus on...").
If you choose "continue", you may optionally include a brief facilitation comment.`;
}

export function buildHostCheckpointUserPrompt(
  formattedTranscript: string,
  turnNumber: number,
  turnLimit: number,
  whispers: Whisper[],
): string {
  let prompt = `Discussion transcript:

${formattedTranscript}

Current turn: ${turnNumber}/${turnLimit}
Remaining turns: ${turnLimit - turnNumber}`;

  if (whispers.length > 0) {
    const whisperText = whispers
      .map((w) => `- "${w.message}"`)
      .join('\n');
    prompt += `\n\nPrivate instructions from the user:
${whisperText}`;
  }

  prompt += '\n\nAssess the discussion and decide: continue, narrow, or conclude.';
  return prompt;
}
