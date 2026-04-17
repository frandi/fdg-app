import type {
  HostDefinition,
  LlmClientInterface,
  Utterance,
  Bid,
  BidEvaluation,
  Whisper,
  SessionSummary,
  CheckpointAction,
} from '@fdg/types';
import {
  buildHostOpeningSystemPrompt,
  buildHostOpeningUserPrompt,
  buildHostEvaluateSystemPrompt,
  buildHostEvaluateUserPrompt,
  buildHostCheckpointSystemPrompt,
  buildHostCheckpointUserPrompt,
  buildHostClosingSystemPrompt,
  buildHostClosingUserPrompt,
  buildHostSummarySystemPrompt,
  buildHostSummaryUserPrompt,
  formatTranscript,
  formatBids,
  evaluationSchema,
  checkpointSchema,
  summarySchema,
} from '@fdg/llm';

export interface CheckpointResult {
  action: CheckpointAction;
  comment: string | null;
}

export interface TurnInfo {
  turnNumber: number;
  turnLimit: number;
}

export class HostAgent {
  constructor(
    private definition: HostDefinition,
    private llmClient: LlmClientInterface,
    private participantNames: Map<string, string>,
  ) {}

  async *generateOpening(topic: string, goal: string): AsyncIterable<string> {
    const systemPrompt = buildHostOpeningSystemPrompt(this.definition);
    const userPrompt = buildHostOpeningUserPrompt(topic, goal);

    yield* this.llmClient.generateStream({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 400,
    });
  }

  async evaluateBids(
    bids: Bid[],
    transcript: Utterance[],
    whispers: Whisper[],
    turnInfo: TurnInfo,
  ): Promise<BidEvaluation> {
    const systemPrompt = buildHostEvaluateSystemPrompt(this.definition);
    const userPrompt = buildHostEvaluateUserPrompt(
      formatTranscript(transcript),
      formatBids(bids, this.participantNames),
      whispers,
      turnInfo.turnNumber,
      turnInfo.turnLimit,
    );

    return this.llmClient.generateStructured<BidEvaluation>({
      systemPrompt,
      userPrompt,
      schema: evaluationSchema,
      temperature: 0.2,
      maxTokens: 300,
    });
  }

  async checkpoint(
    transcript: Utterance[],
    turnInfo: TurnInfo,
    whispers: Whisper[],
  ): Promise<CheckpointResult> {
    const systemPrompt = buildHostCheckpointSystemPrompt(this.definition);
    const userPrompt = buildHostCheckpointUserPrompt(
      formatTranscript(transcript),
      turnInfo.turnNumber,
      turnInfo.turnLimit,
      whispers,
    );

    return this.llmClient.generateStructured<CheckpointResult>({
      systemPrompt,
      userPrompt,
      schema: checkpointSchema,
      temperature: 0.2,
      maxTokens: 200,
    });
  }

  async *generateClosing(transcript: Utterance[]): AsyncIterable<string> {
    const systemPrompt = buildHostClosingSystemPrompt(this.definition);
    const userPrompt = buildHostClosingUserPrompt(formatTranscript(transcript));

    yield* this.llmClient.generateStream({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 400,
    });
  }

  async generateSummary(
    transcript: Utterance[],
    topic: string,
    goal: string,
  ): Promise<SessionSummary> {
    const systemPrompt = buildHostSummarySystemPrompt(this.definition);
    const userPrompt = buildHostSummaryUserPrompt(
      formatTranscript(transcript),
      topic,
      goal,
    );

    return this.llmClient.generateStructured<SessionSummary>({
      systemPrompt,
      userPrompt,
      schema: summarySchema,
      temperature: 0.3,
      maxTokens: 2000,
    });
  }
}
