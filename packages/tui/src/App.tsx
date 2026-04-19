import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import type {
  SessionConfig,
  SessionSummary,
  ParticipantDefinition,
} from '@fdg/contracts';
import { SessionOrchestrator, EngineEventBus } from '@fdg/engine';
import type { Database, SessionRow } from '@fdg/db';
import { ConfigScreen } from './screens/ConfigScreen.js';
import { DiscussionScreen } from './screens/DiscussionScreen.js';
import { SummaryScreen } from './screens/SummaryScreen.js';
import { ReplayScreen } from './screens/ReplayScreen.js';
import { UsageScreen } from './screens/UsageScreen.js';
import { SessionBrowserScreen } from './screens/SessionBrowserScreen.js';
import { useTerminalDimensions } from './hooks/useTerminalDimensions.js';

type AppPhase =
  | 'sessionBrowser'
  | 'config'
  | 'discussion'
  | 'resumed'
  | 'summary'
  | 'replay'
  | 'usage';

interface AppProps {
  db: Database;
  availableParticipants: ParticipantDefinition[];
  initialCompletedSessions?: SessionRow[];
}

function reconstructConfig(
  row: SessionRow,
  participants: ParticipantDefinition[],
): SessionConfig {
  return {
    topic: row.topic,
    goal: row.goal,
    turnLimit: row.turnLimit,
    host: {
      persona: row.hostPersona,
      llmProvider: row.hostLlmProvider as ParticipantDefinition['llmProvider'],
      llmModel: row.hostLlmModel,
    },
    participants,
  };
}

export function App({
  db,
  availableParticipants,
  initialCompletedSessions = [],
}: AppProps) {
  const { columns, rows } = useTerminalDimensions();

  const [phase, setPhase] = useState<AppPhase>(
    initialCompletedSessions.length > 0 ? 'sessionBrowser' : 'config',
  );
  const [completedSessions] = useState<SessionRow[]>(initialCompletedSessions);
  const [participants, setParticipants] = useState<ParticipantDefinition[]>(availableParticipants);
  const [orchestrator, setOrchestrator] = useState<SessionOrchestrator | null>(null);
  const [eventBus, setEventBus] = useState<EngineEventBus | null>(null);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const [resumedSessionId, setResumedSessionId] = useState<string | null>(null);
  const [resumedConfig, setResumedConfig] = useState<SessionConfig | null>(null);
  const [resumedSummary, setResumedSummary] = useState<SessionSummary | null>(null);

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

  const handleRequestUsage = useCallback(() => {
    setPhase('usage');
  }, []);

  const handleBackFromOverlay = useCallback(() => {
    setPhase(resumedSessionId ? 'resumed' : 'discussion');
  }, [resumedSessionId]);

  const handleResumeSession = useCallback(
    (sessionId: string) => {
      const row = db.sessions.getById(sessionId);
      if (!row) return;
      const sessionParticipants = db.sessions.getParticipants(sessionId);
      const reconstructed = reconstructConfig(row, sessionParticipants);

      const summaryJson = db.summaryReports.getBySession(sessionId);
      const parsedSummary = summaryJson
        ? (JSON.parse(summaryJson) as SessionSummary)
        : null;

      setResumedSessionId(sessionId);
      setResumedConfig(reconstructed);
      setResumedSummary(parsedSummary);
      setPhase('resumed');
    },
    [db],
  );

  const handleStartNewFromBrowser = useCallback(() => {
    setPhase('config');
  }, []);

  const handleExitResumed = useCallback(() => {
    setResumedSessionId(null);
    setResumedConfig(null);
    setResumedSummary(null);
    setPhase('sessionBrowser');
  }, []);

  const activeSessionId = orchestrator?.getSessionId() ?? resumedSessionId;
  const activeConfig = config ?? resumedConfig;
  const activeSummary = summary ?? resumedSummary;

  const renderPhase = () => {
    if (phase === 'sessionBrowser') {
      return (
        <SessionBrowserScreen
          sessions={completedSessions}
          onResume={handleResumeSession}
          onStartNew={handleStartNewFromBrowser}
        />
      );
    }

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
          onRequestUsage={handleRequestUsage}
        />
      );
    }

    if (phase === 'resumed' && resumedSessionId && resumedConfig && resumedSummary) {
      return (
        <DiscussionScreen
          orchestrator={null}
          eventBus={null}
          participants={resumedConfig.participants}
          turnLimit={resumedConfig.turnLimit}
          db={db}
          sessionId={resumedSessionId}
          concludedSummary={resumedSummary}
          readOnly
          onRequestSummary={handleRequestSummary}
          onRequestReplay={handleRequestReplay}
          onRequestUsage={handleRequestUsage}
          onExit={handleExitResumed}
        />
      );
    }

    if (phase === 'summary' && activeSessionId && activeConfig && activeSummary) {
      return (
        <SummaryScreen
          db={db}
          sessionId={activeSessionId}
          config={activeConfig}
          summary={activeSummary}
          onBack={handleBackFromOverlay}
        />
      );
    }

    if (phase === 'replay' && activeSessionId && activeConfig) {
      return (
        <ReplayScreen
          db={db}
          sessionId={activeSessionId}
          participants={activeConfig.participants}
          turnLimit={activeConfig.turnLimit}
          onExit={handleBackFromOverlay}
        />
      );
    }

    if (phase === 'usage' && activeSessionId && activeConfig) {
      return (
        <UsageScreen
          db={db}
          sessionId={activeSessionId}
          participants={activeConfig.participants}
          onExit={handleBackFromOverlay}
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
