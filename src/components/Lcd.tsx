import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { fixed2, group, OP_GLYPH } from '@/lib/format';
import type { CalcState } from '@/lib/calculator';
import { type Theme, fonts, gradient } from '@/theme';

interface Props {
  calc: CalcState;
  sound: boolean;
  round2: boolean;
  theme: Theme;
  z: SharedValue<number>;
  settledZ: number;
  vw: number;
}

const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(max, v));

export function Lcd({ calc, sound, round2, theme: t, z, settledZ, vw }: Props) {
  // while typing, show digits as entered; once a value is settled, show it to two decimals
  const text = calc.err ? 'ERROR' : group(calc.fresh ? fixed2(calc.entry, round2) : calc.entry);
  // shrink the digits for long numbers
  const base =
    text.length > 13 ? clamp(36, 0.1 * vw, 50) : text.length > 10 ? clamp(44, 0.125 * vw, 62) : clamp(60, 0.17 * vw, 84);

  const outer = useAnimatedStyle(() => ({ paddingTop: 4 * z.value }));
  const ledge = useAnimatedStyle(() => ({
    left: 6 * z.value,
    right: 6 * z.value,
    bottom: -7 * z.value,
    height: 9 * z.value,
    borderBottomLeftRadius: 8 * z.value,
    borderBottomRightRadius: 8 * z.value,
  }));
  const panel = useAnimatedStyle(() => ({
    borderRadius: 10 * z.value,
    borderWidth: 6 * z.value,
    paddingTop: 9 * z.value,
    paddingHorizontal: 14 * z.value,
    paddingBottom: 8 * z.value,
  }));
  const flagSize = useAnimatedStyle(() => ({ fontSize: 20 * z.value, lineHeight: 20 * z.value }));
  const digits = useAnimatedStyle(() => ({
    fontSize: base * z.value,
    lineHeight: base * z.value,
    paddingBottom: 4 * z.value,
  }));

  const flag = (on: boolean) => [styles.flag, on ? { color: t.lcdGlow, ...glow } : { color: t.lcdDim }, flagSize];

  return (
    // Display panel sits on a raised ledge, tilted up toward the user.
    <Animated.View style={outer}>
      <Animated.View
        style={[
          styles.ledge,
          {
            ...gradient(`linear-gradient(180deg, ${t.casingLo}, ${t.casingEdge})`),
            boxShadow: `0 ${4 * settledZ}px ${6 * settledZ}px rgba(0,0,0,0.28)`,
          },
          ledge,
        ]}
      />
      <Animated.View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={calc.err ? 'Error' : text}
        style={[
          {
            backgroundColor: t.lcdBg,
            borderColor: t.lcdBezel,
            boxShadow: `inset 0 ${4 * settledZ}px ${12 * settledZ}px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.25), 0 ${-3 * settledZ}px ${8 * settledZ}px rgba(0,0,0,0.25)`,
            transformOrigin: 'bottom',
            transform: [{ perspective: 520 }, { rotateX: '-8deg' }],
          },
          panel,
        ]}
      >
        <View style={styles.flags}>
          <Animated.Text allowFontScaling={false} style={flag(sound)}>SOUND</Animated.Text>
          <Animated.Text allowFontScaling={false} style={flag(!!calc.op)}>{calc.op ? OP_GLYPH[calc.op] : ' '}</Animated.Text>
          <Animated.Text allowFontScaling={false} style={flag(calc.err)}>E</Animated.Text>
        </View>
        <Animated.Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.main, glow, { color: t.lcdGlow }, digits]}
        >
          {text}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const glow = { textShadowColor: 'rgba(255,170,20,0.45)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 0 } };

const styles = StyleSheet.create({
  ledge: { position: 'absolute' },
  flags: { flexDirection: 'row', justifyContent: 'space-between' },
  flag: { fontFamily: fonts.lcd },
  main: { fontFamily: fonts.lcd, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
