import type { ParticipantDefinition, Utterance, Bid } from '@fdg/contracts';
import type { LlmClientInterface } from '../internal-types.js';
import {
  buildBidSystemPrompt,
  buildBidUserPrompt,
  buildSpeakSystemPrompt,
  buildSpeakUserPrompt,
  buildParticipantOpeningSystemPrompt,
  buildParticipantOpeningUserPrompt,
  formatTranscript,
  bidSchema,
} from '../llm/index.js';

interface RawBid {
  bidType: string;
  summary: string;
}

export class ParticipantAgent {
  readonly definition: ParticipantDefinition;

  constructor(
    definition: ParticipantDefinition,
    private llmClient: LlmClientInterface,
  ) {
    this.definition = definition;
  }

  async *generateOpening(transcript: Utterance[]): AsyncIterable<string> {
    const systemPrompt = buildParticipantOpeningSystemPrompt(this.definition);
    const userPrompt = buildParticipantOpeningUserPrompt(
      formatTranscript(transcript),
    );

    yield* this.llmClient.generateStream({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 400,
      metadata: {
        actor: `participant:${this.definition.id}`,
        callType: 'opening',
      },
    });
  }

  async generateBid(
    transcript: Utterance[],
    turnNumber: number,
  ): Promise<Bid> {
    const systemPrompt = buildBidSystemPrompt(this.definition);
    const userPrompt = buildBidUserPrompt(formatTranscript(transcript));

    const raw = await this.llmClient.generateStructured<RawBid>({
      systemPrompt,
      userPrompt,
      schema: bidSchema,
      temperature: 0.3,
      maxTokens: 150,
      metadata: {
        actor: `participant:${this.definition.id}`,
        callType: 'bid',
      },
    });

    return {
      participantId: this.definition.id,
      bidType: raw.bidType as Bid['bidType'],
      summary: raw.summary,
      turnNumber,
    };
  }

  async *speak(
    transcript: Utterance[],
    bidSummary: string,
  ): AsyncIterable<string> {
    const systemPrompt = buildSpeakSystemPrompt(this.definition);
    const userPrompt = buildSpeakUserPrompt(
      formatTranscript(transcript),
      bidSummary,
    );

    yield* this.llmClient.generateStream({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 800,
      metadata: {
        actor: `participant:${this.definition.id}`,
        callType: 'speak',
      },
    });
  }
}
