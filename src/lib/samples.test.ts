import { describe, expect, test } from '@jest/globals';

import type { TapeEntry } from './tape';
import { makeSamples, withoutTapeExamples } from './samples';

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
