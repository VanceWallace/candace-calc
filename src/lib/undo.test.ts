import { describe, expect, test } from '@jest/globals';

import { type CalcState, type Key, initialCalc, press } from './calculator';
import { UNDO_LIMIT, type UndoStep, recordUndo } from './undo';

/** A small model of the store: the calculator, its tape, and the undo history. */
function machine() {
  let calc: CalcState = initialCalc;
  let tape: { id: string; lines: string[][]; voided?: boolean }[] = [];
  let stack: UndoStep[] = [];
  let nextId = 0;

  const tap = (keys: string) => {
    for (const t of keys.match(/\[[A-Z]+\]|./g) ?? []) {
      const k = t.replace(/[[\]]/g, '') as Key;
      if (k === 'UNDO') {
        const step = stack[stack.length - 1];
        if (!step) continue;
        stack = stack.slice(0, -1);
        calc = step.calc;
        if (step.printed) tape = tape.filter((e) => e.id !== step.printed!.id);
        continue;
      }
      const r = press(calc, k, { round2: true, now: (nextId + 1) * 1e6 });
      let printed: UndoStep['printed'] = null;
      if (r.print) {
        const id = String(++nextId);
        tape = [...tape, { id, lines: r.print.lines, voided: r.print.voided }];
        printed = { id, lines: r.print.lines.length };
      }
      stack = recordUndo(stack, calc, r.state, printed);
      calc = r.state;
    }
  };
  return {
    tap,
    get calc() {
      return calc;
    },
    get tape() {
      return tape;
    },
    get depth() {
      return stack.length;
    },
  };
}

describe('undo', () => {
  test('takes back the last digit', () => {
    const m = machine();
    m.tap('123[UNDO]');
    expect(m.calc.entry).toBe('12');
  });

  test('takes back an operator', () => {
    const m = machine();
    m.tap('12+[UNDO]');
    expect(m.calc.op).toBeNull();
    expect(m.calc.pending).toEqual([]);
    m.tap('3=');
    expect(m.tape[0].lines).toEqual([['123', '*']]);
  });

  test('takes a calculation back off the tape and leaves it ready to finish', () => {
    const m = machine();
    m.tap('12+3=');
    expect(m.tape).toHaveLength(1);
    m.tap('[UNDO]');
    expect(m.tape).toEqual([]);
    expect(m.calc.entry).toBe('3');
    expect(m.calc.op).toBe('+');
    m.tap('4=');
    expect(m.tape[0].lines).toEqual([['12', '+'], ['34', '='], ['46', '*']]);
  });

  test('takes a torn number back off the tape and restores it to the display', () => {
    const m = machine();
    m.tap('50[AC]');
    expect(m.tape[0].voided).toBe(true);
    m.tap('[UNDO]');
    expect(m.tape).toEqual([]);
    expect(m.calc.entry).toBe('50');
    expect(m.calc.operand).toBe(true);
  });

  test('takes back a result cleared with AC, without touching the tape', () => {
    const m = machine();
    m.tap('2+3=[AC][UNDO]');
    expect(m.calc.entry).toBe('5');
    expect(m.tape).toHaveLength(1);
  });

  test('rewinds entries newest first and leaves older ones in place', () => {
    const m = machine();
    m.tap('1+1=2+2=[UNDO]');
    expect(m.tape).toHaveLength(1);
    expect(m.tape[0].lines[2]).toEqual(['2', '*']);
  });

  test('every press can be undone back to a fresh calculator', () => {
    const m = machine();
    const keys = '12+3=50[AC]';
    m.tap(keys);
    m.tap('[UNDO]'.repeat(keys.match(/\[[A-Z]+\]|./g)!.length));
    expect(m.calc).toEqual(initialCalc);
    expect(m.tape).toEqual([]);
    expect(m.depth).toBe(0);
  });

  test('undo with nothing to undo does nothing', () => {
    const m = machine();
    m.tap('[UNDO][UNDO]');
    expect(m.calc).toEqual(initialCalc);
  });

  test('a key that changed nothing does not use up an undo', () => {
    const m = machine();
    m.tap('5[AC][AC]');
    expect(m.depth).toBe(2);
  });

  test('the history is capped, dropping the oldest steps', () => {
    const m = machine();
    m.tap('1[BK]'.repeat(UNDO_LIMIT));
    expect(m.depth).toBe(UNDO_LIMIT);
  });
});
