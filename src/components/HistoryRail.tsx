import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { type Theme, fonts, gradient } from '@/theme';

import type { ScrollMetrics } from './TapeEntry';

interface Props {
  scroll: ScrollMetrics;
  /** How far back the tape goes ("8D", "5W", ...). */
  label: string;
  theme: Theme;
  /** Jump the tape to a fraction (0 = oldest, 1 = latest) of its scroll range. */
  onSeek: (fraction: number) => void;
}

/** How far back the tape goes, and where you are in it. Drag it to jump through history. */
export function HistoryRail({ scroll, label, theme: t, onSeek }: Props) {
  const trackH = useSharedValue(0);
  const track = useRef<View>(null);
  const trackTop = useRef(0);

  const thumb = useAnimatedStyle(() => {
    const vh = scroll.viewH.value;
    const ch = Math.max(scroll.contentH.value, 1);
    const max = Math.max(1, ch - vh);
    const h = Math.max(26, (trackH.value * vh) / ch);
    const f = Math.max(0, Math.min(1, scroll.y.value / max));
    return { height: h, transform: [{ translateY: (trackH.value - h) * f }] };
  });
  const nowDot = useAnimatedStyle(() => {
    const max = scroll.contentH.value - scroll.viewH.value;
    return { opacity: max - scroll.y.value < 6 ? 1 : 0.25 };
  });

  const seek = (pageY: number) => {
    const h = trackH.get();
    if (h > 0) onSeek(Math.max(0, Math.min(1, (pageY - trackTop.current) / h)));
  };

  return (
    <View
      style={styles.rail}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        const pageY = e.nativeEvent.pageY;
        track.current?.measureInWindow((_x, y) => {
          trackTop.current = y;
          seek(pageY);
        });
      }}
      onResponderMove={(e) => seek(e.nativeEvent.pageY)}
    >
      <Text allowFontScaling={false} style={[styles.label, { color: t.railLabel }]}>
        {label}
      </Text>
      <View ref={track} style={styles.track} onLayout={(e) => trackH.set(e.nativeEvent.layout.height)}>
        <Animated.View style={[styles.thumb, gradient(`linear-gradient(90deg, #efe6d2, ${t.paper} 50%, #d8ccb2)`), thumb]} />
      </View>
      <Animated.View style={[styles.now, { backgroundColor: t.lcdGlow }, nowDot]} />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { position: 'absolute', right: -22, top: 10, bottom: 25, width: 22, alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.keyBold, fontSize: 10, letterSpacing: 0.4, lineHeight: 11, textAlign: 'center' },
  track: { flex: 1, width: 6, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' },
  thumb: { position: 'absolute', left: -2, right: -2, top: 0, borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.45)' },
  now: { width: 8, height: 8, borderRadius: 4, boxShadow: '0 0 6px rgba(255,170,20,0.7)' },
});
