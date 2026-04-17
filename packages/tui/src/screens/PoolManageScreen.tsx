import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { ParticipantDefinition } from '@fdg/types';
import { LlmProvider } from '@fdg/types';
import type { Database } from '@fdg/db';

interface PoolManageScreenProps {
  db: Database;
  onDone: (participants: ParticipantDefinition[]) => void;
}

type Mode = 'list' | 'form' | 'deleteConfirm';
type FormStep = 'name' | 'persona' | 'provider' | 'model';

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  [LlmProvider.OpenAI]: 'gpt-5.4-mini',
  [LlmProvider.Anthropic]: 'claude-haiku-4-5',
};

function toggleProvider(current: LlmProvider): LlmProvider {
  return current === LlmProvider.OpenAI ? LlmProvider.Anthropic : LlmProvider.OpenAI;
}

export function PoolManageScreen({ db, onDone }: PoolManageScreenProps) {
  const [participants, setParticipants] = useState<ParticipantDefinition[]>(
    () => db.participants.getAll(),
  );
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<Mode>('list');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<FormStep>('name');
  const [formName, setFormName] = useState('');
  const [formPersona, setFormPersona] = useState('');
  const [formProvider, setFormProvider] = useState<LlmProvider>(LlmProvider.OpenAI);
  const [formModel, setFormModel] = useState('gpt-5.4-mini');
  const [formError, setFormError] = useState('');

  const refresh = () => {
    const updated = db.participants.getAll();
    setParticipants(updated);
    setCursor((prev) => Math.min(prev, Math.max(0, updated.length - 1)));
  };

  const resetForm = () => {
    setFormStep('name');
    setFormName('');
    setFormPersona('');
    setFormProvider(LlmProvider.OpenAI);
    setFormModel('gpt-5.4-mini');
    setFormError('');
    setEditingId(null);
  };

  const startCreate = () => {
    resetForm();
    setMode('form');
  };

  const startEdit = () => {
    const p = participants[cursor];
    if (!p) return;
    setEditingId(p.id);
    setFormStep('name');
    setFormName(p.name);
    setFormPersona(p.persona);
    setFormProvider(p.llmProvider);
    setFormModel(p.llmModel);
    setFormError('');
    setMode('form');
  };

  const saveForm = () => {
    if (!formModel.trim()) {
      setFormError('Model cannot be empty');
      return;
    }
    if (editingId) {
      db.participants.update(editingId, {
        name: formName.trim(),
        persona: formPersona.trim(),
        llmProvider: formProvider,
        llmModel: formModel.trim(),
      });
    } else {
      db.participants.create(
        formName.trim(),
        formPersona.trim(),
        formProvider,
        formModel.trim(),
      );
    }
    refresh();
    resetForm();
    setMode('list');
  };

  useInput((input, key) => {
    if (mode === 'list') {
      if (key.upArrow) {
        setCursor((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setCursor((prev) => Math.min(participants.length - 1, prev + 1));
      } else if (input === 'n') {
        startCreate();
      } else if (input === 'e' && participants.length > 0) {
        startEdit();
      } else if (input === 'd' && participants.length > 0) {
        setMode('deleteConfirm');
      } else if (key.escape) {
        onDone(participants);
      }
    } else if (mode === 'form' && formStep === 'provider') {
      if (input === ' ') {
        const next = toggleProvider(formProvider);
        setFormProvider(next);
        setFormModel(DEFAULT_MODELS[next]);
      } else if (key.return) {
        setFormStep('model');
        setFormError('');
      } else if (key.escape) {
        resetForm();
        setMode('list');
      }
    } else if (mode === 'form' && key.escape) {
      resetForm();
      setMode('list');
    } else if (mode === 'deleteConfirm') {
      if (input === 'y') {
        const p = participants[cursor];
        if (p) {
          db.participants.delete(p.id);
          refresh();
        }
        setMode('list');
      } else if (input === 'n' || key.escape) {
        setMode('list');
      }
    }
  });

  // Delete confirmation
  if (mode === 'deleteConfirm') {
    const p = participants[cursor];
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color="red">
          Delete &quot;{p?.name}&quot;?
        </Text>
        <Text color="gray">[y] Yes  [n] No</Text>
      </Box>
    );
  }

  // Form mode
  if (mode === 'form') {
    const title = editingId ? 'Edit Participant' : 'New Participant';

    if (formStep === 'name') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold color="yellow">{title} — Name:</Text>
          <TextInput
            value={formName}
            onChange={(v) => { setFormName(v); setFormError(''); }}
            onSubmit={(v) => {
              if (!v.trim()) { setFormError('Name cannot be empty'); return; }
              setFormStep('persona');
              setFormError('');
            }}
          />
          {formError ? <Text color="red">{formError}</Text> : null}
          <Text color="gray">[Enter] Next  [Esc] Cancel</Text>
        </Box>
      );
    }

    if (formStep === 'persona') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold color="yellow">{title} — Persona Description:</Text>
          <TextInput
            value={formPersona}
            onChange={(v) => { setFormPersona(v); setFormError(''); }}
            onSubmit={(v) => {
              if (!v.trim()) { setFormError('Persona cannot be empty'); return; }
              setFormStep('provider');
              setFormError('');
            }}
          />
          {formError ? <Text color="red">{formError}</Text> : null}
          <Text color="gray">[Enter] Next  [Esc] Cancel</Text>
        </Box>
      );
    }

    if (formStep === 'provider') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold color="yellow">{title} — LLM Provider:</Text>
          <Text color="cyan">{formProvider}</Text>
          {formError ? <Text color="red">{formError}</Text> : null}
          <Text color="gray">[Space] Toggle  [Enter] Next  [Esc] Cancel</Text>
        </Box>
      );
    }

    if (formStep === 'model') {
      return (
        <Box flexDirection="column" paddingX={1}>
          <Text bold color="yellow">{title} — Model:</Text>
          <TextInput
            value={formModel}
            onChange={(v) => { setFormModel(v); setFormError(''); }}
            onSubmit={() => saveForm()}
          />
          {formError ? <Text color="red">{formError}</Text> : null}
          <Text color="gray">[Enter] Save  [Esc] Cancel</Text>
        </Box>
      );
    }
  }

  // List mode
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="yellow">
        Manage Participant Pool
      </Text>
      {participants.length === 0 ? (
        <Text color="gray">No participants. Press [n] to create one.</Text>
      ) : (
        participants.map((p, i) => (
          <Box key={p.id} flexDirection="column">
            <Text color={i === cursor ? 'cyan' : 'white'}>
              {i === cursor ? '> ' : '  '}
              {p.name} ({p.llmProvider}/{p.llmModel})
            </Text>
            <Text color="gray">
              {'    '}{p.persona.length > 80 ? p.persona.slice(0, 77) + '...' : p.persona}
            </Text>
          </Box>
        ))
      )}
      <Text color="gray">
        [n] New  [e] Edit  [d] Delete  [Esc] Back
      </Text>
    </Box>
  );
}
