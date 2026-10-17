import { DAY } from './format';
import type { TapeEntry } from './tape';

/** Example entries shown only until the first real calculation. */
export function makeSamples(now = Date.now()): TapeEntry[] {
  return [
    { id: 's1', ts: now - 34 * DAY - 3.2 * 3_600_000, lines: [['1240', '+'], ['86.5', '='], ['1326.5', '*']], sample: true },
    { id: 's2', ts: now - 8 * DAY - 6 * 3_600_000, lines: [['2400', '÷'], ['12', '='], ['200', '*']], sample: true },
    { id: 's3', ts: now - 1 * DAY - 2 * 3_600_000, lines: [['89.99', '×'], ['3', '='], ['269.97', '*']], sample: true },
    { id: 's4', ts: now - 40 * 60_000, lines: [['1500', '−'], ['1725.4', '='], ['-225.4', '*']], sample: true },
  ];
}
