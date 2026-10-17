import { describe, expect, test } from '@jest/globals';

import { demoRemaining, describeLimits } from './demo';

describe('demo limits', () => {
  const limits = { calcs: 10, seconds: 60 };

  test('the clock does not run until the first key press', () => {
    const r = demoRemaining(limits, { calcs: 0, startedAt: null }, 1e9);
    expect(r).toEqual({ calcsLeft: 10, msLeft: 60_000, over: false });
  });

  test('ends after the last allowed calculation', () => {
    expect(demoRemaining(limits, { calcs: 9, startedAt: 0 }, 1000).over).toBe(false);
    expect(demoRemaining(limits, { calcs: 10, startedAt: 0 }, 1000).over).toBe(true);
  });

  test('ends when the time runs out', () => {
    expect(demoRemaining(limits, { calcs: 2, startedAt: 0 }, 59_999).over).toBe(false);
    expect(demoRemaining(limits, { calcs: 2, startedAt: 0 }, 60_000)).toEqual({ calcsLeft: 8, msLeft: 0, over: true });
  });

  test('a zero limit means unlimited', () => {
    const r = demoRemaining({ calcs: 0, seconds: 60 }, { calcs: 500, startedAt: 0 }, 1000);
    expect(r.calcsLeft).toBe(Infinity);
    expect(r.over).toBe(false);
  });

  test('describes the limits', () => {
    expect(describeLimits(limits)).toBe('10 calculations or 1 minute');
    expect(describeLimits({ calcs: 0, seconds: 90 })).toBe('90 seconds');
    expect(describeLimits({ calcs: 5, seconds: 0 })).toBe('5 calculations');
  });
});
