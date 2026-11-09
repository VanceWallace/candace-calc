import { DAY } from './format';
import type { TapeEntry } from './tape';

/** Example entries shown only until the first real calculation. */
export function makeSamples(now = Date.now()): TapeEntry[] {
  return [
    { id: 's1', ts: now - 8 * DAY - 6 * 3_600_000, lines: [['78.21', '−'], ['72.10', '='], ['6.11', '*']], sample: true },
    { id: 's2', ts: now - 1 * DAY - 2 * 3_600_000, lines: [['103.22', '−'], ['98.21', '='], ['5.01', '*']], sample: true },
    { id: 's3', ts: now - 40 * 60_000, lines: [['12.21', '−'], ['1.07', '='], ['11.14', '*']], sample: true },
  ];
}

/** The note at the top of the tape. It only mentions examples while some are showing. */
export function tapeIntro(showingSamples: boolean): string {
  return 'Your calculations print here when you press =.' + (showingSamples ? ' The entries below are examples.' : '');
}

/** Remove only the illustrative entries, preserving any real calculations on the tape. */
export function withoutTapeExamples(entries: TapeEntry[]): TapeEntry[] {
  return entries.filter((entry) => !entry.sample);
}
