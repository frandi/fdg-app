# Focus Discussion Group (FDG) App

## Product Requirements Document

**Version:** 1.0  
**Date:** April 16, 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 What Is FDG?

FDG is a multi-agent discussion simulator that allows a user to conduct structured focus group discussions where every participant is an LLM persona. The discussion follows a formal facilitation protocol led by a host agent — the user's representative — who moderates a turn-based, bid-driven conversation among user-defined participants.

### 1.2 Why It Exists

Running a focus group with real people is expensive, slow, and logistically complex. FDG lets a single user explore a topic from multiple perspectives — quickly, cheaply, and repeatably — by defining diverse personas that debate, challenge, and build on each other's ideas under the guidance of an intelligent facilitator.

### 1.3 Platform

The initial release targets a Terminal User Interface (TUI). The architecture should be designed for portability to web and mobile platforms in future iterations.

---

## 2. Core Concepts

### 2.1 Roles

There are three distinct roles in the system.

**User** — The human operator. She configures the session, observes the discussion, and can influence the host through the whisper mechanism. She does not participate in the discussion directly.

**Host** — An LLM agent acting as the user's proxy and facilitator. The host has a user-defined persona that shapes its moderation style. It opens the discussion, evaluates bids, grants the floor, steers the conversation toward the goal, and produces a summary when the discussion concludes.

**Participant** — An LLM agent with a distinct persona, background, expertise, or worldview. Participants listen to the discussion, formulate responses, submit bids to the host, and speak when granted the floor. Users can add as many participants as they want from a pre-configured pool.

### 2.2 Participant Pool

The participant pool is a library of pre-configured LLM personas. Each participant definition includes a name or label, a persona description (background, expertise, communication style, biases, worldview), and the LLM model to use (allowing mixing of different models or providers). Users can create custom participants and save them to the pool. Before a session starts, the user selects which participants from the pool to include.

### 2.3 Shared Transcript

The shared transcript is the single source of truth for the discussion. Every utterance — from the host's opening to each participant's contribution — is appended to this transcript. All agents (host and participants) consume the full transcript as context for their next action. The transcript grows monotonically throughout the session.

---

## 3. Session Lifecycle

### 3.1 Configuration Phase

The user performs the following setup steps before starting a discussion.

1. **Select participants** from the pool (minimum 2, no hard upper limit but practical constraints apply).
2. **Define or select a host persona** — the facilitation style, tone, and personality the host should embody.
3. **Provide a discussion topic** — the subject to be discussed.
4. **Provide a discussion goal** — what the discussion should achieve, converge toward, or produce.
5. **Set turn limit** — a default of 10 turns is pre-filled, but the user can adjust. This is the number of substantive speaking turns (the opening round does not count toward this limit).

### 3.2 Opening Round

Once the session starts, the host opens the discussion. This phase has two parts.

**Host Opening Statement.** The host frames the topic and goal for all participants, filtered through its persona. This is not a neutral relay of the user's input — the host interprets and presents the topic in its own style, potentially posing a provocative question or framing to stimulate differentiated responses.

**Participant First Impressions.** Each participant delivers a brief opening statement — a short, initial reaction or position on the topic. The order is sequential (e.g., in the order they were added to the session). These are short statements, not full arguments. The purpose is to plant flags so that subsequent bids are informed by each other's starting positions rather than generated in a vacuum.

After the opening round, the shared transcript contains the host's framing and every participant's initial position. The discussion now moves to the main loop.

### 3.3 Main Discussion Loop

The main discussion loop repeats until the host concludes the discussion or the turn limit is reached. Each iteration of the loop constitutes one "turn."

**Step 1 — Bid Generation.** Every participant ingests the current transcript and formulates a bid. A bid consists of a bid type and a brief summary (1–2 sentences describing what the participant intends to say).

The bid types are:

| Bid Type | Description |
|---|---|
| **New Point** | Introducing a new argument, perspective, or piece of information not yet raised. |
| **Direct Response** | Responding specifically to the previous speaker — agreeing, disagreeing, or building on their point. |
| **Counter** | Directly challenging or rebutting a specific claim made by another participant. |
| **Follow-up Question** | Asking a clarifying or probing question to another participant or the group. |
| **Synthesis** | Attempting to reconcile or connect multiple viewpoints that have been expressed. |
| **Redirect** | Suggesting the discussion is drifting and proposing a return to the core topic or goal. |

Bid generation should be lightweight — structured output (bid type + summary), not a full reasoning chain. This keeps token cost manageable since every participant bids every turn.

**Step 2 — Host Evaluation.** The host receives all bids and selects one participant to speak. The host's evaluation considers the following factors, in approximate priority order:

1. **Goal alignment** — Does this bid move the discussion closer to the stated goal?
2. **Relevance** — Is the bid on-topic and connected to the current thread of discussion?
3. **Novelty** — Does the bid introduce something that hasn't been said yet?
4. **Conversation flow** — Is a direct response or counter more natural here than a new point? The host should favor natural back-and-forth when it emerges.
5. **Diversity of voice** — Has this participant spoken recently? The host actively prevents any single participant from dominating. Quieter participants with relevant bids get a boost.
6. **Bid type balance** — The host avoids long runs of the same bid type (e.g., five "New Points" in a row without any synthesis or direct exchange).

The host does not simply pick the "best" bid in isolation. It makes a facilitation judgment about what the discussion needs *right now*.

**Step 3 — Speaking Turn.** The selected participant delivers their full response. This is the substantive contribution — the participant speaks freely, informed by the full transcript and their persona. The response is appended to the shared transcript.

**Step 4 — Host Checkpoint.** After the speaking turn, the host performs an internal assessment:

- **Progress check** — Are we closer to the goal? What remains unresolved?
- **Turn count check** — How many turns remain before the limit?
- **Whisper check** — Has the user sent a whisper since the last checkpoint? (See Section 3.5.)

Based on this assessment, the host decides one of three actions:

- **Continue** — Loop back to Step 1 for the next turn.
- **Narrow** — Continue, but first issue a steering statement that narrows the discussion topic to drive faster toward the goal. This statement is appended to the transcript before the next bid round.
- **Conclude** — Move to the Closing Phase (Section 3.4).

The host may also insert brief facilitation comments between turns (e.g., "Good point — does anyone see it differently?" or "Let's bring this back to the core question."). These are part of the host's role and are appended to the transcript.

### 3.4 Closing Phase

The closing phase is triggered by one of three events: the host decides the goal has been reached, the turn limit is reached, or the user whispers an instruction to conclude.

**Turn Limit Behavior.** When the turn limit is reached, the discussion pauses and the user is prompted: "The discussion has reached the turn limit. Would you like to conclude, or extend by N more turns?" The user can choose to conclude or specify additional turns. If extended, the new limit applies and the main loop resumes.

**Host Closing Statement.** The host delivers a closing remark that signals the end of the discussion to participants. This can summarize the trajectory of the conversation or acknowledge the key moments.

**Summary Report.** The host produces a structured summary report containing:

- **Topic and Goal** — Restating what was discussed and what was intended.
- **Key Positions** — A summary of each participant's core stance or contribution.
- **Points of Agreement** — Where participants converged.
- **Points of Contention** — Where participants disagreed and the nature of the disagreement.
- **Emerging Consensus** (if any) — Any conclusions or directions the group moved toward.
- **Unresolved Questions** — What remains open or unanswered.
- **Recommendation** (optional) — If the goal was decision-oriented, the host's assessment of the best path forward based on the discussion.

The summary report is the primary deliverable of the session. It should be exportable as a standalone document.

### 3.5 Whisper Mechanism

The whisper is the user's sole channel for influencing the discussion in progress. It operates as follows.

**Triggering a Whisper.** The user presses a dedicated whisper button in the UI. This action pauses the discussion loop. If a participant is currently mid-response (streaming), that response completes and is appended to the transcript. No new bid round begins until the whisper is processed.

**Composing the Whisper.** The user types a free-text instruction to the host. Examples of valid whispers:

- "Ask participant C what they think about cost implications."
- "The discussion is going off track — bring it back to the user experience angle."
- "Wrap it up in the next 2 turns."
- "I think participant A is dominating — let others speak."
- "Conclude the discussion now."

**Processing the Whisper.** The host ingests the whisper privately. Participants never see the whisper content. The host incorporates the instruction into its next checkpoint evaluation. The whisper takes effect on the next turn — the host may adjust its bid evaluation criteria, issue a steering statement, change topic focus, or initiate conclusion.

**Acknowledgment.** After processing, the discussion resumes. The host does not explicitly announce "I received a whisper," but the user should see a subtle UI confirmation that the whisper was delivered and processed.

---

## 4. Gameplay Workflow — End to End

This section provides a complete, linear walkthrough of a session from the user's perspective.

```
┌─────────────────────────────────────────────────────────┐
│                  CONFIGURATION PHASE                     │
│                                                         │
│  User selects participants from pool                    │
│  User defines/selects host persona                      │
│  User enters discussion topic + goal                    │
│  User sets turn limit (default: 10)                     │
│  User presses [Start Discussion]                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    OPENING ROUND                         │
│                                                         │
│  1. Host delivers opening statement                     │
│     (frames topic + goal in host's persona style)       │
│                                                         │
│  2. Each participant gives brief first impression        │
│     (sequential, short position statements)             │
│                                                         │
│  Transcript now contains: host framing + all            │
│  participants' opening positions                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               MAIN DISCUSSION LOOP                       │
│          (repeats until conclusion trigger)              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ STEP 1: BID GENERATION                            │  │
│  │ All participants read transcript → submit bid     │  │
│  │ Bid = { type, summary }                           │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ STEP 2: HOST EVALUATION                           │  │
│  │ Host receives all bids → evaluates on:            │  │
│  │   goal alignment, relevance, novelty,             │  │
│  │   conversation flow, diversity, bid type balance   │  │
│  │ Host selects one participant                      │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ STEP 3: SPEAKING TURN                             │  │
│  │ Selected participant delivers full response        │  │
│  │ Response appended to shared transcript            │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ STEP 4: HOST CHECKPOINT                           │  │
│  │ Host assesses: progress, turn count, whispers     │  │
│  │                                                   │  │
│  │   → Continue    (loop to Step 1)                  │  │
│  │   → Narrow      (steer + loop to Step 1)         │  │
│  │   → Conclude    (exit to Closing Phase)           │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│      [WHISPER BUTTON]    │  ◄── User can press at      │
│      pauses loop after   │      any time during the    │
│      current speaker     │      main loop              │
│      finishes            │                              │
└──────────────────────────┬──────────────────────────────┘
                           │
            (conclude trigger fires)
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    CLOSING PHASE                         │
│                                                         │
│  If triggered by turn limit:                            │
│    → Prompt user: "Conclude or extend by N turns?"      │
│    → If extend: return to Main Loop with new limit      │
│                                                         │
│  Host delivers closing statement                        │
│  Host generates Summary Report:                         │
│    • Topic & Goal restatement                           │
│    • Key positions per participant                      │
│    • Points of agreement                                │
│    • Points of contention                               │
│    • Emerging consensus (if any)                        │
│    • Unresolved questions                               │
│    • Recommendation (if goal is decision-oriented)      │
│                                                         │
│  Summary report is exportable                           │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Agent Design

### 5.1 Host Agent

The host agent operates with the following context at each decision point: the full shared transcript, the user-defined topic and goal, its own persona definition, any pending whisper from the user, and the current turn count vs. the turn limit.

The host's system prompt should encode the facilitation principles described in Section 3.3 Step 2 — goal alignment, diversity of voice, conversation flow, and so on. These principles are always active, but the relative weighting may shift as the discussion progresses (e.g., synthesis and convergence become more important as the turn limit approaches).

### 5.2 Participant Agent

Each participant agent operates with the following context: the full shared transcript, its own persona definition, and the current phase (bidding vs. speaking).

During the bidding phase, the participant receives a structured prompt asking for a bid type (from the defined set) and a 1–2 sentence summary. During the speaking phase, the participant receives the full transcript and is asked to deliver its substantive response. These are two separate inference calls with different system prompts — one lightweight, one full.

### 5.3 Context Management

As the transcript grows, context window limits become a constraint. The system should implement a strategy for managing this. In v1, a simple approach is acceptable: truncate older parts of the transcript while preserving the host's opening, each participant's opening statement, and the most recent N turns. The summary report generation should receive the full transcript (or a comprehensive condensed version) to avoid losing information.

---

## 6. User Interface (TUI)

### 6.1 Layout

The TUI should present a primary panel showing the live discussion transcript (scrollable), a participant panel showing the list of active participants with visual indicators of who is currently speaking or bidding, a status bar showing the current turn number, turn limit, and discussion phase, and a whisper button and input area.

### 6.2 Interaction Points

The user can interact at the following moments:

- **Before discussion** — Full configuration (participants, host, topic, goal, turn limit).
- **During discussion** — Whisper button only. The discussion streams in real time; the user reads and observes.
- **At turn limit** — Prompted to conclude or extend.
- **After discussion** — View and export the summary report. Optionally view or export the full transcript.

### 6.3 Visual Feedback

During bid generation, the UI should indicate that participants are "thinking." When the host selects a speaker, the selection should be briefly visible (e.g., "Host grants the floor to Participant B — Direct Response"). Whisper delivery should show a subtle confirmation. The speaking turn should stream in real time.

---

## 7. Data Model

### 7.1 Session

A session object contains a unique session ID, the discussion topic, the discussion goal, the host persona configuration, a list of participant persona configurations, the turn limit, the shared transcript (ordered list of utterances), collected bids per turn, whisper log, and the final summary report.

### 7.2 Utterance

Each utterance in the transcript contains a speaker identifier (host or participant ID), the content, a timestamp, and the utterance type (opening statement, facilitation comment, participant response, closing statement).

### 7.3 Bid

Each bid contains the participant ID, the bid type (one of the defined types), the summary text, and the turn number.

### 7.4 Whisper

Each whisper contains a timestamp, the user's message, and the turn number at which it takes effect.

---

## 8. Technical Considerations

### 8.1 LLM Integration

The system must support multiple LLM providers and models. Different participants can use different models. The host can use a different model than participants. API calls should be parallelized where possible — especially bid generation, where all participants bid simultaneously.

### 8.2 Structured Output

Bid generation should enforce structured output (JSON or equivalent) to ensure the bid type and summary are reliably parseable. The host's bid evaluation should also produce structured output indicating the selected participant and the reasoning.

### 8.3 Cost and Latency

Each turn incurs N+1 inference calls at minimum (N bids + 1 host evaluation), plus 1 for the speaking turn. The opening round incurs N calls. The summary report incurs 1 call. For a session with 5 participants and 10 turns, this is roughly 5 (opening) + 10 × (5 bids + 1 eval + 1 speak) = 75 inference calls, plus the summary. Bid generation calls should be small (short structured output). Speaking turns and summary generation will be larger. Parallelizing bid generation is critical for acceptable latency.

### 8.4 Portability

The core orchestration logic (session management, bid collection, host evaluation, transcript management) should be cleanly separated from the UI layer. The TUI is the first interface, but the same engine should be usable behind a web API or mobile app with minimal changes.

---

## 9. Scope Boundaries

### 9.1 In Scope for v1

- TUI application.
- Participant pool management (create, edit, delete personas).
- Host persona configuration.
- Full discussion lifecycle (configuration, opening, main loop, closing).
- Bid-driven turn management with bid types.
- Whisper mechanism with pause behavior.
- Turn limits with extension prompts.
- Summary report generation.
- Session transcript export.
- Support for multiple LLM providers/models.

### 9.2 Out of Scope for v1 (Future Iterations)

- Participant emoji or short reactions without needing the floor.
- Web and mobile interfaces.
- Real-time collaboration (multiple human users observing or whispering).
- Persistent session history and replay.
- Participant memory across sessions.
- Advanced context management (summarization-based compression).
- Host personality learning from user feedback.
- Automated participant pool suggestions based on topic.
- Branching discussions (exploring multiple paths from a decision point).

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Bid** | A lightweight submission from a participant indicating what they want to say and why, evaluated by the host before granting the floor. |
| **Bid Type** | A label categorizing the nature of a bid (e.g., New Point, Direct Response, Counter, Follow-up Question, Synthesis, Redirect). |
| **Host** | The LLM agent that facilitates the discussion on behalf of the user. |
| **Opening Round** | The initial phase where the host frames the discussion and each participant states a brief first impression. |
| **Participant** | An LLM agent with a defined persona that contributes to the discussion. |
| **Participant Pool** | A library of pre-configured participant personas available for selection. |
| **Session** | A single discussion instance from configuration through to summary report. |
| **Shared Transcript** | The ordered, append-only record of all utterances in a session. |
| **Turn** | One complete cycle of the main discussion loop (bid → evaluate → speak → checkpoint). |
| **Turn Limit** | The maximum number of speaking turns before the user is prompted to conclude or extend. |
| **Whisper** | A private message from the user to the host, invisible to participants, used to steer the discussion. |
