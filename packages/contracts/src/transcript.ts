import type { UtteranceType } from './enums.js';

export interface Utterance {
  id: number;
  sessionId: string;
  speakerId: string;
  speakerName: string;
  type: UtteranceType;
  content: string;
  turnNumber: number | null;
  createdAt: string;
}
