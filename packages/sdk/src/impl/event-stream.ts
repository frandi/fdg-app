import type { EngineEventBus } from '@fdg/engine';
import type { EngineEventStream } from '../events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void;

/**
 * Narrowing adapter over EngineEventBus. Consumers get a subscribe/unsubscribe
 * surface without accessing the Node EventEmitter directly; the SDK owns the
 * bus lifecycle. Internal casts are unavoidable because we're erasing the
 * bus's strongly-typed emit signature into a transport-agnostic shape.
 */
export function createEngineEventStream(bus: EngineEventBus): EngineEventStream {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const busOn = bus.on.bind(bus) as (event: any, listener: AnyFn) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const busOff = bus.off.bind(bus) as (event: any, listener: AnyFn) => void;

  return {
    on(event, listener) {
      busOn(event, listener as AnyFn);
      return () => busOff(event, listener as AnyFn);
    },
    off(event, listener) {
      busOff(event, listener as AnyFn);
    },
  };
}
