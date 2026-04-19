# @fdg/sdk

The public API surface for the FDG engine. UIs — the bundled TUI, and any future web, mobile, or third-party application — consume this SDK instead of reaching into engine internals.

## Why an SDK

The engine owns session orchestration, bid evaluation, host logic, LLM adapters, and SQLite persistence. Rather than exposing those classes directly, the SDK provides a transport-agnostic surface:

- **Stable contract** — UIs never import from `@fdg/engine` or reach into the database.
- **Lifecycle inversion** — the SDK creates the event bus and the orchestrator; consumers subscribe to events they care about.
- **Alternate transports** — the current implementation runs in-process, but the same interface can be reimplemented over a WebSocket, IPC channel, or HTTP API.

## Install

```bash
pnpm add @fdg/sdk @fdg/contracts
```

Requires `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` in the environment for live sessions.

## Quickstart

```ts
import { createFdgClient } from '@fdg/sdk';
import { LlmProvider } from '@fdg/contracts';

const client = createFdgClient(); // defaults to ~/.fdg/fdg.db

// Seed the pool (only needed once)
client.participants.create({
  name: 'Alex',
  persona: 'A pragmatic strategist…',
  llmProvider: LlmProvider.OpenAI,
  llmModel: 'gpt-4o-mini',
});

const handle = client.startSession({
  topic: 'Should we rewrite the billing service?',
  goal: 'Decide: rewrite, refactor, or leave alone.',
  turnLimit: 12,
  host: {
    persona: 'A neutral facilitator…',
    llmProvider: LlmProvider.Anthropic,
    llmModel: 'claude-haiku-4-5',
  },
  participants: client.participants.list(),
});

handle.events.on('participant:spoke', ({ utterance }) => {
  console.log(`${utterance.speakerName}: ${utterance.content}`);
});

const summary = await handle.wait();
console.log(summary.recommendation);

client.close();
```

## API

### `createFdgClient(opts?)`

Bootstrap. Opens (or creates) the SQLite database and returns an `FdgClient`.

```ts
createFdgClient({
  dataDir?: string;      // defaults to ~/.fdg
  dbFileName?: string;   // defaults to "fdg.db"
}): FdgClient
```

### `FdgClient`

```ts
interface FdgClient {
  startSession(config: SessionConfig): SessionHandle;
  resumeSession(sessionId: string): ResumedSession | null;
  listSessions(): SessionRow[];
  getTranscript(sessionId: string): Utterance[];
  getSummary(sessionId: string): SessionSummary | null;
  getUsage(sessionId: string): SessionUsage;
  hasReplayData(sessionId: string): boolean;
  replaySession(sessionId: string, opts?: ReplayOptions): ReplayHandle;
  participants: ParticipantPoolApi;
  close(): void;
}
```

### `SessionHandle`

Returned by `startSession`. The run begins immediately; subscribe to events and `await handle.wait()` for the final summary.

```ts
interface SessionHandle {
  sessionId: string;
  events: EngineEventStream;
  submitWhisper(message: string): void;
  respondToTurnLimit(action: 'conclude' | 'extend', extraTurns?: number): void;
  wait(): Promise<SessionSummary>;
}
```

### `ReplayHandle`

Returned by `replaySession`. Replays a past session's events so UIs can render a turn-by-turn playback using the same event handlers they use for live sessions.

```ts
interface ReplayHandle {
  events: EngineEventStream;
  start(): void;
  stop(): void;
}
```

### `ParticipantPoolApi`

CRUD over the shared participant pool.

```ts
interface ParticipantPoolApi {
  list(): ParticipantDefinition[];
  create(input: ParticipantCreateInput): ParticipantDefinition;
  update(id: string, patch: ParticipantPatch): void;
  delete(id: string): void;
}
```

### `EngineEventStream`

A narrow, transport-agnostic typed stream — no wildcards, no once-listeners, no listener counts. Works for the in-process bus today; the same interface can wrap a WebSocket or IPC transport.

```ts
interface EngineEventStream {
  on<K extends keyof EngineEvents>(event: K, listener: (...args: EngineEvents[K]) => void): () => void; // returns unsubscribe
  off<K extends keyof EngineEvents>(event: K, listener: (...args: EngineEvents[K]) => void): void;
}
```

Event names (from `@fdg/contracts`): `phase:changed`, `host:speaking`, `host:spoke`, `participant:opening`, `participant:opened`, `bid:collecting`, `bid:received`, `bid:allReceived`, `host:evaluating`, `host:selected`, `participant:speaking`, `participant:spoke`, `host:checkpoint`, `whisper:received`, `whisper:acknowledged`, `turnLimit:reached`, `session:completed`, `error`.

## Building your own UI

Because the SDK is the only thing a UI depends on, a web or mobile client follows the same shape as the bundled TUI:

1. `createFdgClient()` at startup, `client.close()` at shutdown.
2. Use `client.participants` for pool management screens.
3. `startSession` returns a `SessionHandle`; wire `handle.events` into your renderer.
4. `resumeSession` + `replaySession` drive history views.

The in-process implementation is the reference. Alternate implementations of `FdgClient` (e.g. an HTTP client talking to a remote engine) can plug into the same UI without changes.
