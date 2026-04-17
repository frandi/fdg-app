import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import type { SessionConfig, SessionSummary, ParticipantDefinition } from '@fdg/types';
import { SessionOrchestrator, EngineEventBus } from '@fdg/engine';
import type { Database } from '@fdg/db';
import { ConfigScreen } from './screens/ConfigScreen.js';
import { DiscussionScreen } from './screens/DiscussionScreen.js';
import { SummaryScreen } from './screens/SummaryScreen.js';
import { ReplayScreen } from './screens/ReplayScreen.js';
import { useTerminalDimensions } from './hooks/useTerminalDimensions.js';

type AppPhase = 'config' | 'discussion' | 'summary' | 'replay';

interface AppProps {
  db: Database;
  availableParticipants: ParticipantDefinition[];
}

export function App({ db, availableParticipants }: AppProps) {
  const { columns, rows } = useTerminalDimensions();

  const [phase, setPhase] = useState<AppPhase>('config');
  const [participants, setParticipants] = useState<ParticipantDefinition[]>(availableParticipants);
  const [orchestrator, setOrchestrator] = useState<SessionOrchestrator | null>(null);
  const [eventBus, setEventBus] = useState<EngineEventBus | null>(null);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const handleStart = useCallback(
    (sessionConfig: SessionConfig) => {
      const bus = new EngineEventBus();
      const orch = new SessionOrchestrator(sessionConfig, db, bus);

      setConfig(sessionConfig);
      setEventBus(bus);
      setOrchestrator(orch);
      setPhase('discussion');

      orch.run().catch((err: Error) => {
        console.error('Session failed:', err.message);
      });
    },
    [db],
  );

  const handleSessionCompleted = useCallback((sessionSummary: SessionSummary) => {
    setSummary(sessionSummary);
  }, []);

  const handleRequestSummary = useCallback(() => {
    setPhase('summary');
  }, []);

  const handleRequestReplay = useCallback(() => {
    setPhase('replay');
  }, []);

  const handleBackToDiscussion = useCallback(() => {
    setPhase('discussion');
  }, []);

  const renderPhase = () => {
    if (phase === 'config') {
      return (
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="cyan">
            {'=== FDG - Focus Discussion Group ==='}
          </Text>
          <ConfigScreen
            availableParticipants={participants}
            db={db}
            onParticipantsChanged={setParticipants}
            onStart={handleStart}
          />
        </Box>
      );
    }

    if (phase === 'discussion' && orchestrator && eventBus && config) {
      return (
        <DiscussionScreen
          orchestrator={orchestrator}
          eventBus={eventBus}
          participants={config.participants}
          turnLimit={config.turnLimit}
          db={db}
          sessionId={orchestrator.getSessionId()}
          concludedSummary={summary}
          onSessionCompleted={handleSessionCompleted}
          onRequestSummary={handleRequestSummary}
          onRequestReplay={handleRequestReplay}
        />
      );
    }

    if (phase === 'summary' && summary && config && orchestrator) {
      return (
        <SummaryScreen
          db={db}
          sessionId={orchestrator.getSessionId()}
          config={config}
          summary={summary}
          onBack={handleBackToDiscussion}
        />
      );
    }

    if (phase === 'replay' && config && orchestrator) {
      return (
        <ReplayScreen
          db={db}
          sessionId={orchestrator.getSessionId()}
          participants={config.participants}
          turnLimit={config.turnLimit}
          onExit={handleBackToDiscussion}
        />
      );
    }

    return <Text>Loading...</Text>;
  };

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      {renderPhase()}
    </Box>
  );
}
