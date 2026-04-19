/**
 * SDK smoke test — validates wiring without incurring LLM costs.
 *
 * Covers: bootstrap, participants CRUD, session queries, replay wiring.
 * Live session (startSession + LLM) is verified end-to-end in Phase 3
 * when the TUI is migrated onto the SDK.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LlmProvider } from '@fdg/contracts';
import { createFdgClient } from '../src/index.js';

const tmp = mkdtempSync(join(tmpdir(), 'fdg-sdk-smoke-'));
let ok = true;

function check(label: string, pass: boolean, detail?: string): void {
  const mark = pass ? 'OK ' : 'FAIL';
  console.log(`[${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!pass) ok = false;
}

try {
  const client = createFdgClient({ dataDir: tmp });

  // Participants CRUD
  const initialCount = client.participants.list().length;
  check('participants.list on fresh db', initialCount === 0, `got ${initialCount}`);

  const created = client.participants.create({
    name: 'Smoke Tester',
    persona: 'a test persona',
    llmProvider: LlmProvider.OpenAI,
    llmModel: 'gpt-test',
  });
  check('participants.create returns full definition', Boolean(created.id) && created.name === 'Smoke Tester');

  const afterCreate = client.participants.list();
  check('participants.list after create', afterCreate.length === 1);

  client.participants.update(created.id, { name: 'Renamed Tester' });
  const afterUpdate = client.participants.list();
  check('participants.update persists', afterUpdate[0]?.name === 'Renamed Tester');

  client.participants.delete(created.id);
  const afterDelete = client.participants.list();
  check('participants.delete removes row', afterDelete.length === 0);

  // Session queries on empty db
  const sessions = client.listSessions();
  check('listSessions on empty db', sessions.length === 0);

  const missing = client.resumeSession('nonexistent-id');
  check('resumeSession returns null for unknown id', missing === null);

  const missingReplay = client.hasReplayData('nonexistent-id');
  check('hasReplayData returns false for unknown id', missingReplay === false);

  // Replay wiring (no LLM calls; just validates handle shape)
  const handle = client.replaySession('nonexistent-id');
  check(
    'replaySession returns handle with events + start/stop',
    typeof handle.start === 'function' &&
      typeof handle.stop === 'function' &&
      typeof handle.events.on === 'function',
  );
  handle.stop();

  client.close();
  check('client.close completes without error', true);
} catch (err) {
  ok = false;
  console.error('[FAIL] smoke threw:', err);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (!ok) {
  console.error('\nSmoke test FAILED');
  process.exit(1);
}
console.log('\nSmoke test PASSED');
