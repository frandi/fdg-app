# FDG User Manual

Welcome to **FDG — Focus Discussion Group**, a tool that lets you run a simulated focus group where every participant is an AI persona. You set the topic, choose the personalities in the room, and watch them debate — all moderated by an AI host who works on your behalf.

This manual walks you through everything you can do, in the order you'll typically do it.

---

## 1. Starting the App

When you launch FDG from your terminal, one of two screens appears first:

- **If you've run sessions before** → the **Previous Sessions** browser opens.
- **If this is your first run** → you go straight to the **Configuration** screen.

The app runs in full-screen mode in your terminal. To quit at any time, press `Ctrl+C`.

### Previous Sessions screen

This is a list of every discussion you've finished before, with the date, topic, and number of turns.

| Key | What it does |
|---|---|
| `↑` / `↓` | Move the cursor up or down the list |
| `Enter` | Open the selected session (read-only) |
| `n` | Start a new session |
| `q` or `Esc` | Leave the browser and start a new session |
| Mouse wheel / `PgUp` / `PgDn` | Scroll through a long list |

Opening an old session lets you re-read the transcript, view the summary again, replay how it unfolded, or inspect the AI usage it cost you.

---

## 2. Configuring a New Session

Setting up a session is a short, step-by-step wizard. You fill in each step and press `Enter` to move forward.

### Step 0 — Restore previous config (optional)

If you ran a session recently, FDG remembers its setup and offers to reuse it:

- Press `y` to reuse the saved topic, goal, host persona, participants, and turn limit. You'll jump straight to the confirmation screen.
- Press `n` to start fresh.

### Step 1 — Select Participants

You see the **participant pool**: a list of AI personas you can invite. Each persona has a name, background, personality, and AI model attached.

| Key | What it does |
|---|---|
| `↑` / `↓` | Move the cursor between personas |
| `Space` | Add or remove the highlighted persona from the session |
| `m` | Open the pool manager (create / edit / delete personas) |
| `Enter` | Confirm and move on (requires at least 2 selected) |
| Mouse wheel / `PgUp` / `PgDn` | Scroll the list |

You need **at least two participants** for a discussion.

#### Managing the pool (press `m`)

The pool manager is where you shape your cast of personas. You can:

- Press `n` — **Create** a new persona. You'll be asked for a name, a persona description (their background, style, biases), an AI provider, and a model.
- Press `e` — **Edit** the highlighted persona.
- Press `d` — **Delete** the highlighted persona (you'll be asked to confirm with `y`/`n`).
- Press `Esc` — Go back to participant selection.

A good persona description is what makes the discussion interesting. Think about expertise, worldview, communication style, even biases — the more specific, the more distinct the voice.

### Step 2 — Host Persona

The **host** is your stand-in. It opens the discussion, picks who speaks next, steers the conversation, and writes the final summary. Its personality shapes the tone of the whole session.

A default persona is pre-filled ("A balanced, Socratic facilitator..."), but you can replace it with anything you want — a sharp, impatient moderator; a warm, curious interviewer; a corporate chairperson — whatever fits the discussion you're trying to run.

Press `Enter` to continue.

### Step 3 — Discussion Topic

What is the discussion about? One sentence or a short paragraph is enough. Press `Enter` to continue.

### Step 4 — Discussion Goal

What should the discussion **accomplish**? Are you trying to reach a decision? Surface disagreements? Explore a question from every angle? The host uses this goal to judge whether the conversation is progressing, so be specific.

Examples:
- "Decide whether to launch the feature in Q3 or delay to Q4."
- "Surface the strongest arguments for and against remote work."
- "Identify three concrete risks we haven't yet considered."

Press `Enter` to continue.

### Step 5 — Turn Limit

The **turn limit** caps how many substantive speaking turns the discussion runs for (the opening round doesn't count). The default is `10`. You can extend this later if you want, so there's no need to over-plan.

Press `Enter` to continue.

### Step 6 — Confirm and Start

You see a summary of everything you just set up. Press `Enter` to start the discussion.

---

## 3. The Discussion

Once you start, the discussion unfolds on its own. Here's what you'll see on screen and how you can interact.

### Layout

- **Status bar** (top) — current phase (opening, bidding, speaking, etc.), current turn number, and turn limit.
- **Transcript panel** (main, left) — every statement in the discussion, appended as it happens. The currently-speaking participant streams in real time.
- **Participant list** (right) — every participant, with a live indicator showing who is bidding, who's been selected to speak, and who is speaking.
- **Speaker banner** — briefly shows "Host grants the floor to X — [bid type]" when the host picks the next speaker.
- **Whisper bar** (bottom) — your one interactive control during the discussion.

### The flow of a turn

1. **Opening round** — The host delivers a framing statement, then each participant gives a short first impression.
2. **Main loop** — Each turn has four parts:
   - Every participant submits a short **bid** saying what they want to say and why.
   - The host **evaluates** the bids and picks one participant.
   - That participant **speaks** their full response (streaming in real time).
   - The host runs a **checkpoint** — decides whether to continue, narrow the focus, or conclude.
3. **Closing** — The host delivers a closing statement and produces a summary report.

You're a spectator — but a spectator with one privileged channel: **the whisper**.

### Whispering to the host

A whisper is a private message to the host that the participants never see. Use it to steer the discussion without breaking the fourth wall.

| Key | What it does |
|---|---|
| `Tab` | Open the whisper input |
| Type your message, then `Enter` | Send the whisper to the host |
| `Esc` | Cancel without sending |

When the host receives your whisper, a small "(delivered)" confirmation appears. The host factors your instruction into its next decision — usually within one turn.

Good whispers are direct and actionable. Examples:

- "Wrap this up in the next 2 turns."
- "Ask Maya what she thinks about the cost side."
- "Jordan is dominating — let the others in."
- "Bring the discussion back to the user experience angle."
- "Conclude the discussion now."

### Reaching the turn limit

When the discussion hits the turn limit you set, everything pauses and a prompt appears:

> **Turn limit reached (10/10)**  
> Type a number to extend by N turns, or `c` to conclude.

- Type a number (like `5`) and press `Enter` to keep going for that many more turns.
- Type `c` (or just press `Enter`) to conclude now.

---

## 4. After the Discussion — the Summary

When the discussion concludes, the host writes a structured summary covering:

- **Topic and Goal** — what was discussed and what you were aiming at.
- **Key Positions** — each participant's core stance.
- **Points of Agreement** — where the group converged.
- **Points of Contention** — where they clashed, and how.
- **Emerging Consensus** — any direction the group moved toward (if any).
- **Unresolved Questions** — what remains open.
- **Recommendation** — an optional best-path-forward if the goal was decision-oriented.

The screen then shows the concluded discussion with a prompt at the bottom:

| Key | What it does |
|---|---|
| `s` | Open the **Summary** screen |
| `r` | Open the **Replay** screen |
| `u` | Open the **AI Usage** screen |
| `Esc` | Exit this session (only when reviewing an old session) |

### Exporting (Summary screen)

On the Summary screen:

| Key | What it does |
|---|---|
| `e` | Export the full transcript and summary to a file |
| `Esc` | Go back to the concluded session |
| Mouse wheel / `PgUp` / `PgDn` / `g` / `G` | Scroll |

After exporting, the screen tells you exactly where the file was saved. Share it, archive it, or paste it into a report.

### Replaying

The Replay screen re-plays the discussion from the beginning as if it were happening live — useful when you want to re-watch the pacing or show it to someone else.

- `Esc` or `q` — Exit replay and return to the session.

(Note: replay only works for sessions recorded after the feature was added. Very old sessions will show a "no replay data" message.)

### AI Usage

The Usage screen breaks down how many AI calls and tokens the session cost, grouped by participant and by call type.

- `Esc` — Exit and return to the session.

---

## 5. Tips for Better Discussions

- **Write specific goals.** "Explore AI" is weak. "Decide whether we should build our own model or use an API" is strong. Specific goals give the host something concrete to push toward.
- **Pick contrasting personas.** Five pragmatists will bore each other. An innovator, a skeptic, and a humanist will spark.
- **Start with the default turn limit (10).** If the discussion is good, extend when prompted. If it's not, you've only lost 10 turns of tokens.
- **Use whispers sparingly.** Overuse defeats the purpose of simulation. Reserve them for when the discussion is clearly drifting or when you want to probe a specific thread.
- **The summary is the deliverable.** The live discussion is entertaining, but the exported summary is what you actually use. Make sure your goal is phrased in a way that forces a useful summary.

---

## 6. Quick Keyboard Reference

### Everywhere
- `Ctrl+C` — Quit the app
- `Esc` — Go back / cancel

### Previous Sessions
- `↑` `↓` navigate · `Enter` open · `n` new · `q` new · wheel/`PgUp`/`PgDn` scroll

### Configuration — Participants
- `↑` `↓` move · `Space` select · `m` manage pool · `Enter` confirm

### Pool Manager
- `n` new · `e` edit · `d` delete · `Esc` back

### Discussion
- `Tab` whisper · `Esc` (in whisper) cancel · (at turn limit) type `N` to extend or `c` to conclude

### Concluded / Review
- `s` summary · `r` replay · `u` usage · `Esc` exit

### Summary
- `e` export · `Esc` back · wheel/`PgUp`/`PgDn`/`g`/`G` scroll
