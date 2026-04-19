import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import type {
  SessionConfig,
  SessionSummary,
  ParticipantDefinition,
} from '@fdg/contracts';
import type { FdgClient, SessionHandle, SessionRow } from '@fdg/sdk';
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
  client: FdgClient;
  availableParticipants: ParticipantDefinition[];
  initialCompletedSessions?: SessionRow[];
}

export function App({
  client,
  availableParticipants,
  initialCompletedSessions = [],
}: AppProps) {
  const { columns, rows } = useTerminalDimensions();

  const [phase, setPhase] = useState<AppPhase>(
    initialCompletedSessions.length > 0 ? 'sessionBrowser' : 'config',
  );
  const [completedSessions] = useState<SessionRow[]>(initialCompletedSessions);
  const [participants, setParticipants] = useState<ParticipantDefinition[]>(availableParticipants);
  const [sessionHandle, setSessionHandle] = useState<SessionHandle | null>(null);
  const [config, setConfig] = useState<SessionConfig | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  const [resumedSessionId, setResumedSessionId] = useState<string | null>(null);
  const [resumedConfig, setResumedConfig] = useState<SessionConfig | null>(null);
  const [resumedSummary, setResumedSummary] = useState<SessionSummary | null>(null);

  const handleStart = useCallback(
    (sessionConfig: SessionConfig) => {
      const handle = client.startSession(sessionConfig);

      setConfig(sessionConfig);
      setSessionHandle(handle);
      setPhase('discussion');

      handle.wait().catch((err: Error) => {
        console.error('Session failed:', err.message);
      });
    },
    [client],
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
      const resumed = client.resumeSession(sessionId);
      if (!resumed) return;

      setResumedSessionId(resumed.sessionId);
      setResumedConfig(resumed.config);
      setResumedSummary(resumed.summary);
      setPhase('resumed');
    },
    [client],
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

  const activeSessionId = sessionHandle?.sessionId ?? resumedSessionId;
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
            pool={client.participants}
            onParticipantsChanged={setParticipants}
            onStart={handleStart}
          />
        </Box>
      );
    }

    if (phase === 'discussion' && sessionHandle && config) {
      return (
        <DiscussionScreen
          events={sessionHandle.events}
          submitWhisper={sessionHandle.submitWhisper}
          respondToTurnLimit={sessionHandle.respondToTurnLimit}
          participants={config.participants}
          turnLimit={config.turnLimit}
          client={client}
          sessionId={sessionHandle.sessionId}
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
          events={null}
          participants={resumedConfig.participants}
          turnLimit={resumedConfig.turnLimit}
          client={client}
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
          client={client}
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
          client={client}
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
          client={client}
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
