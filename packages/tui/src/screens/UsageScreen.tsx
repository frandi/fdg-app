import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import type {
  LlmCallType,
  ParticipantDefinition,
  SessionUsage,
  UsageBucket,
} from '@fdg/types';
import type { Database } from '@fdg/db';
import { ScrollableBox } from '../components/ScrollableBox.js';

interface UsageScreenProps {
  db: Database;
  sessionId: string;
  participants: ParticipantDefinition[];
  onExit: () => void;
}

const CALL_TYPE_ORDER: LlmCallType[] = [
  'opening',
  'bid',
  'speak',
  'evaluate_bids',
  'checkpoint',
  'closing',
  'summary',
];

const CALL_TYPE_LABEL: Record<LlmCallType, string> = {
  opening: 'Opening',
  bid: 'Bid',
  speak: 'Speak',
  evaluate_bids: 'Evaluate Bids',
  checkpoint: 'Checkpoint',
  closing: 'Closing',
  summary: 'Summary',
};

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function resolveActorLabel(
  actor: string,
  nameByParticipantId: Map<string, string>,
): string {
  if (actor === 'host') return 'Host';
  if (actor === 'system') return 'System';
  if (actor.startsWith('participant:')) {
    const id = actor.slice('participant:'.length);
    return nameByParticipantId.get(id) ?? id;
  }
  return actor;
}

function Row({
  cols,
  widths,
  color,
  bold,
}: {
  cols: string[];
  widths: number[];
  color?: string;
  bold?: boolean;
}) {
  return (
    <Box>
      {cols.map((c, i) => (
        <Box key={i} width={widths[i]} flexShrink={0}>
          <Text color={color} bold={bold}>
            {c}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

export function UsageScreen({
  db,
  sessionId,
  participants,
  onExit,
}: UsageScreenProps) {
  useInput((_input, key) => {
    if (key.escape) {
      onExit();
    }
  });

  const usage: SessionUsage = useMemo(
    () => db.llmUsage.aggregateBySession(sessionId),
    [db, sessionId],
  );

  const nameByParticipantId = useMemo(
    () => new Map(participants.map((p) => [p.id, p.name])),
    [participants],
  );

  if (usage.totals.calls === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">
          No usage recorded for this session. Token tracking is only available
          for sessions run after this feature was added.
        </Text>
        <Text color="gray">[esc] Back</Text>
      </Box>
    );
  }

  const { totals, byActor, byCallType, byModel, largestCall } = usage;

  const colWidths = [24, 8, 14, 14, 14, 10];
  const header = ['', 'Calls', 'Input', 'Output', 'Total', 'Share'];

  const renderBucketRow = (label: string, bucket: UsageBucket) => (
    <Row
      key={label}
      cols={[
        label,
        formatNumber(bucket.calls),
        formatNumber(bucket.inputTokens),
        formatNumber(bucket.outputTokens),
        formatNumber(bucket.totalTokens),
        pct(bucket.totalTokens, totals.totalTokens),
      ]}
      widths={colWidths}
    />
  );

  const actorEntries = Object.entries(byActor).sort(
    ([, a], [, b]) => b.totalTokens - a.totalTokens,
  );

  const modelEntries = Object.entries(byModel).sort(
    ([, a], [, b]) => b.totalTokens - a.totalTokens,
  );

  return (
    <Box flexDirection="column" flexGrow={1}>
      <ScrollableBox>
        <Box flexDirection="column" padding={1}>
          <Text bold color="cyan">
            Session Usage
          </Text>
          <Text color="gray">
            Session {sessionId.slice(0, 8)}... — technical breakdown of LLM token
            consumption.
          </Text>

          <Box marginTop={1} flexDirection="column">
            <Text bold color="white">
              Overview
            </Text>
            <Text>
              <Text color="gray">Total calls:         </Text>
              {formatNumber(totals.calls)}
            </Text>
            <Text>
              <Text color="gray">Input tokens:        </Text>
              {formatNumber(totals.inputTokens)}
            </Text>
            <Text>
              <Text color="gray">Output tokens:       </Text>
              {formatNumber(totals.outputTokens)}
            </Text>
            <Text>
              <Text color="gray">Total tokens:        </Text>
              <Text bold>{formatNumber(totals.totalTokens)}</Text>
            </Text>
            {(usage.cacheReadTokens > 0 || usage.cacheCreationTokens > 0) && (
              <>
                <Text>
                  <Text color="gray">Cache read tokens:   </Text>
                  {formatNumber(usage.cacheReadTokens)}
                </Text>
                <Text>
                  <Text color="gray">Cache write tokens:  </Text>
                  {formatNumber(usage.cacheCreationTokens)}
                </Text>
              </>
            )}
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold color="white">
              By Actor
            </Text>
            <Row cols={header} widths={colWidths} color="gray" bold />
            {actorEntries.map(([actor, bucket]) =>
              renderBucketRow(
                resolveActorLabel(actor, nameByParticipantId),
                bucket,
              ),
            )}
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold color="white">
              By Call Type
            </Text>
            <Row cols={header} widths={colWidths} color="gray" bold />
            {CALL_TYPE_ORDER.filter((ct) => byCallType[ct].calls > 0).map((ct) =>
              renderBucketRow(CALL_TYPE_LABEL[ct], byCallType[ct]),
            )}
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold color="white">
              By Model
            </Text>
            <Row cols={header} widths={colWidths} color="gray" bold />
            {modelEntries.map(([model, bucket]) =>
              renderBucketRow(`${bucket.provider}:${model}`, bucket),
            )}
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text bold color="white">
              Highlights
            </Text>
            {largestCall && (
              <Text>
                <Text color="gray">Largest call:        </Text>
                {resolveActorLabel(largestCall.actor, nameByParticipantId)} /{' '}
                {CALL_TYPE_LABEL[largestCall.callType]} —{' '}
                {formatNumber(largestCall.totalTokens)} tokens (
                {largestCall.model})
              </Text>
            )}
            {usage.speakCount > 0 && (
              <Text>
                <Text color="gray">Avg tokens per turn: </Text>
                {formatNumber(usage.speakAvgTokens)} ({usage.speakCount} speaking
                turns)
              </Text>
            )}
          </Box>
        </Box>
      </ScrollableBox>

      <Box paddingX={1} marginTop={1} flexShrink={0}>
        <Text color="gray">
          [esc] Back  |  scroll: wheel / PgUp/PgDn / g,G
        </Text>
      </Box>
    </Box>
  );
}
