import React from 'react';
import { Box, Text } from 'ink';

export function ConcludedBanner() {
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">
        {'\u2713 Session concluded'}
      </Text>
      <Text color="gray">{'  \u2014  '}</Text>
      <Text color="white">[s]</Text>
      <Text color="gray"> View summary </Text>
      <Text color="gray">|</Text>
      <Text color="white"> [r]</Text>
      <Text color="gray"> Replay session</Text>
    </Box>
  );
}
