import React from 'react';
import { Box, Text } from 'ink';
import type { ParticipantDefinition, Bid } from '@fdg/contracts';

interface ParticipantListProps {
  participants: ParticipantDefinition[];
  bids: Bid[];
  speakingId: string | null;
  selectedId: string | null;
}

export function ParticipantList({
  participants,
  bids,
  speakingId,
  selectedId,
}: ParticipantListProps) {
  return (
    <Box flexDirection="column" width={20} borderStyle="single" paddingX={1}>
      <Text bold underline>
        Participants
      </Text>
      {participants.map((p) => {
        const isSpeaking = speakingId === p.id;
        const isSelected = selectedId === p.id;
        const hasBid = bids.some((b) => b.participantId === p.id);

        let indicator = '  ';
        let color: string = 'white';

        if (isSpeaking) {
          indicator = '> ';
          color = 'green';
        } else if (isSelected) {
          indicator = '* ';
          color = 'yellow';
        } else if (hasBid) {
          indicator = '~ ';
          color = 'gray';
        }

        return (
          <Text key={p.id} color={color}>
            {indicator}
            {p.name}
          </Text>
        );
      })}
    </Box>
  );
}
