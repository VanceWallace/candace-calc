import { StyleSheet, View } from 'react-native';

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
  [['NEG', '+/−', 'fn', 'Change sign'], ['0', '0', 'digit'], ['.', '.', 'digit', 'Decimal point'], ['=', '=', 'eq', 'Equals and print']],
];

interface Props {
  theme: Theme;
  z: number;
  vw: number;
  vh: number;
  /** Operator to highlight (pending, waiting for the next number). */
  activeOp: Op | null;
  onPress: (k: KeyId) => void;
}

export function Keypad({ theme, z, vw, vh, activeOp, onPress }: Props) {
  const height = Math.max(54, Math.min(70, 0.083 * vh));
  const gap = 11 * z;
  return (
    <View style={{ gap, marginTop: 6 * z }}>
      {ROWS.map((row, i) => (
        <View key={i} style={[styles.row, { gap }]}>
          {row.map(([k, label, kind, a11y]) => (
            <Key
              key={k}
              k={k}
              label={label}
              kind={kind}
              a11y={a11y}
              active={kind === 'op' && activeOp === k}
              theme={theme}
              z={z}
              vw={vw}
              height={height}
              onPress={onPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
