import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type DemoLimits, type DemoUsage, demoRemaining, describeLimits } from '@/lib/demo';
import { type Theme, fonts } from '@/theme';

interface Props {
  limits: DemoLimits;
  usage: DemoUsage;
  theme: Theme;
}

/** Re-renders a few times a second while the demo clock is running. */
function useDemoClock(limits: DemoLimits, usage: DemoUsage) {
  const [now, setNow] = useState(() => Date.now());
  const running = !!limits.seconds && usage.startedAt !== null && !demoRemaining(limits, usage, now).over;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  return demoRemaining(limits, usage, now);
}

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** One line on the desk above the calculator: what's left of the demo. */
export function DemoBanner({ limits, usage, theme: t }: Props) {
  const { calcsLeft, msLeft, over } = useDemoClock(limits, usage);
  const parts = ['DEMO'];
  if (over) parts.push('FINISHED');
  else {
    if (calcsLeft !== Infinity) parts.push(`${calcsLeft} CALCULATION${calcsLeft === 1 ? '' : 'S'} LEFT`);
    if (msLeft !== Infinity) parts.push(usage.startedAt === null ? `${clock(msLeft)} ONCE YOU START` : `${clock(msLeft)} LEFT`);
  }
  return (
    <Text allowFontScaling={false} accessibilityRole="text" style={[styles.banner, { color: t.railLabel }]}>
      {parts.join(' · ')}
    </Text>
  );
}

/** Covers the keypad once the demo is used up; the tape above stays scrollable. */
export function DemoOver({ limits, usage, theme: t }: Props) {
  const { over } = useDemoClock(limits, usage);
  if (!over) return null;
  return (
    <View style={styles.cover} accessibilityViewIsModal>
      <View style={[styles.card, { backgroundColor: t.paper }]}>
        <Text style={[styles.title, { color: t.ink }]}>That’s the end of the demo</Text>
        <Text style={[styles.body, { color: t.inkFaint }]}>
          This demo allows {describeLimits(limits)}. Thanks for trying CandaceCalc!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { fontFamily: fonts.keyBold, fontSize: 11, letterSpacing: 1.2, textAlign: 'center', marginBottom: 8 },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    borderRadius: 24,
    backgroundColor: 'rgba(20,14,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { borderRadius: 14, padding: 20, gap: 8, maxWidth: 320, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  title: { fontFamily: fonts.tapeBold, fontSize: 20, textAlign: 'center' },
  body: { fontFamily: fonts.tape, fontSize: 16, lineHeight: 22, textAlign: 'center' },
});
