import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { ScrollView, type ScrollViewRef } from 'ink-scroll-view';
import { ScrollBarBox } from '@byteland/ink-scroll-bar';
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

const SCROLL_STEP = 1;

export function TranscriptPanel({
  transcript,
  streamingText,
  participantNames,
}: TranscriptPanelProps) {
  const scrollRef = useRef<ScrollViewRef>(null);
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const followBottomRef = useRef(true);

  useEffect(() => {
    const handleResize = () => scrollRef.current?.remeasure();
    stdout.on('resize', handleResize);
    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  useEffect(() => {
    if (followBottomRef.current) {
      queueMicrotask(() => scrollRef.current?.scrollToBottom());
    }
  }, [transcript.length, streamingText?.text, streamingText?.speakerId]);

  useInput((_input, key) => {
    const ref = scrollRef.current;
    if (!ref) return;
    const vh = ref.getViewportHeight() || 1;

    if (key.pageUp) {
      followBottomRef.current = false;
      ref.scrollBy(-vh);
    } else if (key.pageDown) {
      ref.scrollBy(vh);
      queueMicrotask(() => {
        const current = ref.getScrollOffset();
        const bottom = ref.getBottomOffset();
        followBottomRef.current = current >= bottom;
      });
    } else if (key.ctrl && _input === 'u') {
      followBottomRef.current = false;
      ref.scrollBy(-SCROLL_STEP);
    } else if (key.ctrl && _input === 'd') {
      ref.scrollBy(SCROLL_STEP);
      queueMicrotask(() => {
        const current = ref.getScrollOffset();
        const bottom = ref.getBottomOffset();
        followBottomRef.current = current >= bottom;
      });
    } else if (_input === 'g') {
      followBottomRef.current = false;
      ref.scrollToTop();
    } else if (_input === 'G') {
      followBottomRef.current = true;
      ref.scrollToBottom();
    }
  });

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
    <ScrollBarBox
      flexGrow={1}
      flexShrink={1}
      borderStyle="single"
      scrollBarPosition="right"
      scrollBarAutoHide
      contentHeight={contentHeight}
      viewportHeight={viewportHeight}
      scrollOffset={scrollOffset}
    >
      <ScrollView
        ref={scrollRef}
        flexGrow={1}
        flexShrink={1}
        onScroll={setScrollOffset}
        onContentHeightChange={setContentHeight}
        onViewportSizeChange={(size: { width: number; height: number }) =>
          setViewportHeight(size.height)
        }
      >
        {items}
      </ScrollView>
    </ScrollBarBox>
  );
}
