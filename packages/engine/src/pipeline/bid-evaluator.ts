import type { Bid, BidEvaluation, Utterance, Whisper } from '@fdg/contracts';
import type { HostAgent, TurnInfo } from '../agents/host-agent.js';
import type { EngineEventBus } from '../event-bus.js';

export class BidEvaluator {
  constructor(private eventBus: EngineEventBus) {}

  async evaluate(
    hostAgent: HostAgent,
    bids: Bid[],
    transcript: Utterance[],
    whispers: Whisper[],
    turnInfo: TurnInfo,
  ): Promise<BidEvaluation> {
    this.eventBus.emit('host:evaluating', {});

    const evaluation = await hostAgent.evaluateBids(
      bids,
      transcript,
      whispers,
      turnInfo,
    );

    this.eventBus.emit('host:selected', evaluation);
    return evaluation;
  }
}
