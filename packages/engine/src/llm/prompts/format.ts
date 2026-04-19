import type { Utterance, Bid } from '@fdg/contracts';

export function formatTranscript(utterances: Utterance[]): string {
  return utterances
    .map((u) => `[${u.speakerName}] (${u.type}): ${u.content}`)
    .join('\n\n');
}

export function formatBids(bids: Bid[], participantNames: Map<string, string>): string {
  return bids
    .map((b) => {
      const name = participantNames.get(b.participantId) ?? b.participantId;
      return `- [id="${b.participantId}"] ${name} (${b.bidType}): ${b.summary}`;
    })
    .join('\n');
}
