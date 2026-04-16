import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface WhisperInputProps {
  onSubmit: (message: string) => void;
  acknowledged: boolean;
}

export function WhisperInput({ onSubmit, acknowledged }: WhisperInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');

  useInput((_input, key) => {
    if (key.tab && !isOpen) {
      setIsOpen(true);
    }
    if (key.escape && isOpen) {
      setIsOpen(false);
      setValue('');
    }
  });

  const handleSubmit = (text: string) => {
    if (text.trim()) {
      onSubmit(text.trim());
      setValue('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Box paddingX={1}>
        <Text color="gray">
          [Tab] Whisper to host
          {acknowledged ? <Text color="green"> (delivered)</Text> : ''}
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} borderStyle="round" borderColor="yellow">
      <Text color="yellow" bold>
        Whisper:{' '}
      </Text>
      <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
      <Text color="gray"> [Esc] Cancel</Text>
    </Box>
  );
}
