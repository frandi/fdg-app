import type { Utterance } from '@fdg/types';
import { UtteranceType } from '@fdg/types';

const OPENING_TYPES = new Set<string>([
  UtteranceType.HostOpening,
  UtteranceType.ParticipantOpening,
]);

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function buildContextWindow(
  allUtterances: Utterance[],
  maxTokens: number,
): Utterance[] {
  if (allUtterances.length === 0) return [];

  const openings = allUtterances.filter((u) => OPENING_TYPES.has(u.type));
  const nonOpenings = allUtterances.filter((u) => !OPENING_TYPES.has(u.type));

  const openingTokens = openings.reduce(
    (sum, u) => sum + estimateTokens(u.content),
    0,
  );

  const remainingBudget = maxTokens - openingTokens;
  if (remainingBudget <= 0) return openings;

  // Take from the end (most recent) until budget is exhausted
  const recentUtterances: Utterance[] = [];
  let usedTokens = 0;

  for (let i = nonOpenings.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(nonOpenings[i].content);
    if (usedTokens + tokens > remainingBudget) break;
    recentUtterances.unshift(nonOpenings[i]);
    usedTokens += tokens;
  }

  return [...openings, ...recentUtterances];
}
