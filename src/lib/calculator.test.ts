import { describe, expect, test } from '@jest/globals';

import { type CalcState, type Key, type Print, applyRounding, initialCalc, press } from './calculator';
import { ago, group, roundCents, stampText, toStr } from './format';

/** Presses keys in order; returns the final state and everything printed. */
function run(keys: string, { round2 = true, start = initialCalc, now = 0 } = {}) {
  let state: CalcState = start;
  const prints: Print[] = [];
  let t = now;
  for (const k of tokens(keys)) {
    const r = press(state, k, { round2, now: (t += 1000) });
    state = r.state;
    if (r.print) prints.push(r.print);
  }
  return { state, prints, display: state.err ? 'ERROR' : group(state.entry) };
}

/** "12+3=" -> ['1','2','+','3','=']; multi-letter keys go in brackets: "5[NEG][AC]". */
function tokens(keys: string): Key[] {
  return (keys.match(/\[[A-Z]+\]|./g) ?? []).map((t) => t.replace(/[[\]]/g, '') as Key);
}

describe('arithmetic', () => {
  test('simple addition prints the whole calculation', () => {
    const { display, prints } = run('12+3=');
    expect(display).toBe('15');
    expect(prints).toEqual([{ lines: [['12', '+'], ['3', '='], ['15', '*']] }]);
  });

  test('chains left to right, no operator precedence (like a printing calculator)', () => {
    const { display, prints } = run('2+3*4=');
    expect(display).toBe('20');
    expect(prints[0].lines).toEqual([['2', '+'], ['3', '×'], ['4', '='], ['20', '*']]);
  });

  test('shows the running total after each operator', () => {
    expect(run('2+3*').display).toBe('5');
  });

  test('changing the operator before the next number replaces it on the tape', () => {
    const { prints } = run('9+-*4=');
    expect(prints[0].lines).toEqual([['9', '×'], ['4', '='], ['36', '*']]);
  });

  test('subtraction and division glyphs', () => {
    expect(run('1500-1725.4=').prints[0].lines).toEqual([['1500', '−'], ['1725.4', '='], ['-225.4', '*']]);
    expect(run('2400/12=').prints[0].lines).toEqual([['2400', '÷'], ['12', '='], ['200', '*']]);
  });

  test('a result can start the next calculation', () => {
    expect(run('2+3=*10=').display).toBe('50');
  });

  test('divide by zero shows ERROR and resets', () => {
    const r = run('5/0=');
    expect(r.display).toBe('ERROR');
    expect(r.prints).toEqual([]);
    expect(r.state.pending).toEqual([]);
    // next digit clears the error and starts fresh
    expect(run('7', { start: r.state }).display).toBe('7');
  });

  test('divide by zero mid-chain errors on the next operator', () => {
    expect(run('5/0+').display).toBe('ERROR');
  });
});

describe('rounding to 0.00', () => {
  test('on: results round to cents', () => {
    expect(run('10/3=').display).toBe('3.33');
    expect(run('0.1+0.2=').display).toBe('0.3');
  });

  test('on: the rounded value carries into the chain', () => {
    // 10 / 3 -> 3.33, then × 3 -> 9.99 (not 10)
    expect(run('10/3*3=').display).toBe('9.99');
  });

  test('on: typing stops at two decimal places', () => {
    expect(run('1.2345').display).toBe('1.23');
  });

  test('off: full precision, still without float noise', () => {
    expect(run('10/3=', { round2: false }).display).toBe('3.33333333333');
    expect(run('0.1+0.2=', { round2: false }).display).toBe('0.3');
    expect(run('1.2345', { round2: false }).display).toBe('1.2345');
  });

  test('roundCents rounds half away from zero without float slips', () => {
    expect(roundCents(1.005)).toBe(1.01);
    expect(roundCents(-1.005)).toBe(-1.01);
    expect(roundCents(2.675)).toBe(2.68);
    expect(roundCents(0.004)).toBe(0);
  });

  test('turning rounding on re-rounds a finished result', () => {
    const { state } = run('10/3=', { round2: false });
    expect(applyRounding(state, true).entry).toBe('3.33');
  });

  test('turning rounding on leaves a number being typed alone', () => {
    const { state } = run('1.2345', { round2: false });
    expect(applyRounding(state, true).entry).toBe('1.2345');
  });
});

describe('entry keys', () => {
  test('12 digit limit', () => {
    expect(run('1234567890123').state.entry).toBe('123456789012');
  });

  test('one decimal point; a leading point becomes 0.', () => {
    expect(run('.5.5').state.entry).toBe('0.55');
  });

  test('backspace', () => {
    expect(run('123[BK]').display).toBe('12');
    expect(run('5[BK]').display).toBe('0');
    expect(run('5[NEG][BK]').display).toBe('0');
  });

  test('backspace does not edit a result', () => {
    expect(run('12+3=[BK]').display).toBe('15');
  });

  test('+/- toggles the sign, but not on zero', () => {
    expect(run('5[NEG]').display).toBe('-5');
    expect(run('5[NEG][NEG]').display).toBe('5');
    expect(run('[NEG]').display).toBe('0');
  });

  test('percent divides by 100 and can be used in a calculation', () => {
    expect(run('50%').display).toBe('0.5');
    expect(run('200*15%=').display).toBe('30');
  });

  test('large numbers are grouped, huge ones go exponential', () => {
    expect(run('1234567*1000=').display).toBe('1,234,567,000');
    expect(run('999999999999*999999999999=').display).toBe('1.000000e24');
  });
});

describe('AC clears only the number being entered', () => {
  test('after a result: tears the typed number and shows the result again', () => {
    const r = run('100-10=50[AC]');
    expect(r.prints[1]).toEqual({ lines: [['50', '']], voided: true });
    expect(r.display).toBe('90');
    // = reprints 90; an operator works on 90
    expect(run('=', { start: r.state, now: 1e6 }).prints).toEqual([{ lines: [['90', '*']] }]);
    expect(run('-5=', { start: r.state }).display).toBe('85');
  });

  test('mid-calculation: shows the running total again and keeps the calculation', () => {
    const r = run('100-10-50[AC]');
    expect(r.prints).toEqual([{ lines: [['50', '']], voided: true }]);
    expect(r.display).toBe('90');
    expect(run('=', { start: r.state }).prints).toEqual([{ lines: [['100', '−'], ['10', '='], ['90', '*']] }]);
    expect(run('5=', { start: r.state }).display).toBe('85');
  });

  test('mid-calculation, the next operator replaces the dangling one', () => {
    const r = run('100-10-50[AC]+5=');
    expect(r.display).toBe('95');
    expect(r.prints[1].lines).toEqual([['100', '−'], ['10', '+'], ['5', '='], ['95', '*']]);
  });

  test('pressing AC again never throws the calculation away', () => {
    const r = run('12+34[AC][AC][AC]');
    expect(r.prints).toHaveLength(1);
    expect(r.state.op).toBe('+');
    expect(run('1=', { start: r.state }).display).toBe('13');
  });

  test('with no calculation running: clears the result off the display without printing', () => {
    const r = run('2+3=[AC]');
    expect(r.prints).toHaveLength(1); // just the calculation
    expect(r.display).toBe('0');
  });

  test('a typed number on a fresh calculator tears and goes back to 0', () => {
    const r = run('50[AC]');
    expect(r.prints).toEqual([{ lines: [['50', '']], voided: true }]);
    expect(r.display).toBe('0');
  });

  test('a typed 0 is cleared without printing', () => {
    expect(run('5+0[AC]').prints).toEqual([]);
  });

  test('clears a number changed with % or +/−', () => {
    expect(run('100-10=50%[AC]').display).toBe('90');
    expect(run('100-10=[NEG][AC]').display).toBe('90');
  });

  test('on a fresh calculator it prints nothing', () => {
    expect(run('[AC]').prints).toEqual([]);
  });

  test('after an error it just resets', () => {
    const r = run('5/0=[AC]');
    expect(r.prints).toEqual([]);
    expect(r.state.err).toBe(false);
    expect(r.display).toBe('0');
  });
});

describe('= right after an operator', () => {
  test('finishes with the running total', () => {
    const r = run('100-10-=');
    expect(r.display).toBe('90');
    expect(r.prints[0].lines).toEqual([['100', '−'], ['10', '='], ['90', '*']]);
  });

  test('an operator after % keeps the number % produced', () => {
    expect(run('200*15%+1=').display).toBe('31');
  });
});

describe('= reprints the result with a throttle', () => {
  test('= with nothing pending prints the current value as a total', () => {
    expect(run('42=').prints).toEqual([{ lines: [['42', '*']] }]);
  });

  test('after a calculation, two more reprints are free, then each waits longer', () => {
    let { state } = run('2+2=');
    const at = (now: number) => {
      const r = press(state, '=', { round2: true, now });
      state = r.state;
      return r.print !== null;
    };
    const t = state.lastRepeat;
    expect(at(t + 1)).toBe(true); // 2nd print
    expect(at(t + 2)).toBe(true); // 3rd print
    expect(at(t + 3)).toBe(false); // 4th must wait 100ms
    expect(at(t + 102)).toBe(true); // 4th
    expect(at(t + 250)).toBe(false); // 5th must wait 200ms
    expect(at(t + 302)).toBe(true); // 5th
  });

  test('any other key resets the throttle', () => {
    const { state } = run('2+2====');
    const r = run('[NEG][NEG]=', { start: state, now: state.lastRepeat });
    expect(r.prints).toHaveLength(1);
  });
});

describe('tape text', () => {
  test('timestamp', () => {
    const ts = new Date(2026, 9, 17, 13, 5).getTime();
    expect(stampText(ts, ts)).toBe('SAT OCT 17  1:05 PM');
    expect(stampText(new Date(2025, 0, 2, 0, 9).getTime(), ts)).toBe('THU JAN 2 2025  12:09 AM');
  });

  test('age labels', () => {
    const now = new Date(2026, 9, 17, 13, 0).getTime();
    expect(ago(now - 30_000, now)).toBe('JUST NOW');
    expect(ago(now - 5 * 60_000, now)).toBe('5 MIN AGO');
    expect(ago(now - 3 * 3_600_000, now)).toBe('TODAY');
    expect(ago(now - 26 * 3_600_000, now)).toBe('YESTERDAY');
    expect(ago(now - 8 * 86_400_000, now)).toBe('8 DAYS AGO');
    expect(ago(now - 34 * 86_400_000, now)).toBe('5 WEEKS AGO');
  });

  test('toStr rejects non-finite values', () => {
    expect(toStr(NaN, true)).toBeNull();
    expect(toStr(Infinity, false)).toBeNull();
  });
});
