import React from 'react';
import { Box, Text } from 'ink';
import type { SessionPhase } from '@fdg/contracts';

interface StatusBarProps {
  phase: SessionPhase | null;
  currentTurn: number;
  turnLimit: number;
  isBidding: boolean;
  replay?: boolean;
}

const phaseLabels: Record<string, string> = {
  configuring: 'Configuring',
  opening: 'Opening Round',
  main_loop: 'Main Discussion',
  closing: 'Closing',
  completed: 'Completed',
};

export function StatusBar({
  phase,
  currentTurn,
  turnLimit,
  isBidding,
  replay,
}: StatusBarProps) {
  const phaseLabel = phase ? phaseLabels[phase] ?? phase : 'Ready';

  return (
    <Box borderStyle="single" paddingX={1}>
      {replay && (
        <>
          <Text bold color="magenta">
            {'\u25B6 REPLAY'}
          </Text>
          <Text> | </Text>
        </>
      )}
      <Text bold color="blue">
        Turn {currentTurn}/{turnLimit}
      </Text>
      <Text> | </Text>
      <Text color="magenta">{phaseLabel}</Text>
      {isBidding && (
        <>
          <Text> | </Text>
          <Text color="gray">Collecting bids...</Text>
        </>
      )}
    </Box>
  );
}
