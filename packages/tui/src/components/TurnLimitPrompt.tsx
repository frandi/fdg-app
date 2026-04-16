import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface TurnLimitPromptProps {
  currentTurn: number;
  turnLimit: number;
  onRespond: (action: 'conclude' | 'extend', extraTurns?: number) => void;
}

export function TurnLimitPrompt({
  currentTurn,
  turnLimit,
  onRespond,
}: TurnLimitPromptProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'c' || trimmed === 'conclude') {
      onRespond('conclude');
    } else {
      const num = parseInt(trimmed, 10);
      if (num > 0) {
        onRespond('extend', num);
      } else {
        onRespond('conclude');
      }
    }
  };

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">
        Turn limit reached ({currentTurn}/{turnLimit})
      </Text>
      <Text>
        Type a number to extend by N turns, or 'c' to conclude:
      </Text>
      <Box>
        <Text color="cyan">{"> "}</Text>
        <TextInput value={input} onChange={setInput} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
