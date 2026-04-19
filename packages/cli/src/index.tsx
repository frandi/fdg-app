import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dirname, '..', '..', '..', '.env') });
import React from 'react';
import { render } from 'ink';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { Database } from '@fdg/db';
import { LlmProvider } from '@fdg/contracts';
import type { ParticipantDefinition } from '@fdg/contracts';
import { App, enterFullscreen, exitFullscreen } from '@fdg/tui';

// Ensure data directory exists
const dataDir = join(homedir(), '.fdg');
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'fdg.db');
const db = new Database(dbPath);

// Seed default participants if pool is empty
let participants = db.participants.getAll();
if (participants.length === 0) {
  const defaults: Array<Omit<ParticipantDefinition, 'id'>> = [
    {
      name: 'Alex (Pragmatist)',
      persona:
        'A pragmatic business strategist who focuses on ROI, market viability, and execution risk. Tends to challenge idealistic proposals with practical concerns. Communicates directly and prefers data over anecdotes.',
      llmProvider: LlmProvider.OpenAI,
      llmModel: 'gpt-5.4-mini',
    },
    {
      name: 'Maya (Innovator)',
      persona:
        'A creative technologist who champions bold ideas and emerging trends. Sees opportunity where others see risk. Draws analogies from adjacent industries and loves first-principles thinking. Enthusiastic but occasionally overestimates feasibility.',
      llmProvider: LlmProvider.OpenAI,
      llmModel: 'gpt-5.4-mini',
    },
    {
      name: 'Jordan (Skeptic)',
      persona:
        'A critical thinker who plays devil\'s advocate. Questions assumptions, asks for evidence, and highlights failure modes. Not contrarian for the sake of it — genuinely believes rigorous challenge produces better outcomes. Dry humor.',
      llmProvider: LlmProvider.Anthropic,
      llmModel: 'claude-haiku-4-5',
    },
    {
      name: 'Sam (Humanist)',
      persona:
        'A user experience researcher who centers human needs, accessibility, and ethical implications. Brings qualitative insights and advocates for underrepresented perspectives. Empathetic communicator who bridges technical and non-technical viewpoints.',
      llmProvider: LlmProvider.Anthropic,
      llmModel: 'claude-haiku-4-5',
    },
    {
      name: 'Riley (Systems Thinker)',
      persona:
        'An operations-minded architect who thinks in systems, dependencies, and second-order effects. Excels at identifying hidden constraints and unintended consequences. Speaks in structured frameworks and loves diagrams (describes them verbally in a TUI).',
      llmProvider: LlmProvider.OpenAI,
      llmModel: 'gpt-5.4-mini',
    },
  ];

  for (const d of defaults) {
    db.participants.create(d.name, d.persona, d.llmProvider, d.llmModel);
  }

  participants = db.participants.getAll();
}

const initialCompletedSessions = db.sessions.listCompletedWithSummary();

enterFullscreen();

const { waitUntilExit } = render(
  <App
    db={db}
    availableParticipants={participants}
    initialCompletedSessions={initialCompletedSessions}
  />,
);

waitUntilExit().then(() => {
  exitFullscreen();
  db.close();
});
