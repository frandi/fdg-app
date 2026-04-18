import { useEffect } from 'react';
import { useStdin } from 'ink';

const ENABLE_MOUSE = '\x1b[?1000h\x1b[?1006h';
const DISABLE_MOUSE = '\x1b[?1006l\x1b[?1000l';

export type WheelDirection = 'up' | 'down';
export interface WheelModifiers {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
}
export type WheelHandler = (
  direction: WheelDirection,
  modifiers: WheelModifiers,
) => void;

const subscribers = new Set<WheelHandler>();
let refCount = 0;
let originalEmit: ((event: string | symbol, ...args: unknown[]) => boolean) | null = null;
let patchedStdin: NodeJS.ReadStream | null = null;
let exitHandlerInstalled = false;

const SGR_MOUSE_RE = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/g;

function parseAndStrip(input: string): {
  events: Array<{ direction: WheelDirection; modifiers: WheelModifiers }>;
  cleaned: string;
} {
  const events: Array<{ direction: WheelDirection; modifiers: WheelModifiers }> = [];
  let cleaned = '';
  let lastIndex = 0;
  SGR_MOUSE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SGR_MOUSE_RE.exec(input)) !== null) {
    cleaned += input.slice(lastIndex, match.index);
    const button = parseInt(match[1], 10);
    const isPress = match[4] === 'M';
    if (isPress && (button & 64) === 64) {
      const direction: WheelDirection = (button & 3) === 0 ? 'up' : 'down';
      events.push({
        direction,
        modifiers: {
          shift: (button & 4) !== 0,
          alt: (button & 8) !== 0,
          ctrl: (button & 16) !== 0,
        },
      });
    }
    lastIndex = match.index + match[0].length;
  }
  cleaned += input.slice(lastIndex);
  return { events, cleaned };
}

function writeDisable() {
  if (refCount > 0) {
    process.stdout.write(DISABLE_MOUSE);
  }
}

function installExitHandlerOnce() {
  if (exitHandlerInstalled) return;
  exitHandlerInstalled = true;
  process.on('exit', writeDisable);
}

function enableMouse(stdin: NodeJS.ReadStream) {
  if (refCount === 0) {
    process.stdout.write(ENABLE_MOUSE);
    installExitHandlerOnce();
    patchedStdin = stdin;
    originalEmit = stdin.emit.bind(stdin) as typeof originalEmit;
    (stdin as unknown as { emit: (event: string, ...args: unknown[]) => boolean }).emit =
      function patchedEmit(event: string, ...args: unknown[]): boolean {
        if (event === 'data' && originalEmit) {
          const chunk = args[0] as Buffer | string;
          const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
          if (str.includes('\x1b[<')) {
            const { events, cleaned } = parseAndStrip(str);
            for (const ev of events) {
              for (const sub of subscribers) {
                try {
                  sub(ev.direction, ev.modifiers);
                } catch {
                  // Subscriber threw — ignore so other subscribers still fire.
                }
              }
            }
            if (cleaned.length === 0) return true;
            const out = typeof chunk === 'string' ? cleaned : Buffer.from(cleaned, 'utf8');
            return originalEmit('data', out);
          }
        }
        return originalEmit ? originalEmit(event, ...args) : false;
      };
  }
  refCount++;
}

function disableMouse() {
  refCount--;
  if (refCount === 0) {
    if (patchedStdin && originalEmit) {
      (patchedStdin as unknown as { emit: typeof originalEmit }).emit = originalEmit;
    }
    originalEmit = null;
    patchedStdin = null;
    process.stdout.write(DISABLE_MOUSE);
  }
}

export function useMouseWheel(handler: WheelHandler, isActive: boolean = true): void {
  const { stdin, setRawMode, isRawModeSupported } = useStdin();
  useEffect(() => {
    if (!isActive || !isRawModeSupported || !stdin) return;
    setRawMode(true);
    enableMouse(stdin);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
      disableMouse();
    };
  }, [isActive, handler, stdin, setRawMode, isRawModeSupported]);
}
