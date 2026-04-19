import React from 'react';
import { Box, Text } from 'ink';
import type { SessionSummary } from '@fdg/contracts';

interface SummaryViewProps {
  summary: SessionSummary;
}

export function SummaryView({ summary }: SummaryViewProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="yellow" underline>
        Discussion Summary
      </Text>
      <Box marginTop={1}>
        <Text bold>Topic & Goal: </Text>
        <Text wrap="wrap">{summary.topicAndGoal}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Key Positions:</Text>
        {summary.keyPositions.map((kp, i) => (
          <Text key={i} wrap="wrap">
            {'  '}- <Text bold>{kp.participantName}:</Text> {kp.position}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Points of Agreement:</Text>
        {summary.pointsOfAgreement.map((p, i) => (
          <Text key={i} wrap="wrap">
            {'  '}- {p}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Points of Contention:</Text>
        {summary.pointsOfContention.map((p, i) => (
          <Text key={i} wrap="wrap">
            {'  '}- {p}
          </Text>
        ))}
      </Box>

      {summary.emergingConsensus && (
        <Box marginTop={1}>
          <Text bold>Emerging Consensus: </Text>
          <Text wrap="wrap">{summary.emergingConsensus}</Text>
        </Box>
      )}

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Unresolved Questions:</Text>
        {summary.unresolvedQuestions.map((q, i) => (
          <Text key={i} wrap="wrap">
            {'  '}- {q}
          </Text>
        ))}
      </Box>

      {summary.recommendation && (
        <Box marginTop={1}>
          <Text bold>Recommendation: </Text>
          <Text wrap="wrap">{summary.recommendation}</Text>
        </Box>
      )}
    </Box>
  );
}
