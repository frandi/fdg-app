export interface Whisper {
  id: number;
  sessionId: string;
  message: string;
  turnNumber: number;
  processed: boolean;
  createdAt: string;
}
