import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { ago, group, stampText } from '@/lib/format';
import type { TapeEntry as Entry } from '@/lib/tape';
import { type Theme, fonts } from '@/theme';

import { Tear } from './Tear';

export interface ScrollMetrics {
  y: SharedValue<number>;
  viewH: SharedValue<number>;
  contentH: SharedValue<number>;
}

interface Props {
  entry: Entry;
  now: number;
  dates: boolean;
  narrow: boolean;
  last: boolean;
  /** Set while this entry is being printed: the feed length in ms. */
  printMs: number | null;
  scroll: ScrollMetrics;
  theme: Theme;
}

const FEED_STEPS = 6;

function TapeEntryView({ entry: e, now, dates, narrow, last, printMs, scroll, theme: t }: Props) {
  // ---- depth: entries higher on the paper read as farther away, but only while resting on the latest
  const bottom = useSharedValue(0);
  const depth = useAnimatedStyle(() => {
    const max = scroll.contentH.value - scroll.viewH.value;
    const resting = max <= 4 || max - scroll.y.value < 6;
    if (!resting || scroll.viewH.value <= 0) return { opacity: 1 };
    const below = (scroll.y.value + scroll.viewH.value - bottom.value) / scroll.viewH.value;
    const d = Math.round(Math.pow(Math.max(0, Math.min(1, below)), 1.15) * 20) / 20;
    return { opacity: 1 - d * 0.32 };
  });

  // ---- print feed: the full height is reserved at once; the visible copy is revealed in steps
  const [printing, setPrinting] = useState(printMs !== null);
  const [height, setHeight] = useState(0);
  const feed = useSharedValue(0);
  useEffect(() => {
    if (printMs === null || height === 0) return;
    feed.set(withTiming(1, { duration: printMs, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(setPrinting, false);
    }));
  }, [printMs, height, feed]);
  const reveal = useAnimatedStyle(() => ({ height: (Math.floor(feed.value * FEED_STEPS) / FEED_STEPS) * height }));

  const body = (withTear: boolean) => (
    <View style={styles.entry}>
      {dates && (
        <View style={styles.stamp}>
          <Text allowFontScaling={false} style={[styles.stampText, styles.stampBold, { fontSize: narrow ? 13 : 15, color: t.stampBold }]}>
            {stampText(e.ts, now)}
          </Text>
          <Text
            allowFontScaling={false}
            style={[
              styles.stampText,
              { fontSize: narrow ? 13 : 15, color: t.inkFaint },
              (e.sample || e.voided) && { color: t.inkRed, fontFamily: fonts.tapeBold },
            ]}
          >
            {(e.voided ? 'CLEARED · ' : e.sample ? 'EXAMPLE · ' : '') + ago(e.ts, now)}
          </Text>
        </View>
      )}
      <View>
        {e.lines.map(([num, mark], i) => {
          const total = mark === '*';
          const size = total ? (narrow ? 22 : 27) : narrow ? 20 : 24;
          const neg = num.startsWith('-');
          const color = e.voided ? (neg ? t.voidNeg : t.voidInk) : neg ? t.inkRed : t.ink;
          return (
            <View key={i} style={[styles.line, total && { borderTopWidth: 1.5, borderTopColor: e.voided ? t.voidInk : t.ink, marginTop: 3, paddingTop: 2 }]}>
              <Text
                allowFontScaling={false}
                style={[styles.num, { fontSize: size, lineHeight: size * 1.25, color }, total && styles.bold]}
              >
                {group(num)}
              </Text>
              <Text
                allowFontScaling={false}
                style={[styles.mark, styles.bold, { fontSize: size, lineHeight: size * 1.25, width: size * 1.6, color: e.voided ? t.voidInk : t.ink }]}
              >
                {total ? '' : mark}
              </Text>
            </View>
          );
        })}
        {withTear && e.voided && e.rip && <Tear at={e.rip.at} seed={e.rip.seed} delay={printMs} />}
      </View>
    </View>
  );

  return (
    <Animated.View
      style={depth}
      onLayout={(ev) => {
        const { y, height: h } = ev.nativeEvent.layout;
        bottom.set(y + h);
        if (h !== height) setHeight(h);
      }}
    >
      {/* in-flow copy: reserves the space (hidden while the visible copy feeds out) and owns the tear */}
      <View style={printing ? styles.hidden : null}>{body(true)}</View>
      {printing && height > 0 && (
        <Animated.View pointerEvents="none" style={[styles.feed, reveal]}>
          {body(false)}
        </Animated.View>
      )}
      {!last && <Dash color={t.dash} />}
    </Animated.View>
  );
}

function Dash({ color }: { color: string }) {
  return (
    <Svg height={2} width="100%">
      <Line x1="0" y1="1" x2="100%" y2="1" stroke={color} strokeWidth={1.5} strokeDasharray="5 3.5" />
    </Svg>
  );
}

export const TapeEntry = memo(TapeEntryView);

const styles = StyleSheet.create({
  entry: { paddingTop: 10, paddingBottom: 12 },
  stamp: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, marginBottom: 6 },
  stampText: { fontFamily: fonts.tape, letterSpacing: 0.6 },
  stampBold: { fontFamily: fonts.tapeBold },
  line: { flexDirection: 'row' },
  num: { flex: 1, textAlign: 'right', fontFamily: fonts.tape, fontVariant: ['tabular-nums'] },
  mark: { textAlign: 'right', fontFamily: fonts.tapeBold },
  bold: { fontFamily: fonts.tapeBold },
  hidden: { opacity: 0 },
  feed: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
});
