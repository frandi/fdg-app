import type { Utterance, Whisper } from '@fdg/contracts';
import { UtteranceType, CheckpointAction } from '@fdg/contracts';
import type { HostAgent, CheckpointResult, TurnInfo } from '../agents/host-agent.js';
import type { TranscriptManager } from '../transcript/transcript-manager.js';
import type { EngineEventBus } from '../event-bus.js';

export class Checkpoint {
  constructor(private eventBus: EngineEventBus) {}

  async run(
    hostAgent: HostAgent,
    transcriptManager: TranscriptManager,
    turnInfo: TurnInfo,
    whispers: Whisper[],
  ): Promise<CheckpointResult> {
    const transcript = transcriptManager.getWindow();
    const result = await hostAgent.checkpoint(transcript, turnInfo, whispers);

    this.eventBus.emit('host:checkpoint', {
      action: result.action,
      comment: result.comment,
    });

    if (result.action === CheckpointAction.Narrow && result.comment) {
      transcriptManager.append(
        'host',
        'Host',
        UtteranceType.HostNarrow,
        result.comment,
        turnInfo.turnNumber,
      );
    } else if (
      result.action === CheckpointAction.Continue &&
      result.comment
    ) {
      transcriptManager.append(
        'host',
        'Host',
        UtteranceType.HostFacilitation,
        result.comment,
        turnInfo.turnNumber,
      );
    }

    return result;
  }
}
