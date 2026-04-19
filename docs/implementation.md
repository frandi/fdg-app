# FDG App — Implementation Plan

**Version:** 1.0  
**Date:** April 17, 2026  
**Status:** In Progress

---

## 1. Overview

This document describes the implementation plan for the FDG (Focus Discussion Group) application. It covers the monorepo structure, package responsibilities, build sequencing, and the concrete tasks needed to bring the app to a working v1.

The tech stack is a **TypeScript pnpm workspace monorepo** targeting a terminal interface. The core engine is designed to be UI-agnostic so it can be ported to web or mobile in future iterations.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript 5.x (strict) | Type safety across all packages |
| Runtime | Node.js v22 | Latest LTS, native ESM support |
| Package manager | pnpm workspaces | Fast installs, strict dependency isolation |
| Build tool | tsup | Zero-config bundler, fast DTS generation |
| LLM providers | OpenAI SDK + Anthropic SDK | Per-participant model selection |
| Database | better-sqlite3 | Embedded SQLite, synchronous API, no setup |
| TUI framework | Ink 5 (React for CLI) | Component model, streaming-friendly |
| Event bus | eventemitter3 | Typed events, zero deps, fast |

---

## 3. Monorepo Structure

```
fdg-app/
  pnpm-workspace.yaml
  package.json              ← root scripts: build, typecheck
  tsconfig.base.json        ← shared TS config (ES2022, strict, bundler resolution)
  .env                      ← OPENAI_API_KEY, ANTHROPIC_API_KEY (not committed)
  .env.example              ← template (committed)
  .gitignore
  .npmrc                    ← onlyBuiltDependencies for better-sqlite3, esbuild
  docs/
    FDG_App_Requirements.md
    implementation.md       ← this file
  packages/
    contracts/              @fdg/contracts
    llm/                    @fdg/llm
    db/                     @fdg/db
    engine/                 @fdg/engine
    tui/                    @fdg/tui
    cli/                    @fdg/cli
```

### Package Dependency Graph

```
@fdg/cli
  └── @fdg/tui
        └── @fdg/engine
              ├── @fdg/llm
              │     └── @fdg/contracts
              └── @fdg/db
                    └── @fdg/contracts
```

All packages depend on `@fdg/contracts`. No circular dependencies.

---

## 4. Package Details

### 4.1 `@fdg/contracts`

Zero-runtime shared types. No dependencies.

| File | Contents |
|---|---|
| `enums.ts` | `BidType`, `SessionPhase`, `UtteranceType`, `CheckpointAction`, `LlmProvider` |
| `agent.ts` | `ParticipantDefinition`, `HostDefinition` |
| `session.ts` | `SessionConfig`, `SessionState`, `SessionSummary` |
| `transcript.ts` | `Utterance` |
| `bid.ts` | `Bid`, `BidEvaluation`, `BidCollection` |
| `whisper.ts` | `Whisper` |
| `llm.ts` | `LlmClientInterface`, `StructuredRequest`, `StreamRequest`, `TextRequest` |
| `events.ts` | `EngineEvents` — typed event map (engine ↔ UI contract) |

**Status:** ✅ Complete

---

### 4.2 `@fdg/llm`

LLM provider abstraction. Handles structured output, streaming, and prompt assembly.

**Key exports:**
- `createLlmClient(provider, model)` → `LlmClientInterface`
- `OpenAIClient`, `AnthropicClient`
- Prompt builders: `buildBidSystemPrompt`, `buildHostEvaluateSystemPrompt`, etc.
- Schemas: `bidSchema`, `evaluationSchema`, `checkpointSchema`, `summarySchema`

**Structured output strategy:**
- OpenAI → `response_format: { type: "json_schema" }`
- Anthropic → tool calling with a single forced tool

**Streaming:**
- Both providers return `AsyncIterable<string>` from `generateStream()`

**Status:** ✅ Complete

---

### 4.3 `@fdg/db`

SQLite persistence via better-sqlite3. Repository pattern.

**Tables:**

| Table | Purpose |
|---|---|
| `participant_pool` | Persistent persona library |
| `sessions` | One row per discussion session |
| `session_participants` | Junction: session ↔ participant definitions |
| `utterances` | Append-only shared transcript |
| `bids` | All bids submitted per turn |
| `whispers` | User-to-host private messages |
| `summary_reports` | Final markdown/JSON report per session |

**Repositories:** `ParticipantPoolRepository`, `SessionRepository`, `UtteranceRepository`, `BidRepository`, `WhisperRepository`, `SummaryReportRepository`

**Database class** manages connection, WAL mode, foreign keys, and runs migrations on open.

**Data path:** `~/.fdg/fdg.db`

**Status:** ✅ Complete

---

### 4.4 `@fdg/engine`

UI-agnostic orchestration engine. Communicates exclusively via `EngineEventBus`.

#### State Machine

```
Configuring → Opening → MainLoop → Closing → Completed
                            ↑          ↓
                            └─ extend ─┘
```

#### `SessionOrchestrator` public API

```typescript
new SessionOrchestrator(config, db, eventBus)
run(): Promise<SessionSummary>           // drives full lifecycle
submitWhisper(message: string): void     // enqueue whisper mid-session
respondToTurnLimit(action, extraTurns?)  // resolve turn limit prompt
abort(): void                            // cancel session
getSessionId(): string
```

#### Pipeline (per turn)

1. **BidCollector** — `Promise.allSettled` across all participants (parallel)
2. **BidEvaluator** — single host structured LLM call, drains whisper queue
3. **Speaker** — streams selected participant's response, appends to transcript
4. **Checkpoint** — host structured call → Continue / Narrow / Conclude

#### Agents

- `HostAgent` — opening, bid evaluation, checkpoint, closing, summary
- `ParticipantAgent` — opening, bid generation, speaking

#### Context Management

`context-window.ts` truncation strategy:
1. Always keep: host opening + all participant openings (anchors)
2. Always keep: most recent utterances until token budget is exhausted
3. Middle section dropped oldest-first when over budget
4. Summary generation receives **full** untruncated transcript

Token estimate: `Math.ceil(text.length / 4)`

#### Whisper Pattern

`WhisperQueue` enqueues on `submitWhisper()`, drains at **bid evaluation** and **checkpoint** steps. No explicit engine loop pause needed — the loop is sequential async.

**Status:** ✅ Complete

---

### 4.5 `@fdg/tui`

Ink 5 (React for CLI) terminal interface.

#### Screens

| Screen | Trigger |
|---|---|
| `ConfigScreen` | App start |
| `DiscussionScreen` | After user presses Start |
| `SummaryView` | After `session:completed` event |

#### Components

| Component | Purpose |
|---|---|
| `TranscriptPanel` | Scrollable transcript, color-coded by speaker type |
| `ParticipantList` | Sidebar with status indicators (idle / bidding / selected / speaking) |
| `StatusBar` | Turn counter, phase label, bid indicator |
| `WhisperInput` | Tab-triggered overlay input |
| `SpeakerBanner` | "Host grants floor to X — reasoning" |
| `TurnLimitPrompt` | Conclude or extend dialog |
| `SummaryView` | Structured summary display |

#### `useEngine` hook

Subscribes to all `EngineEventBus` events and maps them to React state. Sole bridge between engine and UI.

#### TUI Layout (DiscussionScreen)

```
┌─ StatusBar: Turn 3/10 | Phase: Main Discussion ────────────┐
├─────────────────────────────────────────┬──────────────────┤
│ TranscriptPanel (scrollable)            │ Participants     │
│                                         │                  │
│ [Host] Good evening. Today we...        │ > Alex (talking) │
│ [Alex] I think the key issue is...      │ ~ Maya (bid)     │
│ [Maya] I'd challenge that by...         │ ○ Jordan         │
│ [Host] Interesting — does anyone... ▋   │ ○ Sam            │
│                                         │ ~ Riley (bid)    │
├─────────────────────────────────────────┴──────────────────┤
│ Host grants floor to Maya — Direct Response                 │
├─────────────────────────────────────────────────────────────┤
│ [Tab] Whisper to host                                       │
└─────────────────────────────────────────────────────────────┘
```

**Participant status indicators:**
- `○` — Idle
- `~` — Has submitted a bid
- `*` — Selected by host
- `>` — Currently speaking (streaming)

**Status:** ✅ Complete

---

### 4.6 `@fdg/cli`

Binary entry point. Composition root.

**Responsibilities:**
1. Load `.env` (dotenv)
2. Ensure `~/.fdg/` directory exists
3. Open `Database` at `~/.fdg/fdg.db`
4. Seed default participant pool if empty (5 pre-defined personas)
5. Render Ink `<App>` component
6. Close DB on exit

**Default personas seeded:**

| Name | Archetype | Provider |
|---|---|---|
| Alex (Pragmatist) | Business strategy, ROI focus | OpenAI gpt-4o |
| Maya (Innovator) | Creative technologist, bold ideas | OpenAI gpt-4o |
| Jordan (Skeptic) | Devil's advocate, evidence-driven | Anthropic claude-sonnet |
| Sam (Humanist) | UX researcher, ethics, accessibility | Anthropic claude-sonnet |
| Riley (Systems Thinker) | Operations, second-order effects | OpenAI gpt-4o |

**Run command:** `pnpm --filter @fdg/cli dev`

**Status:** ✅ Complete

---

## 5. Token Cost Reference

| LLM Call | `maxTokens` | `temperature` | Notes |
|---|---|---|---|
| Bid generation | 150 | 0.3 | Structured output, lightweight |
| Host bid evaluation | 300 | 0.2 | Structured output |
| Host checkpoint | 200 | 0.2 | Structured output |
| Speaking turn | 800 | 0.7 | Streamed |
| Opening statement (host) | 400 | 0.7 | Streamed |
| Opening statement (participant) | 400 | 0.7 | Streamed |
| Closing statement | 400 | 0.7 | Streamed |
| Summary report | 2000 | 0.3 | Full transcript, structured output |

**Per-session estimate (5 participants, 10 turns):**
- Opening: 1 host + 5 participants = 6 calls
- Per turn: 5 bids + 1 evaluation + 1 speak + 1 checkpoint = 8 calls
- Total turns: 10 × 8 = 80 calls
- Closing: 1 closing + 1 summary = 2 calls
- **Total: ~88 LLM calls**

---

## 6. Data Flow: One Full Turn

```
SessionOrchestrator.runMainLoop()
  │
  ├─ 1. BidCollector.collectAll(participants, transcript, turnNumber)
  │       ├─ [parallel] ParticipantAgent.generateBid() × N
  │       │     ├─ buildBidSystemPrompt(persona)
  │       │     ├─ buildBidUserPrompt(formattedTranscript)
  │       │     └─ llmClient.generateStructured<Bid>(bidSchema)
  │       ├─ emit 'bid:received' per participant
  │       └─ emit 'bid:allReceived'
  │
  ├─ 2. BidEvaluator.evaluate(host, bids, transcript, whispers, turnInfo)
  │       ├─ whisperQueue.drain()
  │       ├─ buildHostEvaluateSystemPrompt(hostPersona)
  │       ├─ buildHostEvaluateUserPrompt(transcript, bids, whispers, turnInfo)
  │       ├─ llmClient.generateStructured<BidEvaluation>(evaluationSchema)
  │       └─ emit 'host:selected'
  │
  ├─ 3. Speaker.speak(selectedAgent, transcriptManager, bidSummary, turnNumber)
  │       ├─ buildSpeakSystemPrompt(persona)
  │       ├─ buildSpeakUserPrompt(formattedTranscript, bidSummary)
  │       ├─ llmClient.generateStream() → AsyncIterable<string>
  │       ├─ emit 'participant:speaking' per chunk
  │       ├─ transcriptManager.append(utterance)
  │       └─ emit 'participant:spoke'
  │
  └─ 4. Checkpoint.run(host, transcriptManager, turnInfo, whispers)
          ├─ whisperQueue.drain()
          ├─ buildHostCheckpointSystemPrompt(hostPersona)
          ├─ buildHostCheckpointUserPrompt(transcript, turnInfo, whispers)
          ├─ llmClient.generateStructured<CheckpointResult>(checkpointSchema)
          ├─ emit 'host:checkpoint'
          ├─ if Narrow → transcriptManager.append(HostNarrow utterance)
          └─ if Conclude → break main loop
```

---

## 7. Build & Run

### Prerequisites

- Node.js v22
- pnpm (install via `npm install -g pnpm` with Node v22 active)
- API keys in `.env`

### Setup

```bash
pnpm install
pnpm -r build           # build all packages in dependency order
```

> **Note:** better-sqlite3 requires native compilation. If it fails on install,
> run manually from the better-sqlite3 package directory:
> `npm run build-release`

### Development

```bash
pnpm --filter @fdg/cli dev    # run with tsx (no build step)
```

### Production

```bash
pnpm -r build
node packages/cli/dist/index.js
```

---

## 8. What's Left (Future Work)

These items are explicitly **out of scope for v1** per the requirements but are candidates for future iterations:

| Feature | Notes |
|---|---|
| Web interface | Engine is already UI-agnostic; add a REST/WebSocket adapter |
| Mobile interface | Same engine, different renderer |
| Persistent session history | DB schema already captures everything; add a sessions list screen |
| Session replay | Full transcript is persisted; replay by re-emitting events |
| Participant emoji reactions | Lightweight reactions without needing the floor |
| Advanced context management | Summarization-based compression instead of truncation |
| Participant memory across sessions | Cross-session persona state |
| Host learning from feedback | Adjust facilitation style based on user ratings |
| Branching discussions | Checkpoint → fork into multiple paths |
| Automated pool suggestions | Suggest personas based on topic using a meta-LLM call |
| Real-time multi-user | Multiple human observers / whisperers |
| Export formats | PDF / Markdown export of summary report |

---

## 9. Known Issues & Watchpoints

| Item | Detail |
|---|---|
| `better-sqlite3` native build | Requires build tools (Python, node-gyp, MSVC on Windows). Must be built manually if pnpm doesn't run install scripts. |
| Corepack on NVM | pnpm must be installed via `npm install -g pnpm` per Node version when using NVM on Windows. |
| Ink + Windows terminal | Ink renders best in Windows Terminal. Legacy `cmd.exe` may have rendering issues. |
| Context window size | Default limit is 16,000 estimated tokens. Adjust in `transcript-manager.ts` if using models with larger context windows. |
| Host model default | The CLI currently assigns the host the same provider/model as the first selected participant. A dedicated host model selector should be added to `ConfigScreen`. |
| `useInput` conflict | `ConfigScreen` and `WhisperInput` both call `useInput`. Ensure only the active component captures input at any given time (Ink handles this naturally by component tree). |
