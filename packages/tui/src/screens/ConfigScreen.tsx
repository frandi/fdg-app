import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ParticipantDefinition, HostDefinition, SessionConfig } from '@fdg/types';

interface ConfigScreenProps {
  availableParticipants: ParticipantDefinition[];
  onStart: (config: SessionConfig) => void;
}

type Step = 'participants' | 'host' | 'topic' | 'goal' | 'turnLimit' | 'confirm';

export function ConfigScreen({
  availableParticipants,
  onStart,
}: ConfigScreenProps) {
  const [step, setStep] = useState<Step>('participants');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [hostPersona, setHostPersona] = useState('A balanced, Socratic facilitator who encourages deep analysis and diverse perspectives.');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [turnLimitStr, setTurnLimitStr] = useState('10');

  useInput((input, key) => {
    if (step === 'participants') {
      if (key.upArrow) {
        setCursor((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setCursor((prev) => Math.min(availableParticipants.length - 1, prev + 1));
      } else if (input === ' ') {
        const id = availableParticipants[cursor]?.id;
        if (id) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        }
      } else if (key.return && selectedIds.size >= 2) {
        setStep('host');
      }
    }
  });

  if (step === 'participants') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="yellow">
          Select Participants (Space to toggle, Enter to confirm, min 2)
        </Text>
        {availableParticipants.map((p, i) => (
          <Text key={p.id} color={i === cursor ? 'cyan' : 'white'}>
            {i === cursor ? '> ' : '  '}
            {selectedIds.has(p.id) ? '[x]' : '[ ]'} {p.name} ({p.llmModel})
          </Text>
        ))}
        <Text color="gray">Selected: {selectedIds.size}</Text>
      </Box>
    );
  }

  if (step === 'host') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="yellow">
          Host Persona:
        </Text>
        <TextInput
          value={hostPersona}
          onChange={setHostPersona}
          onSubmit={() => setStep('topic')}
        />
        <Text color="gray">[Enter to continue]</Text>
      </Box>
    );
  }

  if (step === 'topic') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="yellow">
          Discussion Topic:
        </Text>
        <TextInput value={topic} onChange={setTopic} onSubmit={() => {
          if (topic.trim()) setStep('goal');
        }} />
      </Box>
    );
  }

  if (step === 'goal') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="yellow">
          Discussion Goal:
        </Text>
        <TextInput value={goal} onChange={setGoal} onSubmit={() => {
          if (goal.trim()) setStep('turnLimit');
        }} />
      </Box>
    );
  }

  if (step === 'turnLimit') {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="yellow">
          Turn Limit (default 10):
        </Text>
        <TextInput
          value={turnLimitStr}
          onChange={setTurnLimitStr}
          onSubmit={() => setStep('confirm')}
        />
      </Box>
    );
  }

  // Confirm step
  const selectedParticipants = availableParticipants.filter((p) =>
    selectedIds.has(p.id),
  );
  const host: HostDefinition = {
    persona: hostPersona,
    llmProvider: selectedParticipants[0].llmProvider,
    llmModel: selectedParticipants[0].llmModel,
  };
  const limit = parseInt(turnLimitStr, 10) || 10;

  useInput((_input, key) => {
    if (key.return) {
      onStart({
        topic,
        goal,
        turnLimit: limit,
        host,
        participants: selectedParticipants,
      });
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="yellow" underline>
        Session Configuration
      </Text>
      <Text>Topic: {topic}</Text>
      <Text>Goal: {goal}</Text>
      <Text>Turn Limit: {limit}</Text>
      <Text>Host: {hostPersona.slice(0, 60)}...</Text>
      <Text>
        Participants: {selectedParticipants.map((p) => p.name).join(', ')}
      </Text>
      <Text color="green" bold>
        [Enter] Start Discussion
      </Text>
    </Box>
  );
}
