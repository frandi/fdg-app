# FDG App — Implementation Gaps

**Date:** April 17, 2026  
**Based on:** Requirements (`docs/FDG_App_Requirements.md`) and Plan (`docs/implementation.md`) vs. actual code

---

## Critical — Address Immediately

These gaps block core v1 functionality explicitly listed in the requirements scope (Section 9.1).

### 1. No transcript/summary export

**Source:** Requirement gap  
**Requirement refs:** Section 3.4 ("exportable as a standalone document"), Section 6.2 ("view or export the full transcript"), Section 9.1 ("Session transcript export" in-scope for v1)

The `SummaryView` component renders the summary in the terminal, and the data is persisted in SQLite, but there is no user-facing way to export the summary report or full transcript to a file. After the session the user sees "Press Ctrl+C to exit" with no export option. This is the primary deliverable of a session per the requirements.

**What needs to happen:**
- Add an export action after session completion (e.g., save summary as Markdown, save full transcript)
- Wire it into the summary screen (e.g., key binding to write files to a user-chosen or default path)

### 2. No participant pool management in the TUI

**Source:** Requirement gap  
**Requirement refs:** Section 2.2 ("Users can create custom participants and save them to the pool"), Section 9.1 ("Participant pool management — create, edit, delete personas" in-scope for v1)

The `@fdg/db` package has full CRUD via `ParticipantPoolRepository`, but the TUI's `ConfigScreen` only allows selecting from existing participants. There is no screen or flow for creating, editing, or deleting personas. The only available personas are the 5 hardcoded defaults seeded by `@fdg/cli`.

**What needs to happen:**
- Add a pool management screen or flow in the TUI (create, edit, delete personas)
- Allow users to specify name, persona description, LLM provider, and model per the `ParticipantDefinition` type

---

## High — Address Before v1 Ship

These gaps affect correctness or user experience for features that are implemented but don't fully match the spec.

### 3. Whisper does not pause the discussion loop

**Source:** Requirement gap  
**Requirement refs:** Section 3.5 ("This action pauses the discussion loop. If a participant is currently mid-response, that response completes... No new bid round begins until the whisper is processed.")

The current implementation uses a fire-and-forget `WhisperQueue`: the user submits a whisper, it's enqueued, and it gets drained at the next bid evaluation or checkpoint step. The orchestrator loop never actually pauses. This means a whisper submitted during bid generation could be picked up a full turn later, and the user has no guarantee their instruction takes effect on the next turn.

**What needs to happen:**
- Add a pause mechanism to `SessionOrchestrator` (e.g., an async gate/barrier that `submitWhisper()` activates)
- The loop should check the gate between pipeline steps, wait for whisper composition to complete, then resume
- The whisper should be guaranteed to be consumed at the immediately next evaluation step

### 4. `host:checkpoint` event not handled in `useEngine`

**Source:** Plan vs. actual gap  
**Plan ref:** Section 4.5 ("`useEngine` hook subscribes to all `EngineEventBus` events")

The `host:checkpoint` event is defined in `EngineEvents` and emitted by the engine after every checkpoint, but `useEngine.ts` has no handler for it. This means:
- The UI never reflects whether the host decided to Continue, Narrow, or Conclude
- Host narrowing/steering statements are appended to the transcript (via `host:spoke`), but the checkpoint decision itself is invisible
- No visual feedback when the host narrows the discussion

**What needs to happen:**
- Add a `host:checkpoint` handler in `useEngine` that exposes the action and optional comment
- Optionally surface the checkpoint action in the `StatusBar` or as a brief notification

### 5. No dedicated host model selector in ConfigScreen

**Source:** Requirement gap (acknowledged as known issue in plan)  
**Requirement refs:** Section 3.1 ("Define or select a host persona"), Section 5.1 (host has its own context and persona)  
**Plan ref:** Section 9, Known Issues ("The CLI currently assigns the host the same provider/model as the first selected participant")

`ConfigScreen.tsx:126-129` copies `llmProvider` and `llmModel` from `selectedParticipants[0]`. The user edits the host persona text but cannot choose which model the host uses. If the first selected participant uses a weaker model, the host (the most important agent) inherits that.

**What needs to happen:**
- Add a host model/provider selector step in `ConfigScreen` (after the persona text input)
- Default to a sensible value but let the user override

---

## Low — Nice to Have

These are minor gaps or polish items. The app functions without them, but fixing them would improve fidelity to the spec and UX.

### 6. `bid:allReceived` and `host:evaluating` events not handled in `useEngine`

**Source:** Plan vs. actual gap  
**Plan ref:** Section 4.5, Section 6.3 ("the UI should indicate that participants are 'thinking'")

These events are defined in `EngineEvents` and emitted by the engine, but `useEngine.ts` has no handlers for them. The UI currently infers bidding state from bid count vs. participant count, which works but is imprecise. Handling these events would allow more accurate phase indicators (e.g., "Evaluating bids..." after all bids are in).

### 7. `turnLimitReached` state is never reset after extension

**Source:** Plan vs. actual gap

In `useEngine.ts`, the `turnLimit:reached` handler sets `turnLimitReached: true`, but after the user extends the turn limit via `TurnLimitPrompt`, this flag is never reset to `false`. If the extended limit is reached again, the state is already `true` so the prompt may not re-trigger correctly. A minor edge case but could cause a bug on extension.
