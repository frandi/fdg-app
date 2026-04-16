import type { SessionPhase, CheckpointAction } from './enums.js';
import type { Utterance } from './transcript.js';
import type { Bid, BidCollection, BidEvaluation } from './bid.js';
import type { Whisper } from './whisper.js';
import type { SessionSummary } from './session.js';

export interface EngineEvents {
  'phase:changed': [payload: { phase: SessionPhase }];
  'host:speaking': [payload: { chunk: string }];
  'host:spoke': [payload: { utterance: Utterance }];
  'participant:opening': [payload: { participantId: string; chunk: string }];
  'participant:opened': [payload: { participantId: string; utterance: Utterance }];
  'bid:collecting': [payload: Record<string, never>];
  'bid:received': [payload: { participantId: string; bid: Bid }];
  'bid:allReceived': [payload: { bids: BidCollection }];
  'host:evaluating': [payload: Record<string, never>];
  'host:selected': [payload: BidEvaluation];
  'participant:speaking': [payload: { participantId: string; chunk: string }];
  'participant:spoke': [payload: { participantId: string; utterance: Utterance }];
  'host:checkpoint': [payload: { action: CheckpointAction; comment?: string }];
  'whisper:received': [payload: { whisper: Whisper }];
  'whisper:acknowledged': [payload: Record<string, never>];
  'turnLimit:reached': [payload: { currentTurn: number; limit: number }];
  'session:completed': [payload: { summary: SessionSummary }];
  'error': [payload: { message: string; fatal: boolean }];
}
