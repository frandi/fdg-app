import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useInput, useStdout } from 'ink';
import { ScrollView, type ScrollViewRef } from 'ink-scroll-view';
import { ScrollBarBox } from '@byteland/ink-scroll-bar';
import { useMouseWheel } from '../hooks/useMouseWheel.js';

type BorderStyle =
  | 'single'
  | 'double'
  | 'round'
  | 'bold'
  | 'singleDouble'
  | 'doubleSingle'
  | 'classic';

interface ScrollableBoxProps {
  children: React.ReactNode;
  flexGrow?: number;
  flexShrink?: number;
  borderStyle?: BorderStyle;
  followBottom?: boolean;
  followBottomDeps?: React.DependencyList;
  scrollStep?: number;
  wheelStep?: number;
  isActive?: boolean;
}

export function ScrollableBox({
  children,
  flexGrow = 1,
  flexShrink = 1,
  borderStyle,
  followBottom = false,
  followBottomDeps,
  scrollStep = 1,
  wheelStep = 3,
  isActive = true,
}: ScrollableBoxProps) {
  const scrollRef = useRef<ScrollViewRef>(null);
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const followRef = useRef(followBottom);

  useEffect(() => {
    const handleResize = () => scrollRef.current?.remeasure();
    stdout.on('resize', handleResize);
    return () => {
      stdout.off('resize', handleResize);
    };
  }, [stdout]);

  useEffect(() => {
    if (followBottom && followRef.current) {
      queueMicrotask(() => scrollRef.current?.scrollToBottom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, followBottomDeps ?? []);

  const scrollByDelta = useCallback((delta: number) => {
    const ref = scrollRef.current;
    if (!ref) return;
    if (delta < 0) {
      followRef.current = false;
    }
    ref.scrollBy(delta);
    if (delta > 0) {
      queueMicrotask(() => {
        const current = ref.getScrollOffset();
        const bottom = ref.getBottomOffset();
        followRef.current = current >= bottom;
      });
    }
  }, []);

  useInput(
    (input, key) => {
      const ref = scrollRef.current;
      if (!ref) return;
      const vh = ref.getViewportHeight() || 1;
      if (key.pageUp) {
        scrollByDelta(-vh);
      } else if (key.pageDown) {
        scrollByDelta(vh);
      } else if (key.ctrl && input === 'u') {
        scrollByDelta(-scrollStep);
      } else if (key.ctrl && input === 'd') {
        scrollByDelta(scrollStep);
      } else if (input === 'g') {
        followRef.current = false;
        ref.scrollToTop();
      } else if (input === 'G') {
        followRef.current = true;
        ref.scrollToBottom();
      }
    },
    { isActive },
  );

  const wheelHandler = useCallback(
    (direction: 'up' | 'down') => {
      scrollByDelta(direction === 'up' ? -wheelStep : wheelStep);
    },
    [scrollByDelta, wheelStep],
  );
  useMouseWheel(wheelHandler, isActive);

  return (
    <ScrollBarBox
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      borderStyle={borderStyle}
      scrollBarPosition="right"
      scrollBarAutoHide
      contentHeight={contentHeight}
      viewportHeight={viewportHeight}
      scrollOffset={scrollOffset}
    >
      <ScrollView
        ref={scrollRef}
        flexGrow={flexGrow}
        flexShrink={flexShrink}
        onScroll={setScrollOffset}
        onContentHeightChange={setContentHeight}
        onViewportSizeChange={(size: { width: number; height: number }) =>
          setViewportHeight(size.height)
        }
      >
        {children}
      </ScrollView>
    </ScrollBarBox>
  );
}
