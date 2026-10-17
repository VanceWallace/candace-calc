import { MAX_DIGITS, OP_GLYPH, type Op, toStr } from './format';

export type Key =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.'
  | Op
  | '=' | 'AC' | 'BK' | 'NEG' | '%';

/** One printed line: the number and its trailing mark (+ − × ÷ =, '*' for a total, '' for none). */
export type TapeLine = [num: string, mark: string];

/** What the calculator asks the printer to print. */
export interface Print {
  lines: TapeLine[];
  /** Cleared by AC: printed, then torn through. */
  voided?: boolean;
}

export interface CalcState {
  entry: string; // what the user is typing / showing
  acc: number | null; // running value
  op: Op | null; // pending operator
  fresh: boolean; // next digit starts a new number
  /** A number has been typed or changed (digits, %, +/−) since the last operator, = or AC. */
  operand: boolean;
  /** What the display showed before that number was started; AC goes back to it. */
  base: string;
  err: boolean;
  pending: TapeLine[]; // tape lines for the calculation in progress
  repeatCount: number; // reprints of the current result (for the = throttle)
  lastRepeat: number;
}

export interface PressOptions {
  round2: boolean;
  /** Milliseconds; only used to throttle repeated = reprints. */
  now: number;
}

export interface PressResult {
  state: CalcState;
  print: Print | null;
}

export const initialCalc: CalcState = {
  entry: '0',
  acc: null,
  op: null,
  fresh: true,
  operand: false,
  base: '0',
  err: false,
  pending: [],
  repeatCount: 0,
  lastRepeat: -1e9,
};

export const isOp = (k: string): k is Op => k === '+' || k === '-' || k === '*' || k === '/';

export function press(prev: CalcState, k: Key, { round2, now }: PressOptions): PressResult {
  const s: CalcState = { ...prev, pending: prev.pending.map((l) => [...l] as TapeLine) };
  let print: Print | null = null;
  const current = () => parseFloat(s.entry);
  const fmt = (n: number) => toStr(n, round2);

  const error = () => {
    Object.assign(s, { err: true, entry: '0', acc: null, op: null, fresh: true, operand: false, base: '0', pending: [] });
  };
  /** Marks the display as holding a number the user is entering. */
  const startOperand = () => {
    if (!s.operand) s.base = s.entry;
    s.operand = true;
  };

  if (k !== '=') s.repeatCount = 0;
  if (s.err && k !== 'AC') s.err = false;

  if (/^[0-9.]$/.test(k)) {
    // ---- digit ----
    startOperand();
    if (s.fresh) {
      s.entry = k === '.' ? '0.' : k;
      s.fresh = false;
    } else if (k === '.' && s.entry.includes('.')) {
      // one decimal point
    } else if (round2 && k !== '.' && /\.\d\d$/.test(s.entry)) {
      // max two decimal places
    } else if (s.entry.replace(/[-.]/g, '').length >= MAX_DIGITS) {
      // digit limit
    } else if (s.entry === '0' && k !== '.') {
      s.entry = k;
    } else if (s.entry === '-0' && k !== '.') {
      s.entry = '-' + k;
    } else {
      s.entry += k;
    }
  } else if (isOp(k)) {
    // ---- operator ----
    if (s.op && !s.operand && s.pending.length) {
      // operator changed before entering the next number
      s.pending[s.pending.length - 1][1] = OP_GLYPH[k];
      s.op = k;
    } else {
      const cur = current();
      const curStr = fmt(cur)!;
      if (s.op && s.acc !== null) {
        const rs = fmt(apply(s.acc, s.op, cur));
        if (rs === null) {
          error();
          return { state: s, print };
        }
        s.pending.push([curStr, OP_GLYPH[k]]);
        s.acc = parseFloat(rs); // carry the same (rounded) value the tape shows
        s.entry = rs;
      } else {
        s.pending.push([curStr, OP_GLYPH[k]]);
        s.acc = cur;
      }
      s.op = k;
      s.fresh = true;
      s.operand = false;
    }
  } else if (k === '=') {
    if (!s.op || s.acc === null) {
      // = with nothing pending reprints the result. The same result prints up to 3 times
      // freely; after that each reprint must wait longer (0.1s, 0.2s, ...) so the tape can't flood.
      if (!s.err) {
        const wait = s.repeatCount < 3 ? 0 : (s.repeatCount - 2) * 100;
        if (now - s.lastRepeat >= wait) {
          s.repeatCount++;
          s.lastRepeat = now;
          print = { lines: [[fmt(current())!, '*']] };
          s.fresh = true;
        }
      }
    } else {
      let rs: string | null;
      if (!s.operand) {
        // = straight after an operator (or after AC cleared the next number) finishes with the
        // running total: "100 − 10 − =" prints 100 −, 10 =, 90.
        rs = fmt(s.acc);
        s.pending[s.pending.length - 1][1] = '=';
      } else {
        const cur = current();
        rs = fmt(apply(s.acc, s.op, cur));
        if (rs !== null) s.pending.push([fmt(cur)!, '=']);
      }
      if (rs === null) {
        error();
      } else {
        s.pending.push([rs, '*']);
        print = { lines: s.pending };
        Object.assign(s, { pending: [], acc: null, op: null, entry: rs, fresh: true, operand: false });
        s.repeatCount = 1; // the calculation itself is the first print
        s.lastRepeat = now;
      }
    }
  } else if (k === 'AC') {
    // AC clears only the number being entered: it prints and tears that number, and the display
    // goes back to what it showed before (the running total or the last result). A calculation
    // in progress is never thrown away.
    if (s.err) {
      Object.assign(s, { ...initialCalc, repeatCount: s.repeatCount, lastRepeat: s.lastRepeat });
    } else if (s.operand) {
      if (current() !== 0) print = { lines: [[fmt(current())!, '']], voided: true };
      s.entry = s.op && s.acc !== null ? fmt(s.acc)! : s.base;
      s.fresh = true;
      s.operand = false;
    } else if (!s.op) {
      // nothing being entered and no calculation running: clear the result off the display
      s.entry = '0';
      s.fresh = true;
    }
  } else if (k === 'BK') {
    if (!s.fresh) {
      s.entry = s.entry.length > 1 && s.entry !== '-0' ? s.entry.slice(0, -1) : '0';
      if (s.entry === '-') s.entry = '0';
    }
  } else if (k === 'NEG') {
    if (s.entry !== '0') {
      startOperand();
      s.entry = s.entry.startsWith('-') ? s.entry.slice(1) : '-' + s.entry;
    }
  } else if (k === '%') {
    const r = fmt(current() / 100);
    if (r !== null) {
      startOperand();
      s.entry = r;
      s.fresh = true;
    }
  }

  return { state: s, print };
}

/** Turning "Round to 0.00" on re-rounds a finished result already on the display. */
export function applyRounding(s: CalcState, round2: boolean): CalcState {
  if (!round2 || !s.fresh) return s;
  const r = toStr(parseFloat(s.entry), true);
  return r === null ? s : { ...s, entry: r };
}

function apply(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? NaN : a / b;
  }
}
