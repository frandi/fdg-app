import type { EngineEvents } from '@fdg/contracts';

type EventArgs<Events, K extends keyof Events> = Events[K] extends readonly unknown[]
  ? Events[K]
  : never;

type Listener<Events, K extends keyof Events> = (
  ...args: EventArgs<Events, K>
) => void;

/**
 * Transport-agnostic typed event stream. Consumers subscribe with on/off.
 * Intentionally narrower than EventEmitter — no wildcards, no once, no
 * listener counts — so alternate transports (WebSocket, IPC) can implement
 * it without exposing Node-only semantics.
 */
export interface TypedEventStream<Events> {
  on<K extends keyof Events>(event: K, listener: Listener<Events, K>): () => void;
  off<K extends keyof Events>(event: K, listener: Listener<Events, K>): void;
}

export type EngineEventStream = TypedEventStream<EngineEvents>;
