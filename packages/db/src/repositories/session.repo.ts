import type BetterSqlite3 from 'better-sqlite3';
import type { SessionConfig, SessionPhase, ParticipantDefinition } from '@fdg/types';
import { randomUUID } from 'node:crypto';

export interface SessionRow {
  id: string;
  topic: string;
  goal: string;
  turnLimit: number;
  hostPersona: string;
  hostLlmProvider: string;
  hostLlmModel: string;
  phase: SessionPhase;
  currentTurn: number;
  createdAt: string;
  completedAt: string | null;
}

export class SessionRepository {
  constructor(private db: BetterSqlite3.Database) {}

  create(config: SessionConfig): string {
    const id = randomUUID();

    const insertSession = this.db.prepare(
      `INSERT INTO sessions (id, topic, goal, turn_limit, host_persona, host_llm_provider, host_llm_model)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertParticipant = this.db.prepare(
      `INSERT INTO session_participants (session_id, participant_id, name, persona, llm_provider, llm_model, seat_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    const transaction = this.db.transaction(() => {
      insertSession.run(
        id,
        config.topic,
        config.goal,
        config.turnLimit,
        config.host.persona,
        config.host.llmProvider,
        config.host.llmModel,
      );

      config.participants.forEach((p: ParticipantDefinition, index: number) => {
        insertParticipant.run(
          id,
          p.id,
          p.name,
          p.persona,
          p.llmProvider,
          p.llmModel,
          index,
        );
      });
    });

    transaction();
    return id;
  }

  updatePhase(sessionId: string, phase: SessionPhase): void {
    this.db
      .prepare('UPDATE sessions SET phase = ? WHERE id = ?')
      .run(phase, sessionId);
  }

  incrementTurn(sessionId: string): number {
    this.db
      .prepare('UPDATE sessions SET current_turn = current_turn + 1 WHERE id = ?')
      .run(sessionId);

    const row = this.db
      .prepare('SELECT current_turn FROM sessions WHERE id = ?')
      .get(sessionId) as { current_turn: number };

    return row.current_turn;
  }

  updateTurnLimit(sessionId: string, newLimit: number): void {
    this.db
      .prepare('UPDATE sessions SET turn_limit = ? WHERE id = ?')
      .run(newLimit, sessionId);
  }

  setCompleted(sessionId: string): void {
    this.db
      .prepare("UPDATE sessions SET phase = 'completed', completed_at = datetime('now') WHERE id = ?")
      .run(sessionId);
  }

  getById(sessionId: string): SessionRow | undefined {
    const row = this.db
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(sessionId) as Record<string, unknown> | undefined;

    if (!row) return undefined;

    return {
      id: row.id as string,
      topic: row.topic as string,
      goal: row.goal as string,
      turnLimit: row.turn_limit as number,
      hostPersona: row.host_persona as string,
      hostLlmProvider: row.host_llm_provider as string,
      hostLlmModel: row.host_llm_model as string,
      phase: row.phase as SessionPhase,
      currentTurn: row.current_turn as number,
      createdAt: row.created_at as string,
      completedAt: row.completed_at as string | null,
    };
  }

  getParticipants(sessionId: string): ParticipantDefinition[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM session_participants WHERE session_id = ? ORDER BY seat_order',
      )
      .all(sessionId) as Record<string, unknown>[];

    return rows.map((row) => ({
      id: row.participant_id as string,
      name: row.name as string,
      persona: row.persona as string,
      llmProvider: row.llm_provider as string as ParticipantDefinition['llmProvider'],
      llmModel: row.llm_model as string,
    }));
  }
}
