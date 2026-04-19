import type { Whisper } from '@fdg/contracts';
import type { Database } from '../db/index.js';

export class WhisperQueue {
  constructor(
    private db: Database,
    private sessionId: string,
  ) {}

  enqueue(message: string, turnNumber: number): Whisper {
    return this.db.whispers.insert(this.sessionId, message, turnNumber);
  }

  drain(): Whisper[] {
    const whispers = this.db.whispers.getUnprocessed(this.sessionId);
    if (whispers.length > 0) {
      this.db.whispers.markProcessed(whispers.map((w) => w.id));
    }
    return whispers;
  }

  hasPending(): boolean {
    return this.db.whispers.getUnprocessed(this.sessionId).length > 0;
  }
}
