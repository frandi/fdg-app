import type { BidType } from './enums.js';

export interface Bid {
  participantId: string;
  bidType: BidType;
  summary: string;
  turnNumber: number;
}

export interface BidEvaluation {
  selectedParticipantId: string;
  reasoning: string;
}

export interface BidCollection {
  turnNumber: number;
  bids: Bid[];
}
