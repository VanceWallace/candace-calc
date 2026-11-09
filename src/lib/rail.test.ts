/// <reference types="node" />
import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { DAY, shortAgo } from './format';
import { RAIL_LABEL_SPACING, RAIL_LABEL_WIDTH, railLabelFontSize } from './rail';

/** Reads real glyph widths from the TrueType font the label is drawn with. */
function loadFont(file: string) {
  const buf = readFileSync(file);
  const tables = new Map<string, number>();
  for (let i = 0; i < buf.readUInt16BE(4); i++) {
    const at = 12 + i * 16;
    tables.set(buf.toString('latin1', at, at + 4), buf.readUInt32BE(at + 8));
  }
  const unitsPerEm = buf.readUInt16BE(tables.get('head')! + 18);
  const numHMetrics = buf.readUInt16BE(tables.get('hhea')! + 34);
  const hmtx = tables.get('hmtx')!;
  const cmap = tables.get('cmap')!;

  let fmt4 = -1;
  for (let i = 0; i < buf.readUInt16BE(cmap + 2); i++) {
    const sub = cmap + buf.readUInt32BE(cmap + 4 + i * 8 + 4);
    if (buf.readUInt16BE(sub) === 4) fmt4 = sub;
  }
  const segX2 = buf.readUInt16BE(fmt4 + 6);
  const glyphId = (code: number) => {
    for (let i = 0; i < segX2; i += 2) {
      if (code > buf.readUInt16BE(fmt4 + 14 + i)) continue;
      const startAt = fmt4 + 16 + segX2 + i;
      const start = buf.readUInt16BE(startAt);
      if (code < start) return 0;
      const delta = buf.readUInt16BE(startAt + segX2);
      const offsetAt = startAt + 2 * segX2;
      const offset = buf.readUInt16BE(offsetAt);
      if (offset === 0) return (code + delta) & 0xffff;
      const g = buf.readUInt16BE(offsetAt + offset + 2 * (code - start));
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  return (text: string, fontSize: number) => {
    let units = 0;
    for (const ch of text) {
      const g = glyphId(ch.charCodeAt(0));
      if (g === 0) throw new Error(`font has no glyph for ${ch}`);
      units += buf.readUInt16BE(hmtx + Math.min(g, numHMetrics - 1) * 4);
    }
    return (units / unitsPerEm) * fontSize + RAIL_LABEL_SPACING * text.length;
  };
}

const width = loadFont(join(process.cwd(), 'node_modules/@expo-google-fonts/archivo/700Bold/Archivo_700Bold.ttf'));

describe('history rail label', () => {
  const now = new Date(2026, 9, 17, 13, 0).getTime();
  // every age the rail can show, including well past the longest retention setting
  const labels = [...new Set(Array.from({ length: 2000 }, (_, d) => shortAgo(now - d * DAY - 1000, now)))];

  test('covers the labels that matter', () => {
    expect(labels).toEqual(expect.arrayContaining(['TODAY', '1D', '13D', '2W', '8W', '2MO', '66MO']));
  });

  test.each(labels)('%s fits on one line', (label) => {
    const size = railLabelFontSize(label);
    expect(width(label, size)).toBeLessThanOrEqual(RAIL_LABEL_WIDTH);
    expect(size).toBeGreaterThanOrEqual(8);
  });

  test('the measurement would have caught the original overflow', () => {
    expect(width('TODAY', 12)).toBeGreaterThan(36);
  });
});
