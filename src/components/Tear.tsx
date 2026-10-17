import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { seeded } from '@/lib/tape';

const HEIGHT = 16;
const POINTS = 26;

interface Props {
  /** % down the entry's lines where the tear crosses. */
  at: number;
  seed: number;
  /** Animate the tear running across, starting after this many ms; null shows it already torn. */
  delay: number | null;
}

/** A ragged dark gap where the paper was torn through. Runs past the text to the paper's edges. */
export function Tear({ at, seed, delay }: Props) {
  const d = useMemo(() => {
    const rand = seeded(seed);
    const top: string[] = [];
    const bottom: string[] = [];
    for (let i = 0; i <= POINTS; i++) top.push(`${(i / POINTS) * 100} ${(rand() * 0.38 * HEIGHT).toFixed(2)}`);
    for (let i = POINTS; i >= 0; i--) bottom.push(`${(i / POINTS) * 100} ${((0.62 + rand() * 0.38) * HEIGHT).toFixed(2)}`);
    return 'M' + top.join('L') + 'L' + bottom.join('L') + 'Z';
  }, [seed]);

  const progress = useSharedValue(delay === null ? 1 : 0);
  useEffect(() => {
    if (delay !== null) {
      progress.set(withDelay(delay, withTiming(1, { duration: 260, easing: Easing.bezier(0.3, 0.7, 0.2, 1) })));
    }
  }, [delay, progress]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  return (
    <Animated.View pointerEvents="none" style={[styles.rip, { top: `${at}%` }, style]}>
      <Svg width="100%" height={HEIGHT + 2} viewBox={`0 -1 100 ${HEIGHT + 2}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="rip" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1c140e" />
            <Stop offset="0.5" stopColor="#3a2c22" />
            <Stop offset="1" stopColor="#1c140e" />
          </LinearGradient>
        </Defs>
        {/* the torn paper fibres catch the light along both edges */}
        <Path d={d} fill="none" stroke="#fffdf6" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <Path d={d} fill="url(#rip)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rip: { position: 'absolute', left: -22, right: -22, height: HEIGHT + 2, marginTop: -(HEIGHT + 2) / 2, transformOrigin: 'left' },
});
