import type { Database, SessionEventRow } from './db/index.js';
import type { EngineEvents } from '@fdg/contracts';
import type { EngineEventBus } from './event-bus.js';

export interface ReplayerOptions {
  charsPerChunk?: number;
  chunkDelayMs?: number;
  onFinished?: () => void;
}

interface StreamingPreface {
  event: keyof EngineEvents;
  payloadFor: (chunk: string) => unknown;
}

const STREAMING_MAP: Record<string, StreamingPreface> = {
  'host:spoke': {
    event: 'host:speaking',
    payloadFor: (chunk) => ({ chunk }),
  },
  'participant:opened': {
    event: 'participant:opening',
    payloadFor: () => ({}),
  },
  'participant:spoke': {
    event: 'participant:speaking',
    payloadFor: () => ({}),
  },
};

export class SessionReplayer {
  private timeouts: ReturnType<typeof setTimeout>[] = [];
  private stopped = false;

  constructor(
    private sessionId: string,
    private db: Database,
    private bus: EngineEventBus,
    private opts: ReplayerOptions = {},
  ) {}

  start(): void {
    const events = this.db.sessionEvents.getBySession(this.sessionId);
    if (events.length === 0) {
      this.opts.onFinished?.();
      return;
    }

    const t0 = events[0].timestampMs;
    const charsPerChunk = this.opts.charsPerChunk ?? 20;
    const chunkDelayMs = this.opts.chunkDelayMs ?? 40;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const next = events[i + 1];
      const eventAt = event.timestampMs - t0;
      const nextAt = next ? next.timestampMs - t0 : eventAt + 500;

      this.scheduleEvent(event, eventAt, nextAt, charsPerChunk, chunkDelayMs);
    }

    const finishAt = events[events.length - 1].timestampMs - t0 + 300;
    this.schedule(finishAt, () => {
      if (!this.stopped) this.opts.onFinished?.();
    });
  }

  stop(): void {
    this.stopped = true;
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts = [];
  }

  private scheduleEvent(
    event: SessionEventRow,
    eventAt: number,
    nextAt: number,
    charsPerChunk: number,
    chunkDelayMs: number,
  ): void {
    const streaming = STREAMING_MAP[event.type];
    const utterance = streaming
      ? (event.payload as { utterance?: { content?: string } })?.utterance
      : undefined;
    const content = utterance?.content ?? '';

    if (streaming && content.length > 0) {
      const chunks = splitIntoChunks(content, charsPerChunk);
      const available = Math.max(0, nextAt - eventAt - 50);
      const delay = chunks.length > 1
        ? Math.min(chunkDelayMs, available / chunks.length)
        : 0;
      const streamStart = Math.max(0, eventAt - delay * chunks.length);

      const participantId =
        (event.payload as { participantId?: string })?.participantId;

      for (let i = 0; i < chunks.length; i++) {
        const at = streamStart + i * delay;
        const chunk = chunks[i];
        const payload =
          streaming.event === 'host:speaking'
            ? { chunk }
            : { participantId: participantId ?? '', chunk };
        this.schedule(at, () => {
          const emit = this.bus.emit.bind(this.bus) as (
            e: string,
            p: unknown,
          ) => boolean;
          emit(streaming.event as string, payload);
        });
      }
    }

    this.schedule(eventAt, () => {
      const emit = this.bus.emit.bind(this.bus) as (
        e: string,
        p: unknown,
      ) => boolean;
      emit(event.type, event.payload);
    });
  }

  private schedule(delay: number, fn: () => void): void {
    const clamped = Math.max(0, delay);
    const handle = setTimeout(() => {
      if (this.stopped) return;
      fn();
    }, clamped);
    this.timeouts.push(handle);
  }
}

function splitIntoChunks(text: string, size: number): string[] {
  if (size <= 0) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}
