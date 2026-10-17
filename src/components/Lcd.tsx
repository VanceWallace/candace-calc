import { StyleSheet, Text, View } from 'react-native';

import { group, OP_GLYPH } from '@/lib/format';
import type { CalcState } from '@/lib/calculator';
import { type Theme, fonts, gradient } from '@/theme';

interface Props {
  calc: CalcState;
  sound: boolean;
  theme: Theme;
  z: number;
  vw: number;
}

const clamp = (min: number, v: number, max: number) => Math.max(min, Math.min(max, v));

export function Lcd({ calc, sound, theme: t, z, vw }: Props) {
  const text = calc.err ? 'ERROR' : group(calc.entry);
  // shrink the digits for long numbers
  const base =
    text.length > 13 ? clamp(36, 0.1 * vw, 50) : text.length > 10 ? clamp(44, 0.125 * vw, 62) : clamp(60, 0.17 * vw, 84);
  const size = base * z;
  const flag = (on: boolean) => [styles.flag, { fontSize: 20 * z, lineHeight: 20 * z }, on ? { color: t.lcdGlow, ...glow } : { color: t.lcdDim }];

  return (
    // Display panel sits on a raised ledge, tilted up toward the user.
    <View style={{ paddingTop: 4 * z }}>
      <View
        style={[
          styles.ledge,
          {
            left: 6 * z,
            right: 6 * z,
            bottom: -7 * z,
            height: 9 * z,
            borderBottomLeftRadius: 8 * z,
            borderBottomRightRadius: 8 * z,
            ...gradient(`linear-gradient(180deg, ${t.casingLo}, ${t.casingEdge})`),
            boxShadow: `0 ${4 * z}px ${6 * z}px rgba(0,0,0,0.28)`,
          },
        ]}
      />
      <View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={calc.err ? 'Error' : text}
        style={{
          backgroundColor: t.lcdBg,
          borderRadius: 10 * z,
          borderWidth: 6 * z,
          borderColor: t.lcdBezel,
          paddingTop: 9 * z,
          paddingHorizontal: 14 * z,
          paddingBottom: 8 * z,
          boxShadow: `inset 0 ${4 * z}px ${12 * z}px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.25), 0 ${-3 * z}px ${8 * z}px rgba(0,0,0,0.25)`,
          transformOrigin: 'bottom',
          transform: [{ perspective: 520 }, { rotateX: '-8deg' }],
        }}
      >
        <View style={styles.flags}>
          <Text allowFontScaling={false} style={flag(sound)}>SOUND</Text>
          <Text allowFontScaling={false} style={flag(!!calc.op)}>{calc.op ? OP_GLYPH[calc.op] : ' '}</Text>
          <Text allowFontScaling={false} style={flag(calc.err)}>E</Text>
        </View>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[styles.main, glow, { color: t.lcdGlow, fontSize: size, lineHeight: size, paddingBottom: 4 * z }]}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const glow = { textShadowColor: 'rgba(255,170,20,0.45)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 0 } };

const styles = StyleSheet.create({
  ledge: { position: 'absolute' },
  flags: { flexDirection: 'row', justifyContent: 'space-between' },
  flag: { fontFamily: fonts.lcd },
  main: { fontFamily: fonts.lcd, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
