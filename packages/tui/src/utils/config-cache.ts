import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CACHE_PATH = join(homedir(), '.fdg', 'last-config.json');

export interface CachedConfig {
  participantIds: string[];
  hostPersona: string;
  topic: string;
  goal: string;
  turnLimit: number;
}

export function loadCachedConfig(): CachedConfig | null {
  try {
    const data = readFileSync(CACHE_PATH, 'utf-8');
    return JSON.parse(data) as CachedConfig;
  } catch {
    return null;
  }
}

export function saveCachedConfig(config: CachedConfig): void {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch {
    // Silently fail — cache is a convenience, not critical
  }
}
