import { useState, useEffect, useCallback } from 'react';
import type {
  SessionPhase,
  Utterance,
  Bid,
  BidEvaluation,
  SessionSummary,
  EngineEvents,
} from '@fdg/contracts';
import type { EngineEventStream } from '@fdg/sdk';

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

export function useEngine(events: EngineEventStream | null, turnLimit: number) {
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
    if (!events) return;

    const unsubscribers: Array<() => void> = [];
    const subscribe = <K extends keyof EngineEvents>(
      event: K,
      listener: (...args: EngineEvents[K] extends readonly unknown[] ? EngineEvents[K] : never) => void,
    ) => {
      unsubscribers.push(events.on(event, listener));
    };

    subscribe('phase:changed', ({ phase }) => {
      setState((prev) => ({ ...prev, phase }));
    });
    subscribe('host:speaking', ({ chunk }) => {
      setState((prev) => ({
        ...prev,
        streamingText: {
          speakerId: 'host',
          text: (prev.streamingText?.speakerId === 'host' ? prev.streamingText.text : '') + chunk,
        },
      }));
    });
    subscribe('host:spoke', ({ utterance }) => {
      setState((prev) => ({
        ...prev,
        transcript: [...prev.transcript, utterance],
        streamingText: null,
      }));
    });
    subscribe('participant:opening', ({ participantId, chunk }) => {
      setState((prev) => ({
        ...prev,
        streamingText: {
          speakerId: participantId,
          text: (prev.streamingText?.speakerId === participantId ? prev.streamingText.text : '') + chunk,
        },
      }));
    });
    subscribe('participant:opened', ({ utterance }) => {
      setState((prev) => ({
        ...prev,
        transcript: [...prev.transcript, utterance],
        streamingText: null,
      }));
    });
    subscribe('bid:collecting', () => {
      setState((prev) => ({ ...prev, bids: [], selectedSpeaker: null }));
    });
    subscribe('bid:received', ({ bid }) => {
      setState((prev) => ({ ...prev, bids: [...prev.bids, bid] }));
    });
    subscribe('host:selected', (evaluation) => {
      setState((prev) => ({ ...prev, selectedSpeaker: evaluation }));
    });
    subscribe('participant:speaking', ({ participantId, chunk }) => {
      setState((prev) => ({
        ...prev,
        streamingText: {
          speakerId: participantId,
          text: (prev.streamingText?.speakerId === participantId ? prev.streamingText.text : '') + chunk,
        },
      }));
    });
    subscribe('participant:spoke', ({ utterance }) => {
      setState((prev) => ({
        ...prev,
        transcript: [...prev.transcript, utterance],
        streamingText: null,
        currentTurn: prev.currentTurn + 1,
      }));
    });
    subscribe('turnLimit:reached', ({ currentTurn, limit }) => {
      setState((prev) => ({
        ...prev,
        turnLimitReached: true,
        currentTurn,
        turnLimit: limit,
      }));
    });
    subscribe('whisper:acknowledged', () => {
      setState((prev) => ({ ...prev, whisperAcknowledged: true }));
    });
    subscribe('session:completed', ({ summary }) => {
      setState((prev) => ({ ...prev, summary }));
    });
    subscribe('error', ({ message }) => {
      setState((prev) => ({ ...prev, error: message }));
    });

    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [events]);

  return { ...state, resetWhisperAck };
}
