export { createFdgClient } from './impl/in-process-client.js';
export type {
  FdgClient,
  CreateClientOptions,
  SessionHandle,
  ReplayHandle,
  ReplayOptions,
  ResumedSession,
  ParticipantPoolApi,
  ParticipantCreateInput,
  ParticipantPatch,
} from './client.js';
export type { TypedEventStream, EngineEventStream } from './events.js';
export type { SessionRow } from '@fdg/db';
