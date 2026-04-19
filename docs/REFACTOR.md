# Refactor Scratchpad

> Living document for the SDK refactor. Deleted at Phase 5.

Full plan: `/home/frandi/.claude/plans/let-s-formalize-the-plan-velvety-frost.md`

## Target state

```
packages/
  contracts/   renamed from types; pruned to cross-boundary DTOs
  engine/      absorbs db + llm as internal modules
  sdk/         new — FdgClient + SessionHandle + ReplayHandle
  tui/         depends on sdk + contracts only
  cli/         thin bootstrap
```

## TUI → engine/db surface (the SDK's definition-of-done)

### Session lifecycle (App.tsx, DiscussionScreen.tsx)
- `new EngineEventBus()`, `new SessionOrchestrator(config, db, bus)`
- `orchestrator.run()`, `.getSessionId()`, `.respondToTurnLimit(action, extraTurns)`, `.submitWhisper(message)`

### Event stream (useEngine.ts) — 14 events
phase:changed, host:speaking, host:spoke, participant:opening, participant:opened, bid:collecting, bid:received, host:selected, participant:speaking, participant:spoke, turnLimit:reached, whisper:acknowledged, session:completed, error

### Replay (ReplayScreen.tsx)
- `new SessionReplayer(sessionId, db, bus, opts)`, `.start()`, `.stop()` — same event shape as live

### DB surface used by TUI + CLI
- sessions: getById, getParticipants, listCompletedWithSummary
- summaryReports.getBySession
- utterances.getBySession
- llmUsage.aggregateBySession
- sessionEvents.getBySession
- participants: getAll, create, update, delete
- `new Database(path)`, `db.close()` (bootstrap)

## Target SDK surface

```ts
createFdgClient(opts: { dataDir?: string }): FdgClient

interface FdgClient {
  startSession(config: SessionConfig): SessionHandle
  resumeSession(sessionId: string): ResumedSession
  listSessions(): SessionSummaryRow[]
  getTranscript(sessionId: string): Utterance[]
  getSummary(sessionId: string): SessionSummary | null
  getUsage(sessionId: string): UsageAggregate
  hasReplayData(sessionId: string): boolean
  replaySession(sessionId: string, opts?): ReplayHandle
  participants: { list, create, update, delete }
  close(): void
}

interface SessionHandle {
  sessionId: string
  events: TypedEventStream<EngineEvents>
  submitWhisper(message): void
  respondToTurnLimit(action, extraTurns?): void
  wait(): Promise<SessionSummary>
}

interface ReplayHandle {
  events: TypedEventStream<EngineEvents>
  start(): void
  stop(): void
}
```

## Checkpoint log

- **🟢 Checkpoint 0** (baseline): `pnpm -r build` ✅, `pnpm -r typecheck` ✅ on `develop` off `main` @ 0583e11.
- **🟢 Checkpoint 1** (types → contracts rename): `pnpm -r build` ✅, `pnpm -r typecheck` ✅. 45 source files + 5 package.json + 2 doc files updated.
- **🟢 Checkpoint 2** (@fdg/sdk scaffolded): `pnpm -r build` ✅, `pnpm -r typecheck` ✅, `pnpm --filter @fdg/sdk smoke` ✅ (10/10 assertions). SDK surface: `createFdgClient`, `FdgClient`, `SessionHandle`, `ReplayHandle`, `ParticipantPoolApi`, `TypedEventStream`. TUI untouched; existing flows unaffected. Live-session path (startSession+LLM) pending user verification via TUI run; covered by Phase 3 migration.
