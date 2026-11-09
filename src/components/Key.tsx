import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

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
  /** Casing scale factor, animated while the calculator resizes. */
  z: SharedValue<number>;
  /** The scale the calculator is settling at, for details too small to need animating. */
  settledZ: number;
  /** Window width, for the prototype's vw-based font sizes. */
  vw: number;
  onPress: (k: KeyId) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(max, v));
const FLASH_MS = 110;
// react-native-web waits 50ms before onPressIn, and drops taps released sooner unless the
// Pressable also has onPress. Keys only use onPressIn, so fire it on touchdown there too.
const WEB_PRESS = Platform.OS === 'web' ? { delayPressIn: 0 } : null;

export function Key({ k, label, kind, a11y, active, theme: t, z, settledZ, vw, onPress }: Props) {
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

  // A word on a key needs a smaller size than a symbol to stay inside it.
  const fontSize = label.length > 2 ? clamp(15, 0.047 * vw, 20) : {
    digit: clamp(28, 0.08 * vw, 36),
    fn: clamp(22, 0.062 * vw, 28),
    clear: clamp(22, 0.062 * vw, 28),
    op: clamp(32, 0.09 * vw, 40),
    eq: clamp(34, 0.095 * vw, 42),
  }[kind];

  const shadow = down
    ? `0 ${settledZ}px 0 rgba(0,0,0,0.35), 0 ${2 * settledZ}px ${3 * settledZ}px rgba(0,0,0,0.2)`
    : `0 ${6 * settledZ}px 0 ${edge}, 0 ${8 * settledZ}px ${10 * settledZ}px rgba(0,0,0,0.25), inset 0 ${2 * settledZ}px 0 ${hi}`;

  const corners = useAnimatedStyle(() => ({ borderRadius: 14 * z.value }));
  // Scaling the label costs no layout work, unlike changing its font size on every frame.
  const scaled = useAnimatedStyle(() => ({ transform: [{ scale: z.value }] }));

  return (
    <AnimatedPressable
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
      {...WEB_PRESS}
      style={[
        styles.key,
        {
          backgroundColor: bg,
          boxShadow: shadow,
          borderColor: active ? t.lcdGlow : 'transparent',
          borderWidth: 3 * settledZ,
          transform: [{ translateY: down ? 5 * settledZ : 0 }],
        },
        corners,
      ]}
    >
      <Animated.Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[styles.label, { color: ink, fontSize, lineHeight: fontSize * 1.15 }, scaled]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  key: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.key, includeFontPadding: false, textAlign: 'center' },
});
