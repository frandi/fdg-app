import React from 'react';
import { Box, Text } from 'ink';
import type { Utterance } from '@fdg/types';
import { UtteranceType } from '@fdg/types';
import { ScrollableBox } from './ScrollableBox.js';

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
  const items: React.ReactElement[] = transcript.map((u) => (
    <Box key={u.id} marginBottom={1} paddingX={1} flexDirection="row">
      <Text color={getSpeakerColor(u.type)} bold>
        [{u.speakerName}]{' '}
      </Text>
      <Text wrap="wrap">{u.content}</Text>
    </Box>
  ));

  if (streamingText) {
    const speakerName =
      participantNames.get(streamingText.speakerId) ?? streamingText.speakerId;
    items.push(
      <Box key="__streaming__" marginBottom={1} paddingX={1} flexDirection="row">
        <Text color="green" bold>
          [{speakerName}]{' '}
        </Text>
        <Text wrap="wrap">{streamingText.text}</Text>
        <Text color="gray">▋</Text>
      </Box>,
    );
  }

  return (
    <ScrollableBox
      borderStyle="single"
      followBottom
      followBottomDeps={[transcript.length, streamingText?.text, streamingText?.speakerId]}
    >
      {items}
    </ScrollableBox>
  );
}
