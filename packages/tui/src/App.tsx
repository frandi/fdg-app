import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import type { SessionConfig, SessionSummary, ParticipantDefinition } from '@fdg/types';
import { SessionOrchestrator, EngineEventBus } from '@fdg/engine';
import type { Database } from '@fdg/db';
import { ConfigScreen } from './screens/ConfigScreen.js';
import { DiscussionScreen } from './screens/DiscussionScreen.js';
import { SummaryView } from './components/SummaryView.js';

type AppPhase = 'config' | 'discussion' | 'summary';

interface AppProps {
  db: Database;
  availableParticipants: ParticipantDefinition[];
}

export function App({ db, availableParticipants }: AppProps) {
  const [phase, setPhase] = useState<AppPhase>('config');
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

  const handleComplete = useCallback((sessionSummary: SessionSummary) => {
    setSummary(sessionSummary);
    setPhase('summary');
  }, []);

  if (phase === 'config') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          {'=== FDG - Focus Discussion Group ==='}
        </Text>
        <ConfigScreen
          availableParticipants={availableParticipants}
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
        onComplete={handleComplete}
      />
    );
  }

  if (phase === 'summary' && summary) {
    return (
      <Box flexDirection="column">
        <SummaryView summary={summary} />
        <Box paddingX={1} marginTop={1}>
          <Text color="gray">Session complete. Press Ctrl+C to exit.</Text>
        </Box>
      </Box>
    );
  }

  return <Text>Loading...</Text>;
}
