import {
  SessionPhase,
  UtteranceType,
  CheckpointAction,
} from '@fdg/contracts';
import type {
  LlmClientInterface,
  SessionConfig,
  SessionSummary,
} from '@fdg/contracts';
import { createLlmClient } from './llm/index.js';
import type { Database } from './db/index.js';
import { EngineEventBus } from './event-bus.js';
import { HostAgent } from './agents/host-agent.js';
import { ParticipantAgent } from './agents/participant-agent.js';
import { TranscriptManager } from './transcript/transcript-manager.js';
import { WhisperQueue } from './whisper/whisper-queue.js';
import { BidCollector } from './pipeline/bid-collector.js';
import { BidEvaluator } from './pipeline/bid-evaluator.js';
import { Speaker } from './pipeline/speaker.js';
import { Checkpoint } from './pipeline/checkpoint.js';

interface TurnLimitResponse {
  action: 'conclude' | 'extend';
  extraTurns?: number;
}

export class SessionOrchestrator {
  private sessionId: string;
  private hostAgent: HostAgent;
  private participantAgents: ParticipantAgent[];
  private transcriptManager: TranscriptManager;
  private whisperQueue: WhisperQueue;
  private bidCollector: BidCollector;
  private bidEvaluator: BidEvaluator;
  private speaker: Speaker;
  private checkpoint: Checkpoint;

  private currentTurn = 0;
  private turnLimit: number;
  private aborted = false;
  private turnLimitResolver: ((response: TurnLimitResponse) => void) | null =
    null;
  private nextUsageSeq = 0;

  constructor(
    private config: SessionConfig,
    private db: Database,
    readonly eventBus: EngineEventBus,
  ) {
    this.sessionId = db.sessions.create(config);
    this.turnLimit = config.turnLimit;

    this.attachEventPersister();

    const participantNames = new Map(
      config.participants.map((p) => [p.id, p.name]),
    );

    const hostLlmClient = createLlmClient(
      config.host.llmProvider,
      config.host.llmModel,
    );
    this.attachUsageSink(hostLlmClient);
    this.hostAgent = new HostAgent(config.host, hostLlmClient, participantNames);

    this.participantAgents = config.participants.map((p) => {
      const client = createLlmClient(p.llmProvider, p.llmModel);
      this.attachUsageSink(client);
      return new ParticipantAgent(p, client);
    });

    this.transcriptManager = new TranscriptManager(db, this.sessionId);
    this.whisperQueue = new WhisperQueue(db, this.sessionId);
    this.bidCollector = new BidCollector(eventBus);
    this.bidEvaluator = new BidEvaluator(eventBus);
    this.speaker = new Speaker(eventBus);
    this.checkpoint = new Checkpoint(eventBus);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  private attachUsageSink(client: LlmClientInterface): void {
    client.setUsageSink((record) => {
      this.db.llmUsage.insert({
        sessionId: this.sessionId,
        seq: this.nextUsageSeq++,
        turnNumber: this.currentTurn > 0 ? this.currentTurn : null,
        ...record,
      });
    });
  }

  private attachEventPersister(): void {
    const skip = new Set<string>([
      'host:speaking',
      'participant:opening',
      'participant:speaking',
      'error',
    ]);
    let seq = 0;
    this.eventBus.setPersister((type, payload) => {
      if (skip.has(type)) return;
      this.db.sessionEvents.insert(
        this.sessionId,
        seq++,
        Date.now(),
        type,
        payload,
      );
    });
  }

  async run(): Promise<SessionSummary> {
    try {
      // Opening Phase
      this.setPhase(SessionPhase.Opening);
      await this.runOpeningRound();

      // Main Discussion Loop
      this.setPhase(SessionPhase.MainLoop);
      await this.runMainLoop();

      // Closing Phase
      this.setPhase(SessionPhase.Closing);
      const summary = await this.runClosingPhase();

      this.setPhase(SessionPhase.Completed);
      this.db.sessions.setCompleted(this.sessionId);
      this.eventBus.emit('session:completed', { summary });

      return summary;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.eventBus.emit('error', { message, fatal: true });
      throw error;
    }
  }

  submitWhisper(message: string): void {
    const whisper = this.whisperQueue.enqueue(message, this.currentTurn);
    this.eventBus.emit('whisper:received', { whisper });
  }

  respondToTurnLimit(action: 'conclude' | 'extend', extraTurns?: number): void {
    this.turnLimitResolver?.({ action, extraTurns });
  }

  abort(): void {
    this.aborted = true;
  }

  private setPhase(phase: SessionPhase): void {
    this.db.sessions.updatePhase(this.sessionId, phase);
    this.eventBus.emit('phase:changed', { phase });
  }

  private async runOpeningRound(): Promise<void> {
    // Host opening statement
    let hostOpeningText = '';
    for await (const chunk of this.hostAgent.generateOpening(
      this.config.topic,
      this.config.goal,
    )) {
      hostOpeningText += chunk;
      this.eventBus.emit('host:speaking', { chunk });
    }

    const hostUtterance = this.transcriptManager.append(
      'host',
      'Host',
      UtteranceType.HostOpening,
      hostOpeningText,
      null,
    );
    this.eventBus.emit('host:spoke', { utterance: hostUtterance });

    // Each participant's opening statement (sequential, in seat order)
    for (const agent of this.participantAgents) {
      if (this.aborted) return;

      let openingText = '';
      for await (const chunk of agent.generateOpening(
        this.transcriptManager.getAll(),
      )) {
        openingText += chunk;
        this.eventBus.emit('participant:opening', {
          participantId: agent.definition.id,
          chunk,
        });
      }

      const utterance = this.transcriptManager.append(
        agent.definition.id,
        agent.definition.name,
        UtteranceType.ParticipantOpening,
        openingText,
        null,
      );
      this.eventBus.emit('participant:opened', {
        participantId: agent.definition.id,
        utterance,
      });
    }
  }

  private async runMainLoop(): Promise<void> {
    while (this.currentTurn < this.turnLimit && !this.aborted) {
      this.currentTurn++;
      this.db.sessions.incrementTurn(this.sessionId);

      // Step 1: Bid Generation (parallel)
      const transcript = this.transcriptManager.getWindow();
      const bids = await this.bidCollector.collectAll(
        this.participantAgents,
        transcript,
        this.currentTurn,
      );

      if (bids.length === 0 || this.aborted) break;

      // Persist bids
      for (const bid of bids) {
        this.db.bids.insert(
          this.sessionId,
          bid.turnNumber,
          bid.participantId,
          bid.bidType,
          bid.summary,
        );
      }

      // Step 2: Host Evaluation
      const whispers = this.whisperQueue.drain();
      const turnInfo = {
        turnNumber: this.currentTurn,
        turnLimit: this.turnLimit,
      };
      const evaluation = await this.bidEvaluator.evaluate(
        this.hostAgent,
        bids,
        transcript,
        whispers,
        turnInfo,
      );

      if (whispers.length > 0) {
        this.eventBus.emit('whisper:acknowledged', {});
      }

      // Step 3: Speaking Turn
      const selectedAgent = this.participantAgents.find(
        (a) => a.definition.id === evaluation.selectedParticipantId,
      );
      if (!selectedAgent) {
        this.eventBus.emit('error', {
          message: `Host selected unknown participant: ${evaluation.selectedParticipantId}`,
          fatal: false,
        });
        continue;
      }

      const selectedBid = bids.find(
        (b) => b.participantId === evaluation.selectedParticipantId,
      );
      await this.speaker.speak(
        selectedAgent,
        this.transcriptManager,
        selectedBid?.summary ?? '',
        this.currentTurn,
      );

      // Step 4: Host Checkpoint
      const checkpointWhispers = this.whisperQueue.drain();
      const checkpointResult = await this.checkpoint.run(
        this.hostAgent,
        this.transcriptManager,
        turnInfo,
        checkpointWhispers,
      );

      if (checkpointWhispers.length > 0) {
        this.eventBus.emit('whisper:acknowledged', {});
      }

      if (checkpointResult.action === CheckpointAction.Conclude) {
        break;
      }

      // Check turn limit
      if (this.currentTurn >= this.turnLimit) {
        this.eventBus.emit('turnLimit:reached', {
          currentTurn: this.currentTurn,
          limit: this.turnLimit,
        });

        const response = await new Promise<TurnLimitResponse>((resolve) => {
          this.turnLimitResolver = resolve;
        });
        this.turnLimitResolver = null;

        if (response.action === 'extend' && response.extraTurns) {
          this.turnLimit += response.extraTurns;
          this.db.sessions.updateTurnLimit(this.sessionId, this.turnLimit);
        } else {
          break;
        }
      }
    }
  }

  private async runClosingPhase(): Promise<SessionSummary> {
    // Host closing statement
    let closingText = '';
    for await (const chunk of this.hostAgent.generateClosing(
      this.transcriptManager.getAll(),
    )) {
      closingText += chunk;
      this.eventBus.emit('host:speaking', { chunk });
    }

    this.transcriptManager.append(
      'host',
      'Host',
      UtteranceType.HostClosing,
      closingText,
      null,
    );

    // Generate summary report (uses full transcript)
    const summary = await this.hostAgent.generateSummary(
      this.transcriptManager.getAll(),
      this.config.topic,
      this.config.goal,
    );

    // Persist summary
    this.db.summaryReports.insert(
      this.sessionId,
      JSON.stringify(summary, null, 2),
    );

    return summary;
  }
}
