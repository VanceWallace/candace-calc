/**
 * Optional demo limits, set at build time (the GitHub Pages build sets them; app builds don't).
 *   EXPO_PUBLIC_DEMO_CALCS    printouts allowed (calculations, = reprints and AC tears all count)
 *   EXPO_PUBLIC_DEMO_SECONDS  seconds allowed, counted from the first key press
 * The demo ends at whichever limit comes first. Usage is kept in the browser, so this is a
 * friendly limit, not protection: clearing site data resets it.
 */
const calcs = Number(process.env.EXPO_PUBLIC_DEMO_CALCS) || 0;
const seconds = Number(process.env.EXPO_PUBLIC_DEMO_SECONDS) || 0;

export interface DemoLimits {
  calcs: number; // 0 = no limit
  seconds: number; // 0 = no limit
}

export const DEMO: DemoLimits | null = calcs || seconds ? { calcs, seconds } : null;

export interface DemoUsage {
  calcs: number;
  startedAt: number | null;
}

export function demoRemaining(limits: DemoLimits, usage: DemoUsage, now: number) {
  const calcsLeft = limits.calcs ? Math.max(0, limits.calcs - usage.calcs) : Infinity;
  const msLeft = limits.seconds
    ? Math.max(0, limits.seconds * 1000 - (usage.startedAt === null ? 0 : now - usage.startedAt))
    : Infinity;
  return { calcsLeft, msLeft, over: calcsLeft === 0 || msLeft === 0 };
}

export function describeLimits(limits: DemoLimits): string {
  const parts: string[] = [];
  if (limits.calcs) parts.push(`${limits.calcs} calculations`);
  if (limits.seconds) {
    parts.push(limits.seconds % 60 === 0 ? `${limits.seconds / 60} minute${limits.seconds === 60 ? '' : 's'}` : `${limits.seconds} seconds`);
  }
  return parts.join(' or ');
}
