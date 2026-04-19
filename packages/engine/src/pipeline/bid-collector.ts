import type { Bid, Utterance } from '@fdg/contracts';
import type { ParticipantAgent } from '../agents/participant-agent.js';
import type { EngineEventBus } from '../event-bus.js';

export class BidCollector {
  constructor(private eventBus: EngineEventBus) {}

  async collectAll(
    participants: ParticipantAgent[],
    transcript: Utterance[],
    turnNumber: number,
  ): Promise<Bid[]> {
    this.eventBus.emit('bid:collecting', {});

    const results = await Promise.allSettled(
      participants.map((agent) => agent.generateBid(transcript, turnNumber)),
    );

    const bids: Bid[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        bids.push(result.value);
        this.eventBus.emit('bid:received', {
          participantId: participants[i].definition.id,
          bid: result.value,
        });
      } else {
        this.eventBus.emit('error', {
          message: `Bid failed for ${participants[i].definition.name}: ${result.reason}`,
          fatal: false,
        });
      }
    }

    this.eventBus.emit('bid:allReceived', { bids: { turnNumber, bids } });
    return bids;
  }
}
