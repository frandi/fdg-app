import React from 'react';
import { Box, Text } from 'ink';
import type { Utterance } from '@fdg/types';
import { UtteranceType } from '@fdg/types';

interface TranscriptPanelProps {
  transcript: Utterance[];
  streamingText: { speakerId: string; text: string } | null;
  participantNames: Map<string, string>;
}

function getSpeakerColor(type: UtteranceType): string {
  switch (type) {
    case UtteranceType.HostOpening:
    case UtteranceType.HostClosing:
    case UtteranceType.HostFacilitation:
    case UtteranceType.HostNarrow:
      return 'yellow';
    case UtteranceType.ParticipantOpening:
    case UtteranceType.ParticipantResponse:
      return 'cyan';
    default:
      return 'white';
  }
}

export function TranscriptPanel({
  transcript,
  streamingText,
  participantNames,
}: TranscriptPanelProps) {
  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {transcript.map((utterance) => (
        <Box key={utterance.id} marginBottom={1}>
          <Text color={getSpeakerColor(utterance.type)} bold>
            [{utterance.speakerName}]{' '}
          </Text>
          <Text wrap="wrap">{utterance.content}</Text>
        </Box>
      ))}
      {streamingText && (
        <Box marginBottom={1}>
          <Text color="green" bold>
            [{participantNames.get(streamingText.speakerId) ?? streamingText.speakerId}]{' '}
          </Text>
          <Text wrap="wrap">{streamingText.text}</Text>
          <Text color="gray">{'▋'}</Text>
        </Box>
      )}
    </Box>
  );
}
