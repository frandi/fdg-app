import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SessionConfig, SessionSummary, Utterance } from '@fdg/types';

function formatMarkdown(
  config: SessionConfig,
  summary: SessionSummary,
  utterances: Utterance[],
): string {
  const lines: string[] = [];

  lines.push(`# FDG Session: ${config.topic}`);
  lines.push('');
  lines.push(`**Goal:** ${config.goal}`);
  lines.push(`**Participants:** ${config.participants.map((p) => p.name).join(', ')}`);
  lines.push(`**Turn Limit:** ${config.turnLimit}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('### Topic & Goal');
  lines.push(summary.topicAndGoal);
  lines.push('');

  lines.push('### Key Positions');
  for (const kp of summary.keyPositions) {
    lines.push(`- **${kp.participantName}:** ${kp.position}`);
  }
  lines.push('');

  lines.push('### Points of Agreement');
  for (const p of summary.pointsOfAgreement) {
    lines.push(`- ${p}`);
  }
  lines.push('');

  lines.push('### Points of Contention');
  for (const p of summary.pointsOfContention) {
    lines.push(`- ${p}`);
  }
  lines.push('');

  if (summary.emergingConsensus) {
    lines.push('### Emerging Consensus');
    lines.push(summary.emergingConsensus);
    lines.push('');
  }

  lines.push('### Unresolved Questions');
  for (const q of summary.unresolvedQuestions) {
    lines.push(`- ${q}`);
  }
  lines.push('');

  if (summary.recommendation) {
    lines.push('### Recommendation');
    lines.push(summary.recommendation);
    lines.push('');
  }

  // Full transcript
  lines.push('## Transcript');
  lines.push('');
  for (const u of utterances) {
    lines.push(`**${u.speakerName}:** ${u.content}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function exportSession(
  sessionId: string,
  config: SessionConfig,
  summary: SessionSummary,
  utterances: Utterance[],
): string {
  const exportDir = join(homedir(), '.fdg', 'exports');
  mkdirSync(exportDir, { recursive: true });

  const filePath = join(exportDir, `${sessionId}.md`);
  const content = formatMarkdown(config, summary, utterances);
  writeFileSync(filePath, content, 'utf-8');

  return filePath;
}
