import type { TapeLine } from './calculator';
import { DAY } from './format';

export interface TapeEntry {
  id: string;
  ts: number;
  lines: TapeLine[];
  /** Cleared with AC: printed, then torn through. Kept on the tape, never used in math. */
  voided?: boolean;
  /** Where the tear crosses the entry (% of its height) and the seed for its jagged shape. */
  rip?: { at: number; seed: number };
  sample?: boolean;
}

export type Retention = 30 | 60 | 90;

export function pruneHistory(history: TapeEntry[], retention: Retention, now = Date.now()): TapeEntry[] {
  const cutoff = now - retention * DAY;
  return history.filter((e) => e.ts >= cutoff);
}

/** Small deterministic PRNG, so a tear keeps its shape across launches. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRip(): { at: number; seed: number } {
  return { at: Math.round(38 + Math.random() * 24), seed: Math.floor(Math.random() * 2 ** 31) };
}
