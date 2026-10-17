import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { playKey, playPrint, playRip, playTap } from '@/audio/sounds';
import { type CalcState, type Key, type Print, applyRounding, initialCalc, press } from '@/lib/calculator';
import { DEMO, type DemoLimits, type DemoUsage, demoRemaining } from '@/lib/demo';
import { makeSamples } from '@/lib/samples';
import { type TapeEntry, makeRip, pruneHistory } from '@/lib/tape';

import { DEFAULT_SETTINGS, type Settings, load, loadDemo, save, saveDemo } from './storage';

/** The entry being printed right now, so the tape can animate only that one. */
export interface PrintJob {
  id: string;
  /** Length of the feed animation; a tear starts when it ends. */
  ms: number;
}

interface Store {
  ready: boolean;
  settings: Settings;
  /** Saved calculations (oldest first). */
  history: TapeEntry[];
  /** What the tape shows: the history, or the examples until the first calculation. */
  tape: TapeEntry[];
  calc: CalcState;
  printJob: PrintJob | null;
  /** Set on demo builds (GitHub Pages): the limits and how much has been used. */
  demo: { limits: DemoLimits; usage: DemoUsage } | null;
  pressKey: (k: Key) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  clearHistory: () => void;
  /** UI tap sound for settings controls. */
  tap: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<TapeEntry[]>([]);
  const [calc, setCalc] = useState<CalcState>(initialCalc);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
  const [demoUsage, setDemoUsage] = useState<DemoUsage>({ calcs: 0, startedAt: null });
  const demoRef = useRef(demoUsage);

  // Keys can arrive faster than React re-renders, so the latest values live in refs too.
  const calcRef = useRef(calc);
  const settingsRef = useRef(settings);

  const samples = useMemo(() => makeSamples(), []);

  useEffect(() => {
    Promise.all([load(), DEMO ? loadDemo() : null]).then(([saved, usage]) => {
      settingsRef.current = saved.settings;
      setSettings(saved.settings);
      setHistory(pruneHistory(saved.history, saved.settings.retention));
      if (usage) {
        demoRef.current = usage;
        setDemoUsage(usage);
      }
      setReady(true);
    });
  }, []);

  // Writes are coalesced so a burst of key presses never waits on storage.
  const latest = useRef({ settings, history });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    save(latest.current);
  }, []);
  useEffect(() => {
    latest.current = { settings, history };
    if (!ready) return;
    if (!saveTimer.current) saveTimer.current = setTimeout(flush, 300);
  }, [ready, settings, history, flush]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && saveTimer.current) flush();
    });
    return () => sub.remove();
  }, [flush]);

  const printEntry = useCallback((p: Print) => {
    const ts = Date.now();
    const entry: TapeEntry = {
      id: ts.toString(36) + Math.random().toString(36).slice(2, 7),
      ts,
      lines: p.lines,
      ...(p.voided ? { voided: true, rip: makeRip() } : null),
    };
    const sound = settingsRef.current.sound;
    const ms = (sound && playPrint(Math.min(entry.lines.length, 8))) || 600;
    if (sound && entry.voided) setTimeout(playRip, ms);
    setHistory((h) => [...h, entry]);
    setPrintJob({ id: entry.id, ms });
  }, []);

  const pressKey = useCallback(
    (k: Key) => {
      const now = Date.now();
      if (DEMO) {
        let usage = demoRef.current;
        if (demoRemaining(DEMO, usage, now).over) return;
        if (usage.startedAt === null) usage = { ...usage, startedAt: now }; // the clock starts on the first key
        demoRef.current = usage;
      }
      if (settingsRef.current.sound) playKey(k);
      const r = press(calcRef.current, k, { round2: settingsRef.current.round2, now });
      calcRef.current = r.state;
      setCalc(r.state);
      if (r.print) printEntry(r.print);
      if (DEMO) {
        // everything printed counts: calculations, = reprints and numbers torn off with AC
        if (r.print) {
          demoRef.current = { ...demoRef.current, calcs: demoRef.current.calcs + 1 };
        }
        if (demoRef.current !== demoUsage) {
          setDemoUsage(demoRef.current);
          saveDemo(demoRef.current);
        }
      }
    },
    [printEntry, demoUsage]
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    if (patch.retention) setHistory((h) => pruneHistory(h, next.retention));
    if (patch.round2) {
      calcRef.current = applyRounding(calcRef.current, true);
      setCalc(calcRef.current);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setPrintJob(null);
  }, []);

  const tap = useCallback(() => {
    if (settingsRef.current.sound) playTap();
  }, []);

  const value: Store = {
    ready,
    settings,
    history,
    tape: history.length ? history : samples,
    calc,
    printJob,
    demo: DEMO && { limits: DEMO, usage: demoUsage },
    pressKey,
    updateSettings,
    clearHistory,
    tap,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside <StoreProvider>');
  return s;
}
