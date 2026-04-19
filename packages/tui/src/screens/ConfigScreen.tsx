import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ParticipantDefinition, HostDefinition, SessionConfig } from '@fdg/contracts';
import type { ParticipantPoolApi } from '@fdg/sdk';
import { PoolManageScreen } from './PoolManageScreen.js';
import { ScrollableBox } from '../components/ScrollableBox.js';
import { loadCachedConfig, saveCachedConfig } from '../utils/config-cache.js';

interface ConfigScreenProps {
  availableParticipants: ParticipantDefinition[];
  pool: ParticipantPoolApi;
  onParticipantsChanged: (participants: ParticipantDefinition[]) => void;
  onStart: (config: SessionConfig) => void;
}

type Step = 'restorePrompt' | 'participants' | 'host' | 'topic' | 'goal' | 'turnLimit' | 'confirm';

function initFromCache(availableParticipants: ParticipantDefinition[]) {
  const cached = loadCachedConfig();
  if (!cached) return null;
  // Validate that cached participant IDs still exist in the pool
  const validIds = cached.participantIds.filter((id) =>
    availableParticipants.some((p) => p.id === id),
  );
  if (validIds.length < 2) return null;
  return { ...cached, participantIds: validIds };
}

export function ConfigScreen({
  availableParticipants,
  pool,
  onParticipantsChanged,
  onStart,
}: ConfigScreenProps) {
  const [cached] = useState(() => initFromCache(availableParticipants));
  const [step, setStep] = useState<Step>(cached ? 'restorePrompt' : 'participants');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [managingPool, setManagingPool] = useState(false);
  const [hostPersona, setHostPersona] = useState('A balanced, Socratic facilitator who encourages deep analysis and diverse perspectives.');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [turnLimitStr, setTurnLimitStr] = useState('10');

  useInput((input, key) => {
    if (step === 'restorePrompt') {
      if (input === 'y' && cached) {
        setSelectedIds(new Set(cached.participantIds));
        setHostPersona(cached.hostPersona);
        setTopic(cached.topic);
        setGoal(cached.goal);
        setTurnLimitStr(String(cached.turnLimit));
        setStep('confirm');
      } else if (input === 'n') {
        setStep('participants');
      }
    } else if (step === 'participants') {
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
      } else if (input === 'm') {
        setManagingPool(true);
      } else if (key.return && selectedIds.size >= 2) {
        setStep('host');
      }
    } else if (step === 'confirm' && key.return) {
      const selectedParticipants = availableParticipants.filter((p) =>
        selectedIds.has(p.id),
      );
      const host: HostDefinition = {
        persona: hostPersona,
        llmProvider: selectedParticipants[0].llmProvider,
        llmModel: selectedParticipants[0].llmModel,
      };
      const limit = parseInt(turnLimitStr, 10) || 10;
      saveCachedConfig({
        participantIds: [...selectedIds],
        hostPersona,
        topic,
        goal,
        turnLimit: limit,
      });
      onStart({
        topic,
        goal,
        turnLimit: limit,
        host,
        participants: selectedParticipants,
      });
    }
  });

  if (step === 'restorePrompt' && cached) {
    const cachedParticipantNames = cached.participantIds
      .map((id) => availableParticipants.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="yellow">Previous session config found:</Text>
        <Text>Topic: {cached.topic}</Text>
        <Text>Goal: {cached.goal}</Text>
        <Text>Turn Limit: {cached.turnLimit}</Text>
        <Text>Host: {cached.hostPersona.slice(0, 60)}...</Text>
        <Text>Participants: {cachedParticipantNames}</Text>
        <Box marginTop={1}>
          <Text color="green">[y] Reuse  </Text>
          <Text color="gray">[n] Start fresh</Text>
        </Box>
      </Box>
    );
  }

  if (step === 'participants' && managingPool) {
    return (
      <PoolManageScreen
        pool={pool}
        onDone={(updated) => {
          onParticipantsChanged(updated);
          setSelectedIds((prev) => new Set([...prev].filter((id) => updated.some((p) => p.id === id))));
          setCursor((prev) => Math.min(prev, Math.max(0, updated.length - 1)));
          setManagingPool(false);
        }}
      />
    );
  }

  if (step === 'participants') {
    return (
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        <Box flexShrink={0}>
          <Text bold color="yellow">
            Select Participants (Space to toggle, Enter to confirm, min 2)
          </Text>
        </Box>
        <ScrollableBox>
          <Box flexDirection="column">
            {availableParticipants.map((p, i) => (
              <Text key={p.id} color={i === cursor ? 'cyan' : 'white'}>
                {i === cursor ? '> ' : '  '}
                {selectedIds.has(p.id) ? '[x]' : '[ ]'} {p.name} ({p.llmModel})
              </Text>
            ))}
          </Box>
        </ScrollableBox>
        <Box flexShrink={0}>
          <Text color="gray">
            Selected: {selectedIds.size}  [m] Manage pool  |  scroll: wheel / PgUp/PgDn
          </Text>
        </Box>
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
  const limit = parseInt(turnLimitStr, 10) || 10;

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
