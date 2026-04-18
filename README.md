# FDG — Focus Discussion Group

A multi-agent discussion simulator. You define a topic, a goal, and a cast of LLM personas; a host agent facilitates a turn-based, bid-driven debate among them and delivers a structured summary at the end.

Think of it as a focus group where every participant is an LLM — useful for exploring a question from multiple perspectives quickly, cheaply, and repeatably.

## How it works

1. **Configure** — pick participants from the pool, define a host persona, enter a topic and goal, set a turn limit.
2. **Opening round** — the host frames the discussion; each participant gives a short first impression.
3. **Main loop** — every turn, participants submit lightweight *bids* (New Point, Counter, Synthesis, etc.); the host picks who speaks based on goal alignment, novelty, and diversity of voice.
4. **Whisper** — at any point you can privately nudge the host (e.g. "wrap up soon", "let participant C speak more").
5. **Closing** — the host produces an exportable summary report covering positions, agreements, contentions, and unresolved questions.
6. **After** — browse past sessions, replay them turn-by-turn, or inspect token usage.

See `docs/USER_MANUAL.md` for a step-by-step walkthrough, or `docs/FDG_App_Requirements.md` for the full spec.

## Packages

| Package | Role |
|---|---|
| `@fdg/cli` | Entry point — binary `fdg` |
| `@fdg/tui` | Terminal UI (Ink + React) |
| `@fdg/engine` | Session orchestration, bid evaluation, host logic |
| `@fdg/llm` | Provider adapters (OpenAI, Anthropic) |
| `@fdg/db` | SQLite persistence (participant pool, sessions) |
| `@fdg/types` | Shared types |

## Try it

**Requirements:** Node ≥ 22, pnpm ≥ 10.

```bash
pnpm install
cp .env.example .env          # add your OPENAI_API_KEY / ANTHROPIC_API_KEY
pnpm build
pnpm --filter @fdg/cli dev    # or: node packages/cli/dist/index.js
```

On first run, a default participant pool is seeded and data is stored in `~/.fdg/fdg.db`.

## Status

v1 targets the TUI. Web and mobile are on the roadmap — the engine is intentionally decoupled from the UI layer.
