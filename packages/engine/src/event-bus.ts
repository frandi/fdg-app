import EventEmitter from 'eventemitter3';
import type { EngineEvents } from '@fdg/types';

export class EngineEventBus extends EventEmitter<EngineEvents> {}
