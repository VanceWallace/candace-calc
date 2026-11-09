import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import type { CalcState, Key } from '@/lib/calculator';
import { type Theme, fonts, gradient } from '@/theme';

import { Keypad } from './Keypad';
import { Lcd } from './Lcd';

interface Props {
  theme: Theme;
  /** Scale of the body. Runs on the UI thread, so a resize doesn't re-render every key. */
  z: SharedValue<number>;
  /** The scale the body is settling at, for details too small to need animating. */
  settledZ: number;
  vw: number;
  vh: number;
  calc: CalcState;
  sound: boolean;
  round2: boolean;
  /** Where the paper sits (x within the machine, and width), so the printer slot can match it. */
  paper: { x: number; width: number };
  onPress: (k: Key) => void;
  onTouchStart: () => void;
  onSettings: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  /** Drawn over the whole body (the demo-over cover). */
  children?: ReactNode;
}

const PAD_X = 14;
/** How far the printer slot runs past the paper on each side. */
const SLOT_OVERHANG = 9;

/** The calculator body: printer slot, name plate, display and keys. Every size scales by z. */
export function Casing({ theme: t, z, settledZ, vw, vh, calc, sound, round2, paper, onPress, onSettings, onTouchStart, onLayout, children }: Props) {
  const body = useAnimatedStyle(() => ({
    marginTop: -6 * z.value,
    paddingTop: 12 * z.value,
    paddingHorizontal: PAD_X * z.value,
    paddingBottom: 16 * z.value,
    gap: 10 * z.value,
    borderTopLeftRadius: 22 * z.value,
    borderTopRightRadius: 22 * z.value,
    borderBottomLeftRadius: 26 * z.value,
    borderBottomRightRadius: 26 * z.value,
  }));
  const slot = useAnimatedStyle(() => ({
    height: 24 * z.value,
    marginLeft: paper.x - SLOT_OVERHANG - PAD_X * z.value,
  }));
  const spaced = useAnimatedStyle(() => ({ gap: 10 * z.value }));
  const brand = useAnimatedStyle(() => ({ fontSize: 13.5 * z.value, letterSpacing: 1.4 * z.value }));
  const model = useAnimatedStyle(() => ({ fontSize: 9 * z.value, letterSpacing: 1.6 * z.value, marginTop: 3 * z.value }));
  const solar = useAnimatedStyle(() => ({ gap: 2 * z.value, padding: 2 * z.value, borderRadius: 3 * z.value }));
  const cell = useAnimatedStyle(() => ({ width: 10 * z.value, height: 11 * z.value }));
  const button = useAnimatedStyle(() => ({ minHeight: 36 * z.value, paddingHorizontal: 11 * z.value }));
  const buttonText = useAnimatedStyle(() => ({ fontSize: 12 * z.value, letterSpacing: 0.7 * z.value }));

  return (
    <Animated.View
      onLayout={onLayout}
      onTouchStart={onTouchStart}
      style={[
        {
          ...gradient(`linear-gradient(180deg, ${t.casingHi} 0%, ${t.casing} 45%, ${t.casingLo} 100%)`),
          boxShadow: `inset 0 ${2 * settledZ}px 0 rgba(255,255,255,0.55), inset 0 ${-4 * settledZ}px 0 ${t.casingEdge}, 0 ${14 * settledZ}px ${30 * settledZ}px rgba(0,0,0,0.45)`,
        },
        body,
      ]}
    >
      {/* Printer slot: a dark recess wider than the paper, with a lit lip along its lower edge. */}
      <Animated.View
        style={[
          {
            width: paper.width + 2 * SLOT_OVERHANG,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: t.casingEdge,
            borderBottomWidth: 2.5,
            borderBottomColor: t.casingHi,
            ...gradient(`linear-gradient(180deg, ${t.slotA}, ${t.slotB})`),
            boxShadow: 'inset 0 5px 7px rgba(0,0,0,0.9), 0 -1px 0 rgba(0,0,0,0.25), 0 1px 1px rgba(255,255,255,0.5)',
          },
          slot,
        ]}
      />

      <Animated.View style={[styles.plate, spaced]}>
        <View>
          <Animated.Text allowFontScaling={false} style={[styles.brand, { color: t.casingInk }, brand]}>
            CANDACECALC
          </Animated.Text>
          <Animated.Text allowFontScaling={false} style={[styles.model, { color: t.casingSub }, model]}>
            P-1280 · 12 DIGIT PRINTING
          </Animated.Text>
        </View>
        <Animated.View style={[styles.plateRight, spaced]}>
          <Animated.View style={[styles.solar, solar]}>
            {[0, 1, 2, 3].map((i) => (
              <Animated.View
                key={i}
                style={[{ borderRadius: 1, ...gradient('linear-gradient(160deg, #6b4a32, #2d1d14)') }, cell]}
              />
            ))}
          </Animated.View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onSettings();
              router.push('/settings');
            }}
            style={({ pressed }) => ({
              borderRadius: 8 * settledZ,
              backgroundColor: t.keyBrown,
              boxShadow: pressed ? `0 1px 0 ${t.keyBrownEdge}` : `0 ${4 * settledZ}px 0 ${t.keyBrownEdge}`,
              transform: [{ translateY: pressed ? 3 * settledZ : 0 }],
            })}
          >
            <Animated.View style={[styles.settingsBox, button]}>
              <Animated.Text allowFontScaling={false} style={[styles.settings, { color: t.keyInkLight }, buttonText]}>
                SETTINGS
              </Animated.Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>

      <Lcd calc={calc} sound={sound} round2={round2} theme={t} z={z} settledZ={settledZ} vw={vw} />

      <Keypad theme={t} z={z} settledZ={settledZ} vw={vw} vh={vh} activeOp={calc.fresh ? calc.op : null} onPress={onPress} />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  plate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: fonts.key },
  model: { fontFamily: fonts.keySemi },
  plateRight: { flexDirection: 'row', alignItems: 'center' },
  solar: { flexDirection: 'row', backgroundColor: '#3a2e24' },
  settingsBox: { justifyContent: 'center' },
  settings: { fontFamily: fonts.keyBold },
});
