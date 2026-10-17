import { router } from 'expo-router';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalcState, Key } from '@/lib/calculator';
import { type Theme, fonts } from '@/theme';

import { Keypad } from './Keypad';
import { Lcd } from './Lcd';

interface Props {
  theme: Theme;
  z: number;
  vw: number;
  vh: number;
  calc: CalcState;
  sound: boolean;
  /** Where the paper sits (x within the machine, and width), so the printer slot can match it. */
  paper: { x: number; width: number };
  onPress: (k: Key) => void;
  onSettings: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

/** The calculator body: printer slot, name plate, display and keys. Every size scales by z. */
export function Casing({ theme: t, z, vw, vh, calc, sound, paper, onPress, onSettings, onLayout }: Props) {
  const padX = 14 * z;
  return (
    <View
      onLayout={onLayout}
      style={{
        marginTop: -6 * z,
        paddingTop: 12 * z,
        paddingHorizontal: padX,
        paddingBottom: 16 * z,
        gap: 10 * z,
        borderTopLeftRadius: 22 * z,
        borderTopRightRadius: 22 * z,
        borderBottomLeftRadius: 26 * z,
        borderBottomRightRadius: 26 * z,
        experimental_backgroundImage: `linear-gradient(180deg, ${t.casingHi} 0%, ${t.casing} 45%, ${t.casingLo} 100%)`,
        boxShadow: `inset 0 ${2 * z}px 0 rgba(255,255,255,0.55), inset 0 ${-4 * z}px 0 ${t.casingEdge}, 0 ${14 * z}px ${30 * z}px rgba(0,0,0,0.45)`,
      }}
    >
      {/* Printer slot: right end flush with the paper's right edge, 4px showing on the left. */}
      <View
        style={{
          height: 12 * z,
          marginLeft: paper.x - 4 - padX,
          width: paper.width + 4,
          borderRadius: 6,
          borderBottomWidth: 2,
          borderBottomColor: t.casingHi,
          experimental_backgroundImage: `linear-gradient(180deg, ${t.slotA}, ${t.slotB})`,
          boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.6)',
        }}
      />

      <View style={[styles.plate, { gap: 10 * z }]}>
        <View>
          <Text allowFontScaling={false} style={[styles.brand, { color: t.casingInk, fontSize: 13.5 * z, letterSpacing: 1.4 * z }]}>
            CANDACECALC
          </Text>
          <Text
            allowFontScaling={false}
            style={[styles.model, { color: t.casingSub, fontSize: 9 * z, letterSpacing: 1.6 * z, marginTop: 3 * z }]}
          >
            P-1280 · 12 DIGIT PRINTING
          </Text>
        </View>
        <View style={[styles.plateRight, { gap: 10 * z }]}>
          <View style={[styles.solar, { gap: 2 * z, padding: 2 * z, borderRadius: 3 * z }]}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: 10 * z,
                  height: 11 * z,
                  borderRadius: 1,
                  experimental_backgroundImage: 'linear-gradient(160deg, #6b4a32, #2d1d14)',
                }}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onSettings();
              router.push('/settings');
            }}
            style={({ pressed }) => ({
              minHeight: 36 * z,
              paddingHorizontal: 11 * z,
              borderRadius: 8 * z,
              justifyContent: 'center',
              backgroundColor: t.keyBrown,
              boxShadow: pressed ? `0 1px 0 ${t.keyBrownEdge}` : `0 ${4 * z}px 0 ${t.keyBrownEdge}`,
              transform: [{ translateY: pressed ? 3 * z : 0 }],
            })}
          >
            <Text allowFontScaling={false} style={[styles.settings, { color: t.keyInkLight, fontSize: 12 * z, letterSpacing: 0.7 * z }]}>
              SETTINGS
            </Text>
          </Pressable>
        </View>
      </View>

      <Lcd calc={calc} sound={sound} theme={t} z={z} vw={vw} />

      <Keypad theme={t} z={z} vw={vw} vh={vh} activeOp={calc.fresh ? calc.op : null} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: fonts.key },
  model: { fontFamily: fonts.keySemi },
  plateRight: { flexDirection: 'row', alignItems: 'center' },
  solar: { flexDirection: 'row', backgroundColor: '#3a2e24' },
  settings: { fontFamily: fonts.keyBold },
});
