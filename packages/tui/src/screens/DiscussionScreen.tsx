import React from 'react';
import { Box, Text } from 'ink';
import type { ParticipantDefinition, SessionSummary } from '@fdg/types';
import type { SessionOrchestrator, EngineEventBus } from '@fdg/engine';
import { useEngine } from '../hooks/useEngine.js';
import { TranscriptPanel } from '../components/TranscriptPanel.js';
import { ParticipantList } from '../components/ParticipantList.js';
import { StatusBar } from '../components/StatusBar.js';
import { WhisperInput } from '../components/WhisperInput.js';
import { SpeakerBanner } from '../components/SpeakerBanner.js';
import { TurnLimitPrompt } from '../components/TurnLimitPrompt.js';

interface DiscussionScreenProps {
  orchestrator: SessionOrchestrator;
  eventBus: EngineEventBus;
  participants: ParticipantDefinition[];
  turnLimit: number;
  onComplete: (summary: SessionSummary) => void;
}

export function DiscussionScreen({
  orchestrator,
  eventBus,
  participants,
  turnLimit,
  onComplete,
}: DiscussionScreenProps) {
  const engine = useEngine(eventBus, turnLimit);
  const participantNames = new Map(participants.map((p) => [p.id, p.name]));
  participantNames.set('host', 'Host');

  const isBidding =
    engine.bids.length > 0 &&
    engine.bids.length < participants.length &&
    !engine.selectedSpeaker;

  React.useEffect(() => {
    if (engine.summary) {
      onComplete(engine.summary);
    }
  }, [engine.summary, onComplete]);

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
          transcript={engine.transcript}
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
        <SpeakerBanner
          evaluation={engine.selectedSpeaker}
          participantNames={participantNames}
        />

        {engine.turnLimitReached && (
          <TurnLimitPrompt
            currentTurn={engine.currentTurn}
            turnLimit={engine.turnLimit}
            onRespond={(action, extraTurns) => {
              orchestrator.respondToTurnLimit(action, extraTurns);
            }}
          />
        )}

        <WhisperInput
          onSubmit={(message) => orchestrator.submitWhisper(message)}
          acknowledged={engine.whisperAcknowledged}
        />

        {engine.error && (
          <Box paddingX={1}>
            <Text color="red">Error: {engine.error}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
