import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DemoUsage } from '@/lib/demo';
import type { TapeEntry, Retention } from '@/lib/tape';
import type { Finish } from '@/theme';

const STORE_KEY = 'candacecalc.v1';
const DEMO_KEY = 'candacecalc.demo';

export type PaperPosition = 'wide' | 'narrow' | 'left' | 'right';

export interface Settings {
  paper: PaperPosition;
  finish: Finish;
  retention: Retention;
  sound: boolean;
  dates: boolean;
  round2: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  paper: 'wide',
  finish: 'light',
  retention: 90,
  sound: true,
  dates: true,
  round2: true,
};

export interface Saved {
  settings: Settings;
  history: TapeEntry[];
}

export async function load(): Promise<Saved> {
  let raw: Record<string, unknown> = {};
  try {
    const json = await AsyncStorage.getItem(STORE_KEY);
    if (json) raw = JSON.parse(json);
  } catch {}
  const pick = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  return {
    settings: {
      paper: pick(raw.paper, ['wide', 'narrow', 'left', 'right'] as const, DEFAULT_SETTINGS.paper),
      finish: pick(raw.finish, ['light', 'dark'] as const, DEFAULT_SETTINGS.finish),
      retention: pick(raw.retention, [30, 60, 90] as const, DEFAULT_SETTINGS.retention),
      sound: raw.sound !== false,
      dates: raw.dates !== false,
      round2: raw.round2 !== false,
    },
    history: Array.isArray(raw.history) ? (raw.history as TapeEntry[]).filter(isEntry) : [],
  };
}

export async function save({ settings, history }: Saved): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify({ ...settings, history }));
  } catch {}
}

export async function loadDemo(): Promise<DemoUsage> {
  try {
    const raw = JSON.parse((await AsyncStorage.getItem(DEMO_KEY)) ?? '{}');
    return {
      calcs: typeof raw.calcs === 'number' ? raw.calcs : 0,
      startedAt: typeof raw.startedAt === 'number' ? raw.startedAt : null,
    };
  } catch {
    return { calcs: 0, startedAt: null };
  }
}

export function saveDemo(usage: DemoUsage): void {
  AsyncStorage.setItem(DEMO_KEY, JSON.stringify(usage)).catch(() => {});
}

function isEntry(e: unknown): e is TapeEntry {
  const x = e as TapeEntry;
  return !!x && typeof x.ts === 'number' && Array.isArray(x.lines) && typeof x.id === 'string';
}
