import type { CalcState } from './calculator';

/** One undoable key press: how the calculator stood before it, and what it printed. */
export interface UndoStep {
  calc: CalcState;
  printed: { id: string; lines: number } | null;
}

export const UNDO_LIMIT = 200;

const SETTLED_KEYS = ['entry', 'acc', 'op', 'fresh', 'operand', 'base', 'err', 'pending'] as const;

/** Compares what the user can see or build on, ignoring the = reprint throttle's counters. */
function sameCalc(a: CalcState, b: CalcState): boolean {
  return SETTLED_KEYS.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
}

/** Adds a key press to the history, unless it changed nothing and printed nothing. */
export function recordUndo(
  stack: UndoStep[],
  before: CalcState,
  after: CalcState,
  printed: UndoStep['printed']
): UndoStep[] {
  if (!printed && sameCalc(before, after)) return stack;
  return [...stack, { calc: before, printed }].slice(-UNDO_LIMIT);
}
