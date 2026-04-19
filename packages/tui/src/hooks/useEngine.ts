import { useState, useEffect, useCallback } from 'react';
import type { SessionPhase, Utterance, Bid, BidEvaluation, SessionSummary } from '@fdg/contracts';
import type { EngineEventBus } from '@fdg/engine';

export interface EngineState {
  phase: SessionPhase | null;
  transcript: Utterance[];
  streamingText: { speakerId: string; text: string } | null;
  bids: Bid[];
  currentTurn: number;
  turnLimit: number;
  selectedSpeaker: BidEvaluation | null;
  turnLimitReached: boolean;
  whisperAcknowledged: boolean;
  summary: SessionSummary | null;
  error: string | null;
}

export function useEngine(eventBus: EngineEventBus | null, turnLimit: number) {
  const [state, setState] = useState<EngineState>({
    phase: null,
    transcript: [],
    streamingText: null,
    bids: [],
    currentTurn: 0,
    turnLimit,
    selectedSpeaker: null,
    turnLimitReached: false,
    whisperAcknowledged: false,
    summary: null,
    error: null,
  });

  const resetWhisperAck = useCallback(() => {
    setState((prev) => ({ ...prev, whisperAcknowledged: false }));
  }, []);

  useEffect(() => {
    if (!eventBus) return;

    const handlers = {
      'phase:changed': ({ phase }: { phase: SessionPhase }) => {
        setState((prev) => ({ ...prev, phase }));
      },
      'host:speaking': ({ chunk }: { chunk: string }) => {
        setState((prev) => ({
          ...prev,
          streamingText: {
            speakerId: 'host',
            text: (prev.streamingText?.speakerId === 'host' ? prev.streamingText.text : '') + chunk,
          },
        }));
      },
      'host:spoke': ({ utterance }: { utterance: Utterance }) => {
        setState((prev) => ({
          ...prev,
          transcript: [...prev.transcript, utterance],
          streamingText: null,
        }));
      },
      'participant:opening': ({ participantId, chunk }: { participantId: string; chunk: string }) => {
        setState((prev) => ({
          ...prev,
          streamingText: {
            speakerId: participantId,
            text: (prev.streamingText?.speakerId === participantId ? prev.streamingText.text : '') + chunk,
          },
        }));
      },
      'participant:opened': ({ utterance }: { participantId: string; utterance: Utterance }) => {
        setState((prev) => ({
          ...prev,
          transcript: [...prev.transcript, utterance],
          streamingText: null,
        }));
      },
      'bid:collecting': () => {
        setState((prev) => ({ ...prev, bids: [], selectedSpeaker: null }));
      },
      'bid:received': ({ bid }: { participantId: string; bid: Bid }) => {
        setState((prev) => ({ ...prev, bids: [...prev.bids, bid] }));
      },
      'host:selected': (evaluation: BidEvaluation) => {
        setState((prev) => ({ ...prev, selectedSpeaker: evaluation }));
      },
      'participant:speaking': ({ participantId, chunk }: { participantId: string; chunk: string }) => {
        setState((prev) => ({
          ...prev,
          streamingText: {
            speakerId: participantId,
            text: (prev.streamingText?.speakerId === participantId ? prev.streamingText.text : '') + chunk,
          },
        }));
      },
      'participant:spoke': ({ utterance }: { participantId: string; utterance: Utterance }) => {
        setState((prev) => ({
          ...prev,
          transcript: [...prev.transcript, utterance],
          streamingText: null,
          currentTurn: prev.currentTurn + 1,
        }));
      },
      'turnLimit:reached': ({ currentTurn, limit }: { currentTurn: number; limit: number }) => {
        setState((prev) => ({
          ...prev,
          turnLimitReached: true,
          currentTurn,
          turnLimit: limit,
        }));
      },
      'whisper:acknowledged': () => {
        setState((prev) => ({ ...prev, whisperAcknowledged: true }));
      },
      'session:completed': ({ summary }: { summary: SessionSummary }) => {
        setState((prev) => ({ ...prev, summary }));
      },
      'error': ({ message }: { message: string; fatal: boolean }) => {
        setState((prev) => ({ ...prev, error: message }));
      },
    } as const;

    for (const [event, handler] of Object.entries(handlers)) {
      eventBus.on(event as keyof typeof handlers, handler as (...args: unknown[]) => void);
    }

    return () => {
      eventBus.removeAllListeners();
    };
  }, [eventBus]);

  return { ...state, resetWhisperAck };
}
