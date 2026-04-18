import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SessionRow } from '@fdg/db';
import { ScrollableBox } from '../components/ScrollableBox.js';

interface SessionBrowserScreenProps {
  sessions: SessionRow[];
  onResume: (sessionId: string) => void;
  onStartNew: () => void;
}

function formatCompletedAt(iso: string | null): string {
  if (!iso) return '—';
  // SQLite datetime('now') produces 'YYYY-MM-DD HH:MM:SS' in UTC.
  return iso.slice(0, 16);
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export function SessionBrowserScreen({
  sessions,
  onResume,
  onStartNew,
}: SessionBrowserScreenProps) {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setCursor((prev) => Math.min(sessions.length - 1, prev + 1));
    } else if (key.return) {
      const selected = sessions[cursor];
      if (selected) onResume(selected.id);
    } else if (input === 'n' || input === 'q' || key.escape) {
      onStartNew();
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box flexDirection="column" flexShrink={0}>
        <Text bold color="cyan">
          {'=== FDG - Focus Discussion Group ==='}
        </Text>
        <Box marginTop={1}>
          <Text bold color="yellow">Previous Sessions</Text>
        </Box>
        <Text color="gray">{'─'.repeat(60)}</Text>
      </Box>

      <ScrollableBox>
        <Box flexDirection="column">
          {sessions.map((s, i) => {
            const active = i === cursor;
            return (
              <Box key={s.id} flexDirection="row">
                <Text color={active ? 'cyan' : 'white'}>
                  {active ? '> ' : '  '}
                  {formatCompletedAt(s.completedAt)}  {truncate(s.topic, 40).padEnd(40)}  {s.currentTurn} turns
                </Text>
              </Box>
            );
          })}
        </Box>
      </ScrollableBox>

      <Box flexDirection="column" flexShrink={0}>
        <Text color="gray">{'─'.repeat(60)}</Text>
        <Text color="gray">
          [↑/↓] Navigate  [Enter] Resume  [n] New session  [q] Quit to new  |  scroll: wheel / PgUp/PgDn
        </Text>
      </Box>
    </Box>
  );
}
