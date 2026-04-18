import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SessionConfig, SessionSummary } from '@fdg/types';
import type { Database } from '@fdg/db';
import { SummaryView } from '../components/SummaryView.js';
import { ScrollableBox } from '../components/ScrollableBox.js';
import { exportSession } from '../utils/export.js';

interface SummaryScreenProps {
  db: Database;
  sessionId: string;
  config: SessionConfig;
  summary: SessionSummary;
  onBack: () => void;
}

export function SummaryScreen({
  db,
  sessionId,
  config,
  summary,
  onBack,
}: SummaryScreenProps) {
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (input === 'e' && !exportPath && !exportError) {
      try {
        const utterances = db.utterances.getBySession(sessionId);
        const path = exportSession(sessionId, config, summary, utterances);
        setExportPath(path);
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Export failed');
      }
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <ScrollableBox>
        <SummaryView summary={summary} />
      </ScrollableBox>
      <Box paddingX={1} marginTop={1} flexDirection="column" flexShrink={0}>
        {exportPath ? (
          <Text color="green">Exported to {exportPath}</Text>
        ) : exportError ? (
          <Text color="red">Export failed: {exportError}</Text>
        ) : (
          <Text color="gray">[e] Export transcript &amp; summary</Text>
        )}
        <Text color="gray">
          [esc] Back to session  |  scroll: wheel / PgUp/PgDn / g,G  |  Ctrl+C to exit.
        </Text>
      </Box>
    </Box>
  );
}
