import React from 'react';
import { Box } from 'ink';
import type { ParticipantDefinition, SessionSummary } from '@fdg/types';
import type { SessionOrchestrator, EngineEventBus } from '@fdg/engine';
import { useEngine } from '../hooks/useEngine.js';
import { TranscriptPanel } from '../components/TranscriptPanel.js';
import { ParticipantList } from '../components/ParticipantList.js';
import { StatusBar } from '../components/StatusBar.js';
import { WhisperInput } from '../components/WhisperInput.js';
import { SpeakerBanner } from '../components/SpeakerBanner.js';
import { TurnLimitPrompt } from '../components/TurnLimitPrompt.js';
import { SummaryView } from '../components/SummaryView.js';

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

  const isBidding = engine.bids.length > 0 && engine.bids.length < participants.length && !engine.selectedSpeaker;

  React.useEffect(() => {
    if (engine.summary) {
      onComplete(engine.summary);
    }
  }, [engine.summary, onComplete]);

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar
        phase={engine.phase}
        currentTurn={engine.currentTurn}
        turnLimit={engine.turnLimit}
        isBidding={isBidding}
      />

      <Box flexGrow={1}>
        <TranscriptPanel
          transcript={engine.transcript}
          streamingText={engine.streamingText}
          participantNames={participantNames}
        />
        <ParticipantList
          participants={participants}
          bids={engine.bids}
          speakingId={engine.streamingText?.speakerId ?? null}
          selectedId={engine.selectedSpeaker?.selectedParticipantId ?? null}
        />
      </Box>

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
          <Box>
            {React.createElement('ink-text', { color: 'red' }, `Error: ${engine.error}`)}
          </Box>
        </Box>
      )}
    </Box>
  );
}
