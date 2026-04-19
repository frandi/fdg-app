import type { Utterance, UtteranceType } from '@fdg/contracts';
import type { Database } from '@fdg/db';
import { formatTranscript } from '@fdg/llm';
import { buildContextWindow } from './context-window.js';

const DEFAULT_MAX_TOKENS = 16000;

export class TranscriptManager {
  private utterances: Utterance[] = [];

  constructor(
    private db: Database,
    private sessionId: string,
  ) {}

  append(
    speakerId: string,
    speakerName: string,
    type: UtteranceType,
    content: string,
    turnNumber: number | null,
  ): Utterance {
    const utterance = this.db.utterances.insert(
      this.sessionId,
      speakerId,
      speakerName,
      type,
      content,
      turnNumber,
    );
    this.utterances.push(utterance);
    return utterance;
  }

  getAll(): Utterance[] {
    return this.utterances;
  }

  getWindow(maxTokens: number = DEFAULT_MAX_TOKENS): Utterance[] {
    return buildContextWindow(this.utterances, maxTokens);
  }

  formatForPrompt(utterances?: Utterance[]): string {
    return formatTranscript(utterances ?? this.utterances);
  }

  loadFromDb(): void {
    this.utterances = this.db.utterances.getBySession(this.sessionId);
  }
}
