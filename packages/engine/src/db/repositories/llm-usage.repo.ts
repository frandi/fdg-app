import type BetterSqlite3 from 'better-sqlite3';
import {
  LlmProvider,
  type LlmCallType,
  type SessionUsage,
  type UsageBucket,
} from '@fdg/contracts';
import type { LlmUsageRow } from '../../internal-types.js';

const CALL_TYPES: LlmCallType[] = [
  'opening',
  'bid',
  'speak',
  'evaluate_bids',
  'checkpoint',
  'closing',
  'summary',
];

function emptyBucket(): UsageBucket {
  return { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

function addToBucket(bucket: UsageBucket, row: LlmUsageRow): void {
  bucket.calls += 1;
  bucket.inputTokens += row.inputTokens;
  bucket.outputTokens += row.outputTokens;
  bucket.totalTokens += row.inputTokens + row.outputTokens;
}

export class LlmUsageRepository {
  constructor(private db: BetterSqlite3.Database) {}

  insert(row: LlmUsageRow): void {
    this.db
      .prepare(
        `INSERT INTO llm_usage (
           session_id, seq, timestamp_ms, turn_number, actor, call_type,
           provider, model, input_tokens, output_tokens,
           cache_read_tokens, cache_creation_tokens
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        row.sessionId,
        row.seq,
        row.timestampMs,
        row.turnNumber,
        row.actor,
        row.callType,
        row.provider,
        row.model,
        row.inputTokens,
        row.outputTokens,
        row.cacheReadTokens,
        row.cacheCreationTokens,
      );
  }

  getBySession(sessionId: string): LlmUsageRow[] {
    const rows = this.db
      .prepare(
        `SELECT seq, timestamp_ms, turn_number, actor, call_type,
                provider, model, input_tokens, output_tokens,
                cache_read_tokens, cache_creation_tokens
         FROM llm_usage
         WHERE session_id = ?
         ORDER BY seq`,
      )
      .all(sessionId) as Record<string, unknown>[];

    return rows.map((row) => ({
      sessionId,
      seq: row.seq as number,
      timestampMs: row.timestamp_ms as number,
      turnNumber: row.turn_number as number | null,
      actor: row.actor as string,
      callType: row.call_type as LlmCallType,
      provider: row.provider as LlmProvider,
      model: row.model as string,
      inputTokens: row.input_tokens as number,
      outputTokens: row.output_tokens as number,
      cacheReadTokens: row.cache_read_tokens as number | null,
      cacheCreationTokens: row.cache_creation_tokens as number | null,
    }));
  }

  aggregateBySession(sessionId: string): SessionUsage {
    const rows = this.getBySession(sessionId);

    const totals = emptyBucket();
    const byActor: Record<string, UsageBucket> = {};
    const byCallType = Object.fromEntries(
      CALL_TYPES.map((ct) => [ct, emptyBucket()]),
    ) as Record<LlmCallType, UsageBucket>;
    const byModel: Record<string, UsageBucket & { provider: LlmProvider }> = {};

    let cacheReadTokens = 0;
    let cacheCreationTokens = 0;
    let largestCall: SessionUsage['largestCall'] = null;
    let speakCount = 0;
    let speakTokens = 0;

    for (const row of rows) {
      addToBucket(totals, row);

      byActor[row.actor] ??= emptyBucket();
      addToBucket(byActor[row.actor], row);

      byCallType[row.callType] ??= emptyBucket();
      addToBucket(byCallType[row.callType], row);

      byModel[row.model] ??= {
        ...emptyBucket(),
        provider: row.provider,
      };
      addToBucket(byModel[row.model], row);

      cacheReadTokens += row.cacheReadTokens ?? 0;
      cacheCreationTokens += row.cacheCreationTokens ?? 0;

      const rowTotal = row.inputTokens + row.outputTokens;
      if (!largestCall || rowTotal > largestCall.totalTokens) {
        largestCall = {
          actor: row.actor,
          callType: row.callType,
          model: row.model,
          totalTokens: rowTotal,
        };
      }

      if (row.callType === 'speak') {
        speakCount += 1;
        speakTokens += rowTotal;
      }
    }

    return {
      totals,
      cacheReadTokens,
      cacheCreationTokens,
      byActor,
      byCallType,
      byModel,
      largestCall,
      speakCount,
      speakAvgTokens: speakCount > 0 ? Math.round(speakTokens / speakCount) : 0,
    };
  }
}
