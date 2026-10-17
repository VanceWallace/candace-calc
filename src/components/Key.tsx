import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { Key as KeyId } from '@/lib/calculator';
import { type Theme, fonts } from '@/theme';

export type KeyKind = 'digit' | 'fn' | 'op' | 'clear' | 'eq';

interface Props {
  k: KeyId;
  label: string;
  kind: KeyKind;
  a11y?: string;
  active?: boolean;
  theme: Theme;
  /** Casing scale factor. */
  z: number;
  /** Window width, for the prototype's vw-based font sizes. */
  vw: number;
  height: number;
  onPress: (k: KeyId) => void;
}

const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(max, v));
const FLASH_MS = 110;

export function Key({ k, label, kind, a11y, active, theme: t, z, vw, height, onPress }: Props) {
  const [down, setDown] = useState(false);
  const downAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bg, edge, ink, hi] = {
    digit: [t.keyCream, t.keyCreamEdge, t.keyInk, t.keyCreamHi],
    fn: [t.keyBrown, t.keyBrownEdge, t.keyInkLight, 'rgba(255,255,255,0.18)'],
    op: [t.keyBrown, t.keyBrownEdge, t.keyInkLight, 'rgba(255,255,255,0.18)'],
    clear: [t.keyRed, t.keyRedEdge, t.keyInkLight, 'rgba(255,255,255,0.2)'],
    eq: [t.keyAmber, t.keyAmberEdge, t.keyInkLight, 'rgba(255,255,255,0.25)'],
  }[kind];

  const fontSize = {
    digit: clamp(28, 0.08 * vw, 36),
    fn: clamp(22, 0.062 * vw, 28),
    clear: clamp(22, 0.062 * vw, 28),
    op: clamp(32, 0.09 * vw, 40),
    eq: clamp(34, 0.095 * vw, 42),
  }[kind] * z;

  const shadow = down
    ? `0 ${z}px 0 rgba(0,0,0,0.35), 0 ${2 * z}px ${3 * z}px rgba(0,0,0,0.2)`
    : `0 ${6 * z}px 0 ${edge}, 0 ${8 * z}px ${10 * z}px rgba(0,0,0,0.25), inset 0 ${2 * z}px 0 ${hi}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      // Keys register the instant a finger lands, like a real keypad.
      onPressIn={() => {
        if (timer.current) clearTimeout(timer.current);
        downAt.current = Date.now();
        setDown(true);
        onPress(k);
      }}
      onPressOut={() => {
        const left = FLASH_MS - (Date.now() - downAt.current);
        timer.current = setTimeout(() => setDown(false), Math.max(0, left));
      }}
      unstable_pressDelay={0}
      style={[
        styles.key,
        {
          height: height * z,
          borderRadius: 14 * z,
          backgroundColor: bg,
          boxShadow: shadow,
          borderColor: active ? t.lcdGlow : 'transparent',
          borderWidth: 3 * z,
          transform: [{ translateY: down ? 5 * z : 0 }],
        },
      ]}
    >
      <Text allowFontScaling={false} style={[styles.label, { color: ink, fontSize, lineHeight: fontSize * 1.15 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.key, includeFontPadding: false, textAlign: 'center' },
});
