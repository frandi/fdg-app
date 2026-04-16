import type BetterSqlite3 from 'better-sqlite3';
import type { ParticipantDefinition, LlmProvider } from '@fdg/types';
import { randomUUID } from 'node:crypto';

export class ParticipantPoolRepository {
  constructor(private db: BetterSqlite3.Database) {}

  create(
    name: string,
    persona: string,
    llmProvider: LlmProvider,
    llmModel: string,
  ): string {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO participant_pool (id, name, persona, llm_provider, llm_model) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, name, persona, llmProvider, llmModel);
    return id;
  }

  update(
    id: string,
    fields: Partial<Pick<ParticipantDefinition, 'name' | 'persona' | 'llmProvider' | 'llmModel'>>,
  ): void {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (fields.name !== undefined) {
      sets.push('name = ?');
      values.push(fields.name);
    }
    if (fields.persona !== undefined) {
      sets.push('persona = ?');
      values.push(fields.persona);
    }
    if (fields.llmProvider !== undefined) {
      sets.push('llm_provider = ?');
      values.push(fields.llmProvider);
    }
    if (fields.llmModel !== undefined) {
      sets.push('llm_model = ?');
      values.push(fields.llmModel);
    }

    if (sets.length === 0) return;

    sets.push("updated_at = datetime('now')");
    values.push(id);

    this.db
      .prepare(`UPDATE participant_pool SET ${sets.join(', ')} WHERE id = ?`)
      .run(...values);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM participant_pool WHERE id = ?').run(id);
  }

  getById(id: string): ParticipantDefinition | undefined {
    const row = this.db
      .prepare('SELECT * FROM participant_pool WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;

    if (!row) return undefined;
    return this.toDefinition(row);
  }

  getAll(): ParticipantDefinition[] {
    const rows = this.db
      .prepare('SELECT * FROM participant_pool ORDER BY name')
      .all() as Record<string, unknown>[];

    return rows.map((row) => this.toDefinition(row));
  }

  private toDefinition(row: Record<string, unknown>): ParticipantDefinition {
    return {
      id: row.id as string,
      name: row.name as string,
      persona: row.persona as string,
      llmProvider: row.llm_provider as LlmProvider,
      llmModel: row.llm_model as string,
    };
  }
}
