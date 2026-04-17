import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { ParticipantDefinition } from '@fdg/types';
import { EngineEventBus, SessionReplayer } from '@fdg/engine';
import type { Database } from '@fdg/db';
import { useEngine } from '../hooks/useEngine.js';
import { TranscriptPanel } from '../components/TranscriptPanel.js';
import { ParticipantList } from '../components/ParticipantList.js';
import { StatusBar } from '../components/StatusBar.js';
import { SpeakerBanner } from '../components/SpeakerBanner.js';

interface ReplayScreenProps {
  db: Database;
  sessionId: string;
  participants: ParticipantDefinition[];
  turnLimit: number;
  onExit: () => void;
}

export function ReplayScreen({
  db,
  sessionId,
  participants,
  turnLimit,
  onExit,
}: ReplayScreenProps) {
  const eventBus = useMemo(() => new EngineEventBus(), []);
  const engine = useEngine(eventBus, turnLimit);
  const [finished, setFinished] = useState(false);
  const [noData, setNoData] = useState(false);

  const participantNames = new Map(participants.map((p) => [p.id, p.name]));
  participantNames.set('host', 'Host');

  useEffect(() => {
    const hasEvents = db.sessionEvents.getBySession(sessionId).length > 0;
    if (!hasEvents) {
      setNoData(true);
      return;
    }

    const replayer = new SessionReplayer(sessionId, db, eventBus, {
      onFinished: () => setFinished(true),
    });
    replayer.start();

    return () => {
      replayer.stop();
    };
  }, [db, sessionId, eventBus]);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onExit();
    }
  });

  const isBidding =
    engine.bids.length > 0 &&
    engine.bids.length < participants.length &&
    !engine.selectedSpeaker;

  if (noData) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">
          No replay data available for this session. Replay is only supported
          for sessions recorded after this feature was added.
        </Text>
        <Text color="gray">[esc] Back</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexShrink={0}>
        <StatusBar
          phase={engine.phase}
          currentTurn={engine.currentTurn}
          turnLimit={engine.turnLimit}
          isBidding={isBidding}
          replay
        />
      </Box>

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

      <Box flexDirection="column" flexShrink={0}>
        <SpeakerBanner
          evaluation={engine.selectedSpeaker}
          participantNames={participantNames}
        />
        <Box borderStyle="round" borderColor="magenta" paddingX={1}>
          {finished ? (
            <>
              <Text bold color="green">
                {'\u2713 Replay finished'}
              </Text>
              <Text color="gray">{'  \u2014  '}</Text>
              <Text color="white">[esc]</Text>
              <Text color="gray"> Back to session</Text>
            </>
          ) : (
            <>
              <Text color="gray">Replaying session... </Text>
              <Text color="white">[esc/q]</Text>
              <Text color="gray"> to exit replay</Text>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
