import type { Utterance, Bid } from '@fdg/types';

export function formatTranscript(utterances: Utterance[]): string {
  return utterances
    .map((u) => `[${u.speakerName}] (${u.type}): ${u.content}`)
    .join('\n\n');
}

export function formatBids(bids: Bid[], participantNames: Map<string, string>): string {
  return bids
    .map((b) => {
      const name = participantNames.get(b.participantId) ?? b.participantId;
      return `- ${name} (${b.bidType}): ${b.summary}`;
    })
    .join('\n');
}
