import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Retention } from '@/lib/tape';
import type { PaperPosition, Settings } from '@/state/storage';
import { useStore } from '@/state/store';
import { type Theme, fonts, themeFor } from '@/theme';

export default function SettingsSheet() {
  const { settings, history, updateSettings, clearHistory, tap } = useStore();
  const t = themeFor(settings.finish);
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  const set = (patch: Partial<Settings>) => {
    tap();
    updateSettings(patch);
  };
  const n = history.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.casing }}
      contentContainerStyle={[styles.inner, { paddingBottom: 22 + insets.bottom }]}
    >
      <Text allowFontScaling={false} style={[styles.title, { color: t.keyInk }]}>
        Settings
      </Text>

      <Group label="Paper position" theme={t}>
        <Segmented<PaperPosition>
          theme={t}
          columns={2}
          value={settings.paper}
          options={[
            ['wide', 'Wide center'],
            ['narrow', 'Narrow center'],
            ['left', 'Left'],
            ['right', 'Right'],
          ]}
          onChange={(paper) => set({ paper })}
        />
      </Group>

      <Group label="Calculator color" theme={t}>
        <Segmented
          theme={t}
          columns={2}
          value={settings.finish}
          options={[
            ['light', 'Light'],
            ['dark', 'Dark'],
          ]}
          onChange={(finish) => set({ finish })}
        />
      </Group>

      <Group label="Keep tape history for" theme={t}>
        <Segmented<Retention>
          theme={t}
          columns={3}
          value={settings.retention}
          options={[
            [30, '30 days'],
            [60, '60 days'],
            [90, '90 days'],
          ]}
          onChange={(retention) => set({ retention })}
        />
        <Text style={[styles.note, { color: t.note }]}>
          {(n === 0 ? 'No calculations saved yet' : n === 1 ? '1 calculation saved' : `${n} calculations saved`) +
            ' on this device. Older entries are removed automatically.'}
        </Text>
      </Group>

      <View style={styles.group}>
        <Toggle
          theme={t}
          label="Key and printer sounds"
          value={settings.sound}
          // turning sound on plays the click, turning it off stays silent
          onChange={(sound) => {
            updateSettings({ sound });
            tap();
          }}
        />
        <Toggle theme={t} label="Date and time on tape" value={settings.dates} onChange={(dates) => set({ dates })} />
        <Toggle theme={t} label="Round to 0.00" value={settings.round2} onChange={(round2) => set({ round2 })} />
      </View>

      <View style={styles.group}>
        <RowButton theme={t} danger label="Clear tape history" onPress={() => setConfirming(true)} />
        {confirming && (
          <View style={[styles.confirm, { backgroundColor: t.panel }]}>
            <Text style={[styles.confirmText, { color: t.keyInk }]}>
              Remove every calculation from the tape? This can’t be undone.
            </Text>
            <View style={styles.pair}>
              <RowButton theme={t} label="Keep it" onPress={() => setConfirming(false)} />
              <RowButton
                theme={t}
                danger
                label="Clear"
                onPress={() => {
                  clearHistory();
                  setConfirming(false);
                }}
              />
            </View>
          </View>
        )}
      </View>

      <RowButton theme={t} label="Done" onPress={() => router.back()} />
    </ScrollView>
  );
}

function Group({ label, theme: t, children }: { label: string; theme: Theme; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text allowFontScaling={false} style={[styles.groupLabel, { color: t.casingInk }]}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Segmented<T extends string | number>({
  theme: t,
  columns,
  value,
  options,
  onChange,
}: {
  theme: Theme;
  columns: 2 | 3;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.seg}>
      {options.map(([v, label]) => (
        <View key={String(v)} style={{ width: columns === 2 ? '48.5%' : '31.5%' }}>
          <Btn theme={t} label={label} selected={v === value} onPress={() => onChange(v)} />
        </View>
      ))}
    </View>
  );
}

function Toggle({ theme: t, label, value, onChange }: { theme: Theme; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, { color: t.keyInk }]}>{label}</Text>
      <View style={{ minWidth: 110 }}>
        <Btn theme={t} label={value ? 'On' : 'Off'} selected={value} onPress={() => onChange(!value)} />
      </View>
    </View>
  );
}

function RowButton(props: { theme: Theme; label: string; danger?: boolean; onPress: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Btn {...props} />
    </View>
  );
}

function Btn({
  theme: t,
  label,
  selected,
  danger,
  onPress,
}: {
  theme: Theme;
  label: string;
  selected?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  const [bg, edge, ink] = danger
    ? [t.keyRed, t.keyRedEdge, t.keyInkLight]
    : selected
      ? [t.keyBrown, t.keyBrownEdge, t.keyInkLight]
      : [t.keyCream, t.keyCreamEdge, t.keyInk];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected !== undefined ? { selected } : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          boxShadow: pressed ? '0 1px 0 rgba(0,0,0,0.3)' : `0 4px 0 ${edge}`,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}
    >
      <Text style={[styles.btnText, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: { paddingTop: 26, paddingHorizontal: 20, gap: 20, maxWidth: 500, width: '100%', alignSelf: 'center' },
  title: { fontFamily: fonts.key, fontSize: 24, letterSpacing: 0.5 },
  group: { gap: 10 },
  groupLabel: { fontFamily: fonts.keyBold, fontSize: 13, letterSpacing: 1.8 },
  note: { fontFamily: fonts.keySemi, fontSize: 16, lineHeight: 22 },
  seg: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleLabel: { flex: 1, fontFamily: fonts.keyBold, fontSize: 20 },
  btn: { minHeight: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  btnText: { fontFamily: fonts.keyBold, fontSize: 20 },
  confirm: { gap: 10, borderRadius: 12, padding: 14 },
  confirmText: { fontFamily: fonts.keySemi, fontSize: 18, lineHeight: 25 },
  pair: { flexDirection: 'row', gap: 10 },
});
