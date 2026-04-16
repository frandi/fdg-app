---
name: FDG Project Overview
description: Architecture and package structure of the FDG multi-agent discussion simulator
type: project
---

FDG (Focus Discussion Group) is a multi-agent discussion simulator where LLM personas participate in structured, bid-driven focus group discussions moderated by a host agent. Requirements in docs/FDG_App_Requirements.md.

**Why:** Lets a single user explore topics from multiple AI perspectives quickly — cheaper and faster than real focus groups.

**How to apply:** All 6 packages are implemented. The dependency chain is cli → tui → engine → llm/db → types. When making changes, respect this layering.

**Architecture:** pnpm monorepo (pnpm-workspace.yaml), ESM-only, TypeScript strict, tsup builds.

| Package | Purpose |
|---------|---------|
| @fdg/types | Shared interfaces & enums |
| @fdg/llm | OpenAI + Anthropic abstraction, prompts, structured output schemas |
| @fdg/db | SQLite persistence (better-sqlite3, WAL mode), repository pattern |
| @fdg/engine | Orchestrator, host/participant agents, bid pipeline, event bus (eventemitter3), transcript & whisper management |
| @fdg/tui | React/Ink terminal UI — config, discussion, summary screens |
| @fdg/cli | Entry point (`fdg` command), inits DB at ~/.fdg/fdg.db, seeds 5 default participants |

**Env vars:** OPENAI_API_KEY, ANTHROPIC_API_KEY (loaded via dotenv in CLI).
