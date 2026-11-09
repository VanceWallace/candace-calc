import { useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Casing } from '@/components/Casing';
import { DemoBanner, DemoOver } from '@/components/Demo';
import { Tape } from '@/components/Tape';
import { withoutTapeExamples } from '@/lib/samples';
import type { PaperPosition } from '@/state/storage';
import { useStore } from '@/state/store';
import { themeFor, gradient } from '@/theme';

const RESIZE_MS = 320;

/** Where the paper sits across the machine for each paper position setting. */
function paperRect(position: PaperPosition, w: number): { x: number; width: number } {
  const narrow = 0.6 * w;
  switch (position) {
    case 'wide':
      return { x: 22, width: w - 44 };
    case 'narrow':
      return { x: (w - narrow) / 2, width: narrow };
    case 'left':
      return { x: 22, width: narrow };
    case 'right':
      return { x: w - 22 - narrow, width: narrow };
  }
}

export default function Calculator() {
  const { settings, tape, history, calc, printJob, rewinds, demo, pressKey, tap } = useStore();
  const [focused, setFocused] = useState(false);
  const t = themeFor(settings.finish);
  const insets = useSafeAreaInsets();
  const { width: vw, height: vh } = useWindowDimensions();

  // One handheld calculator on a desk: 93% of the space between 16px gutters, at most 428 wide.
  const gutter = Math.max(16, insets.left, insets.right);
  const machineW = Math.min(428, 0.93 * (vw - 2 * gutter));
  const paper = paperRect(settings.paper, machineW);

  // The calculator body scales down together so the paper gets 15% more height than it would
  // have at full size, while always leaving a usable keypad.
  const [machineH, setMachineH] = useState(0);
  const [casingH1, setCasingH1] = useState(0); // casing height at scale 1
  const focusing = settings.focusView && focused;
  let z = 1;
  if (machineH && casingH1) {
    const natural = Math.max(150, machineH - casingH1);
    const defaultTarget = Math.min(natural * 1.15, machineH * 0.66);
    const focusTarget = Math.min(machineH * 0.78, machineH - casingH1 * 0.75);
    const target = focusing ? Math.max(defaultTarget, focusTarget) : defaultTarget;
    z = Math.max(0.5, Math.min(1, (machineH - target) / casingH1));
  }

  // Moving between the focus view and the normal view glides; first layout just snaps into place.
  const animatedZ = useSharedValue(z);
  const wasFocusing = useRef(focusing);
  const ignoreLayoutUntil = useRef(0);
  useLayoutEffect(() => {
    if (wasFocusing.current !== focusing) {
      wasFocusing.current = focusing;
      ignoreLayoutUntil.current = Date.now() + RESIZE_MS + 150;
      animatedZ.set(withTiming(z, { duration: RESIZE_MS, easing: Easing.inOut(Easing.cubic) }));
    } else {
      animatedZ.set(z);
    }
  }, [z, focusing, animatedZ]);

  return (
    <View
      style={[
        styles.desk,
        {
          backgroundColor: t.desk,
          ...gradient(`radial-gradient(120% 80% at 50% 0%, ${t.deskHi} 0%, ${t.desk} 70%)`),
          paddingTop: insets.top + 10,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {demo && <DemoBanner limits={demo.limits} usage={demo.usage} theme={t} />}
      <View
        style={[styles.machine, { width: machineW }]}
        onLayout={(e) => setMachineH(e.nativeEvent.layout.height)}
      >
        <Tape
          style={{ marginLeft: paper.x, width: paper.width }}
          entries={settings.removeTapeExamples ? withoutTapeExamples(tape) : tape}
          showingSamples={history.length === 0 && !settings.removeTapeExamples}
          printJob={printJob}
          rewinds={rewinds}
          dates={settings.dates}
          round2={settings.round2}
          narrow={settings.paper !== 'wide'}
          theme={t}
          resetKey={`${settings.paper}|${settings.dates}|${settings.finish}|${history.length === 0}|${settings.removeTapeExamples}`}
          onTouchPaper={() => {
            if (settings.focusView) setFocused(true);
          }}
        />
        <Casing
          theme={t}
          z={animatedZ}
          settledZ={z}
          vw={vw}
          vh={vh}
          calc={calc}
          sound={settings.sound}
          round2={settings.round2}
          paper={paper}
          onPress={(key) => {
            setFocused(false);
            pressKey(key);
          }}
          onTouchStart={() => setFocused(false)}
          onSettings={() => {
            setFocused(false);
            tap();
          }}
          onLayout={(e) => {
            // mid-glide the height doesn't correspond to z, so it can't be used to measure
            if (Date.now() < ignoreLayoutUntil.current) return;
            const h1 = e.nativeEvent.layout.height / z;
            if (Math.abs(h1 - casingH1) > 1) setCasingH1(h1);
          }}
        >
          {demo && <DemoOver limits={demo.limits} usage={demo.usage} theme={t} />}
        </Casing>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desk: { flex: 1, alignItems: 'center' },
  machine: { flex: 1 },
});
