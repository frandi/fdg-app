import type { Utterance } from '@fdg/contracts';
import { UtteranceType } from '@fdg/contracts';
import type { ParticipantAgent } from '../agents/participant-agent.js';
import type { TranscriptManager } from '../transcript/transcript-manager.js';
import type { EngineEventBus } from '../event-bus.js';

export class Speaker {
  constructor(private eventBus: EngineEventBus) {}

  async speak(
    agent: ParticipantAgent,
    transcriptManager: TranscriptManager,
    bidSummary: string,
    turnNumber: number,
  ): Promise<Utterance> {
    const transcript = transcriptManager.getWindow();
    let fullText = '';

    for await (const chunk of agent.speak(transcript, bidSummary)) {
      fullText += chunk;
      this.eventBus.emit('participant:speaking', {
        participantId: agent.definition.id,
        chunk,
      });
    }

    const utterance = transcriptManager.append(
      agent.definition.id,
      agent.definition.name,
      UtteranceType.ParticipantResponse,
      fullText,
      turnNumber,
    );

    this.eventBus.emit('participant:spoke', {
      participantId: agent.definition.id,
      utterance,
    });

    return utterance;
  }
}
