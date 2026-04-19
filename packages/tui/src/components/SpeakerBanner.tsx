import React from 'react';
import { Box, Text } from 'ink';
import type { BidEvaluation } from '@fdg/contracts';

interface SpeakerBannerProps {
  evaluation: BidEvaluation | null;
  participantNames: Map<string, string>;
}

export function SpeakerBanner({ evaluation, participantNames }: SpeakerBannerProps) {
  if (!evaluation) return null;

  const name =
    participantNames.get(evaluation.selectedParticipantId) ??
    evaluation.selectedParticipantId;

  return (
    <Box paddingX={1} marginY={0}>
      <Text color="yellow" bold>
        Host grants the floor to {name}
      </Text>
      <Text color="gray"> -- {evaluation.reasoning}</Text>
    </Box>
  );
}
