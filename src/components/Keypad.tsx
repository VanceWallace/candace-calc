import { StyleSheet } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import type { Key as KeyId } from '@/lib/calculator';
import type { Op } from '@/lib/format';
import type { Theme } from '@/theme';

import { Key, type KeyKind } from './Key';

type Def = [k: KeyId, label: string, kind: KeyKind, a11y?: string];

const ROWS: Def[][] = [
  [['AC', 'AC', 'clear', 'All clear'], ['BK', '⌫', 'fn', 'Delete last digit'], ['%', '%', 'fn', 'Percent'], ['/', '÷', 'op', 'Divide']],
  [['7', '7', 'digit'], ['8', '8', 'digit'], ['9', '9', 'digit'], ['*', '×', 'op', 'Multiply']],
  [['4', '4', 'digit'], ['5', '5', 'digit'], ['6', '6', 'digit'], ['-', '−', 'op', 'Subtract']],
  [['1', '1', 'digit'], ['2', '2', 'digit'], ['3', '3', 'digit'], ['+', '+', 'op', 'Add']],
  [['UNDO', 'UNDO', 'fn', 'Undo last action'], ['0', '0', 'digit'], ['.', '.', 'digit', 'Decimal point'], ['=', '=', 'eq', 'Equals and print']],
];

interface Props {
  theme: Theme;
  z: SharedValue<number>;
  settledZ: number;
  vw: number;
  vh: number;
  /** Operator to highlight (pending, waiting for the next number). */
  activeOp: Op | null;
  onPress: (k: KeyId) => void;
}

export function Keypad({ theme, z, settledZ, vw, vh, activeOp, onPress }: Props) {
  const height = Math.max(54, Math.min(70, 0.083 * vh));
  const pad = useAnimatedStyle(() => ({ gap: 11 * z.value, marginTop: 6 * z.value }));
  const row = useAnimatedStyle(() => ({ gap: 11 * z.value, height: height * z.value }));
  return (
    <Animated.View style={pad}>
      {ROWS.map((keys, i) => (
        <Animated.View key={i} style={[styles.row, row]}>
          {keys.map(([k, label, kind, a11y]) => (
            <Key
              key={k}
              k={k}
              label={label}
              kind={kind}
              a11y={a11y}
              active={kind === 'op' && activeOp === k}
              theme={theme}
              z={z}
              settledZ={settledZ}
              vw={vw}
              onPress={onPress}
            />
          ))}
        </Animated.View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
