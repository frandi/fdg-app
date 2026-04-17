import EventEmitter from 'eventemitter3';
import type { EngineEvents } from '@fdg/types';

export type EnginePersister = (type: string, payload: unknown) => void;

export class EngineEventBus extends EventEmitter<EngineEvents> {
  private persister: EnginePersister | null = null;

  setPersister(fn: EnginePersister | null): void {
    this.persister = fn;
  }

  emit<K extends keyof EngineEvents>(
    event: K,
    ...args: EngineEvents[K]
  ): boolean {
    if (this.persister) {
      try {
        this.persister(event as string, args[0]);
      } catch {
        // persistence must not break emission
      }
    }
    return (super.emit as (e: K, ...a: unknown[]) => boolean)(event, ...args);
  }
}
