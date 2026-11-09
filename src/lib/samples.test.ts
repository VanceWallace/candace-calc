import { describe, expect, test } from '@jest/globals';

import { type CalcState, type Key, type Print, initialCalc, press } from './calculator';
import type { TapeEntry } from './tape';
import { makeSamples, tapeIntro, withoutTapeExamples } from './samples';

describe('makeSamples', () => {
  test.each([
    ['78.21-72.10=', ['78.21', '72.10', '6.11']],
    ['103.22-98.21=', ['103.22', '98.21', '5.01']],
    ['12.21-1.07=', ['12.21', '1.07', '11.14']],
  ])('%s is shown with the answer the calculator gives', (keys, expected) => {
    let state: CalcState = initialCalc;
    let print: Print | null = null;
    for (const k of keys) ({ state, print } = press(state, k as Key, { round2: true, now: 0 }));
    expect(print!.lines.map(([n]) => Number(n))).toEqual(expected.map(Number));

    const sample = makeSamples(0).find((s) => s.lines[0][0] === expected[0])!;
    expect(sample.lines.map(([n]) => n)).toEqual(expected);
    expect(sample.lines.map(([, m]) => m)).toEqual(print!.lines.map(([, m]) => m));
  });

  test('there are exactly the three examples, oldest first', () => {
    const samples = makeSamples(1e12);
    expect(samples).toHaveLength(3);
    expect([...samples].sort((a, b) => a.ts - b.ts)).toEqual(samples);
  });
});

describe('tapeIntro', () => {
  test('always explains the tape, and only mentions examples when they are showing', () => {
    expect(tapeIntro(true)).toBe('Your calculations print here when you press =. The entries below are examples.');
    expect(tapeIntro(false)).toBe('Your calculations print here when you press =.');
  });
});

describe('withoutTapeExamples', () => {
  test('removes sample entries while keeping real calculations', () => {
    const calculation: TapeEntry = {
      id: 'real',
      ts: 1,
      lines: [['10', '+'], ['2', '='], ['12', '*']],
    };

    expect(withoutTapeExamples([...makeSamples(0), calculation])).toEqual([calculation]);
  });
});
