import React from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  ParticipantDefinition,
  SessionSummary,
  Utterance,
} from '@fdg/types';
import type { SessionOrchestrator, EngineEventBus } from '@fdg/engine';
import type { Database } from '@fdg/db';
import { useEngine } from '../hooks/useEngine.js';
import { TranscriptPanel } from '../components/TranscriptPanel.js';
import { ParticipantList } from '../components/ParticipantList.js';
import { StatusBar } from '../components/StatusBar.js';
import { WhisperInput } from '../components/WhisperInput.js';
import { SpeakerBanner } from '../components/SpeakerBanner.js';
import { TurnLimitPrompt } from '../components/TurnLimitPrompt.js';
import { ConcludedBanner } from '../components/ConcludedBanner.js';

interface DiscussionScreenProps {
  orchestrator: SessionOrchestrator;
  eventBus: EngineEventBus;
  participants: ParticipantDefinition[];
  turnLimit: number;
  db: Database;
  sessionId: string;
  concludedSummary: SessionSummary | null;
  onSessionCompleted: (summary: SessionSummary) => void;
  onRequestSummary: () => void;
  onRequestReplay: () => void;
}

export function DiscussionScreen({
  orchestrator,
  eventBus,
  participants,
  turnLimit,
  db,
  sessionId,
  concludedSummary,
  onSessionCompleted,
  onRequestSummary,
  onRequestReplay,
}: DiscussionScreenProps) {
  const engine = useEngine(eventBus, turnLimit);
  const participantNames = new Map(participants.map((p) => [p.id, p.name]));
  participantNames.set('host', 'Host');

  const [hydrated, setHydrated] = React.useState<Utterance[] | null>(null);
  React.useEffect(() => {
    if (concludedSummary && engine.transcript.length === 0 && hydrated === null) {
      try {
        setHydrated(db.utterances.getBySession(sessionId));
      } catch {
        setHydrated([]);
      }
    }
  }, [concludedSummary, engine.transcript.length, hydrated, db, sessionId]);

  const concluded = engine.summary !== null || concludedSummary !== null;
  const displayedTranscript =
    engine.transcript.length > 0 ? engine.transcript : hydrated ?? [];
  const isBidding =
    engine.bids.length > 0 &&
    engine.bids.length < participants.length &&
    !engine.selectedSpeaker;

  React.useEffect(() => {
    if (engine.summary) {
      onSessionCompleted(engine.summary);
    }
  }, [engine.summary, onSessionCompleted]);

  useInput(
    (input) => {
      if (!concluded) return;
      if (input === 's') onRequestSummary();
      else if (input === 'r') onRequestReplay();
    },
    { isActive: concluded },
  );

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Sticky header */}
      <Box flexShrink={0}>
        <StatusBar
          phase={engine.phase}
          currentTurn={engine.currentTurn}
          turnLimit={engine.turnLimit}
          isBidding={isBidding}
        />
      </Box>

      {/* Scrollable main + sticky right panel */}
      <Box flexGrow={1} flexShrink={1} flexDirection="row" overflow="hidden">
        <TranscriptPanel
          transcript={displayedTranscript}
          streamingText={engine.streamingText}
          participantNames={participantNames}
        />
        <Box flexShrink={0}>
          <ParticipantList
            participants={participants}
            bids={engine.bids}
            speakingId={engine.streamingText?.speakerId ?? null}
            selectedId={engine.selectedSpeaker?.selectedParticipantId ?? null}
          />
        </Box>
      </Box>

      {/* Sticky footer */}
      <Box flexDirection="column" flexShrink={0}>
        {!concluded && (
          <SpeakerBanner
            evaluation={engine.selectedSpeaker}
            participantNames={participantNames}
          />
        )}

        {!concluded && engine.turnLimitReached && (
          <TurnLimitPrompt
            currentTurn={engine.currentTurn}
            turnLimit={engine.turnLimit}
            onRespond={(action, extraTurns) => {
              orchestrator.respondToTurnLimit(action, extraTurns);
            }}
          />
        )}

        {concluded ? (
          <ConcludedBanner />
        ) : (
          <WhisperInput
            onSubmit={(message) => orchestrator.submitWhisper(message)}
            acknowledged={engine.whisperAcknowledged}
          />
        )}

        {engine.error && (
          <Box paddingX={1}>
            <Text color="red">Error: {engine.error}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
