import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { shortAgo } from '@/lib/format';
import { tapeIntro } from '@/lib/samples';
import type { TapeEntry as Entry } from '@/lib/tape';
import type { PrintJob } from '@/state/store';
import { type Theme, fonts, gradient } from '@/theme';

import { HistoryRail } from './HistoryRail';
import { TapeEntry } from './TapeEntry';
import { TornEdge } from './TornEdge';

interface Props {
  entries: Entry[];
  showingSamples: boolean;
  printJob: PrintJob | null;
  /** Entries being rewound by Undo, with the length of the rewind in ms. */
  rewinds: Record<string, number>;
  dates: boolean;
  round2: boolean;
  narrow: boolean;
  theme: Theme;
  /** Changes when the tape should jump back to the latest entry (layout settings changed). */
  resetKey: string;
  /** Horizontal placement (paper position setting). */
  style?: StyleProp<ViewStyle>;
  onTouchPaper?: () => void;
}

// Paper colour under the top shading, for the torn edge strip above the paper body.
const EDGE_COLOR = '#c5bdb2';

/** The paper tape: leans back from the printer slot, newest entry at the bottom. */
export function Tape({ entries, showingSamples, printJob, rewinds, dates, round2, narrow, theme: t, resetKey, style, onTouchPaper }: Props) {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const y = useSharedValue(0);
  const viewH = useSharedValue(0);
  const contentH = useSharedValue(0);
  const newestBottom = useSharedValue(0);
  const scroll = useMemo(() => ({ y, viewH, contentH, newestBottom }), [y, viewH, contentH, newestBottom]);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });

  // keep "x min ago" labels current; the tape itself is never rebuilt on a timer
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Jump to the latest entry on first layout, after each print, and when the layout changes.
  // Layout effects run before the native layout events for this render reach JS, so the
  // content size change that follows a print still sees the request.
  const stick = useRef<'jump' | 'smooth' | null>('jump');
  const settle = () => {
    if (!stick.current) return;
    ref.current?.scrollToEnd({ animated: stick.current === 'smooth' });
    stick.current = null;
  };
  const jobId = printJob?.id;
  const firstJob = useRef(true);
  useLayoutEffect(() => {
    if (firstJob.current) {
      firstJob.current = false;
      return;
    }
    if (jobId) stick.current = 'smooth';
  }, [jobId]);
  useLayoutEffect(() => {
    stick.current = 'jump';
    // a layout change that keeps the same content size still needs the jump
    const id = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- settle only reads refs
  }, [resetKey]);
  const [scrollable, setScrollable] = useState(false);
  const measured = () => setScrollable(contentH.get() - viewH.get() > 4);

  const rewinding = Object.keys(rewinds).length > 0;

  const [width, setWidth] = useState(0);
  const pad = narrow ? 13 : 18;

  return (
    <View onTouchStart={onTouchPaper} style={[styles.wrap, style]}>
      <View style={styles.tilt}>
        <TornEdge color={EDGE_COLOR} />
        <View
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={[
            styles.paper,
            {
              backgroundColor: t.paper,
              ...gradient('linear-gradient(180deg, rgba(70,52,34,0.28) 0%, rgba(70,52,34,0.12) 12%, rgba(70,52,34,0) 32%), ' +
                'linear-gradient(0deg, rgba(40,28,20,0.16) 0px, rgba(40,28,20,0) 14px), ' +
                `linear-gradient(90deg, ${t.paperShade} 0px, ${t.paper} 10px, ${t.paper} ${Math.max(10, width - 10)}px, ${t.paperShade} ${width}px)`),
            },
          ]}
        >
          <Animated.ScrollView
            ref={ref}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
            contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              // resting on the latest entry and the paper got shorter: keep that entry in view
              const keepEnd = h < viewH.get() && contentH.get() - viewH.get() - y.get() < 6;
              viewH.set(h);
              if (keepEnd) ref.current?.scrollToEnd({ animated: false });
              measured();
              settle();
            }}
            onContentSizeChange={(_w, h) => {
              const shrank = h < contentH.get();
              contentH.set(h);
              measured();
              // the paper follows an entry back into the printer
              if (shrank && rewinding) ref.current?.scrollToEnd({ animated: false });
              settle();
            }}
          >
            <Text allowFontScaling={false} style={[styles.empty, { color: t.inkFaint }]}>
              {tapeIntro(showingSamples)}
            </Text>
            {entries.map((e, i) => (
              <TapeEntry
                key={e.id}
                entry={e}
                now={now}
                dates={dates}
                round2={round2}
                narrow={narrow}
                last={i === entries.length - 1}
                printMs={printJob?.id === e.id ? printJob.ms : null}
                rewindMs={rewinds[e.id] ?? null}
                scroll={scroll}
                theme={t}
              />
            ))}
          </Animated.ScrollView>
        </View>
      </View>
      {scrollable && entries.length > 0 && (
        <HistoryRail
          scroll={scroll}
          label={shortAgo(entries[0].ts, now)}
          theme={t}
          onSeek={(f) => ref.current?.scrollTo({ y: f * (contentH.get() - viewH.get()), animated: false })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 150, marginBottom: -13, zIndex: 2 },
  tilt: { flex: 1, transformOrigin: 'bottom', transform: [{ perspective: 700 }, { rotateX: '13deg' }] },
  paper: { flex: 1, boxShadow: '0 6px 18px rgba(0,0,0,0.35)' },
  content: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: 11, paddingBottom: 44 },
  empty: { fontFamily: fonts.tape, fontSize: 17, lineHeight: 25, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 6, marginBottom: 'auto' },
});
