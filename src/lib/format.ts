export const MAX_DIGITS = 12;
export const DAY = 86_400_000;

export type Op = '+' | '-' | '*' | '/';

/** Tape glyph for each operator. */
export const OP_GLYPH: Record<Op, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

/** Strips binary float noise (0.1 + 0.2 -> 0.3). */
export function clean(n: number): number {
  return parseFloat(Number(n).toPrecision(12));
}

/** Rounds half away from zero at 2 places, without binary float slips (1.005 -> 1.01). */
export function roundCents(n: number): number {
  const a = Math.abs(n);
  if (a < 0.005) return 0; // also avoids exponent-form strings like 1e-7
  return (n < 0 ? -1 : 1) * Number(Math.round(Number(a + 'e2')) + 'e-2');
}

/** Formats a result for the display and tape; null when it isn't a finite number. */
export function toStr(n: number, round2: boolean): string | null {
  if (!isFinite(n)) return null;
  n = clean(n);
  if (round2 && Math.abs(n) < 1e15) n = roundCents(n);
  if (Object.is(n, -0)) n = 0;
  let s = String(n);
  const digits = s.replace(/[-.]/g, '').replace(/e.*$/, '');
  if (/e/.test(s) || digits.length > MAX_DIGITS) s = n.toExponential(6).replace('e+', 'e');
  return s;
}

/** Adds thousands separators: 1234567.5 -> 1,234,567.5 */
export function group(s: string): string {
  if (/e/.test(s)) return s;
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  const [i, d] = s.split('.');
  const gi = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + gi + (d !== undefined ? '.' + d : '');
}

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "FRI OCT 17  1:05 AM" (year added when it isn't the current one). */
export function stampText(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  const yr = d.getFullYear() !== new Date(now).getFullYear() ? ' ' + d.getFullYear() : '';
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}${yr}  ${h}:${m} ${ap}`;
}

export function ago(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return mins + ' MIN AGO';
  if (new Date(ts).toDateString() === new Date(now).toDateString()) return 'TODAY';
  const days = Math.max(1, Math.round(diff / DAY));
  if (days === 1) return 'YESTERDAY';
  if (days < 14) return days + ' DAYS AGO';
  if (days < 60) return Math.round(days / 7) + ' WEEKS AGO';
  return Math.round(days / 30) + ' MONTHS AGO';
}

/** Compact age for the history rail label. */
export function shortAgo(ts: number, now = Date.now()): string {
  const days = Math.floor((now - ts) / DAY);
  if (days < 1) return 'TODAY';
  if (days < 14) return days + 'D';
  if (days < 60) return Math.round(days / 7) + 'W';
  return Math.round(days / 30) + 'MO';
}
