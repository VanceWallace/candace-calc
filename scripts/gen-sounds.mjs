// Renders the prototype's Web Audio sounds (docs/candacecalc-prototype.html) to WAV files.
// Usage: node scripts/gen-sounds.mjs   -> assets/sounds/*.wav
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
const PITCH = 0.25; // the prototype plays every blip two octaves down

/** A mono buffer that voices are mixed into. */
function track(seconds) {
  return new Float32Array(Math.ceil(seconds * RATE));
}

/** Web Audio's linear and exponential ramps, as a piecewise envelope evaluated per sample. */
function envelope(points) {
  // points: [time, value, 'set' | 'lin' | 'exp']
  return (t) => {
    let prev = points[0];
    if (t <= prev[0]) return prev[1];
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      if (t <= p[0]) {
        const f = (t - prev[0]) / (p[0] - prev[0]);
        return p[2] === 'exp' ? prev[1] * Math.pow(p[1] / prev[1], f) : prev[1] + (p[1] - prev[1]) * f;
      }
      prev = p;
    }
    return prev[1];
  };
}

const waves = {
  square: (ph) => (ph % 1 < 0.5 ? 1 : -1),
  triangle: (ph) => {
    const x = ph % 1;
    return x < 0.25 ? 4 * x : x < 0.75 ? 2 - 4 * x : 4 * x - 4;
  },
};

/** RBJ biquad, matching BiquadFilterNode's lowpass/bandpass (frequency may vary per sample). */
function biquad(type, freqAt, Q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, t) => {
    const w0 = (2 * Math.PI * freqAt(t)) / RATE;
    const alpha = Math.sin(w0) / (2 * Q);
    const cos = Math.cos(w0);
    let b0, b1, b2;
    if (type === 'lowpass') {
      b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2;
    } else {
      b0 = alpha; b1 = 0; b2 = -alpha; // bandpass, constant 0 dB peak gain
    }
    const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

/** One oscillator voice: frequency envelope, gain envelope, optional filter, start/stop. */
function voice(buf, { start, stop, wave, freq, gain, filter }) {
  let phase = 0;
  const i0 = Math.floor(start * RATE);
  const i1 = Math.min(buf.length, Math.ceil(stop * RATE));
  for (let i = i0; i < i1; i++) {
    const t = i / RATE;
    phase += freq(t) / RATE;
    let s = waves[wave](phase);
    if (filter) s = filter(s, t);
    buf[i] += s * gain(t);
  }
}

/** The prototype's blip(): a short pitched beep through a 2.4 kHz lowpass. */
function blip(buf, t, freq, dur, vol, type = 'square') {
  freq *= PITCH;
  vol *= 1.35; // lower notes read quieter, so the prototype lifts the level a touch
  voice(buf, {
    start: t,
    stop: t + dur + 0.01,
    wave: type,
    freq: envelope([[t, freq, 'set'], [t + dur * 0.6, freq * 1.04, 'exp']]),
    gain: envelope([[t, 0.0001, 'set'], [t + 0.004, vol, 'lin'], [t + dur, 0.0008, 'exp']]),
    filter: biquad('lowpass', () => 2400, 1),
  });
}

function tap(kind) {
  const b = track(0.12);
  if (kind === 'digit') blip(b, 0, 880, 0.05, 0.07, 'square');
  else if (kind === 'equals') blip(b, 0, 1175, 0.07, 0.07, 'square');
  else if (kind === 'clear') blip(b, 0, 784, 0.07, 0.06, 'square');
  else if (kind === 'op') {
    blip(b, 0, 1397, 0.05, 0.065, 'triangle');
    blip(b, 0, 2794, 0.03, 0.02, 'square');
  } else blip(b, 0, 1319, 0.04, 0.06, 'triangle');
  return b;
}

/** Soft "zzip": filtered noise sweeping downward. */
function rip() {
  const b = track(0.24);
  const freq = envelope([[0, 1600, 'set'], [0.2, 420, 'exp']]);
  const gain = envelope([[0, 0.0001, 'set'], [0.02, 0.16, 'lin'], [0.22, 0.001, 'exp']]);
  const bp = biquad('bandpass', freq, 1.4);
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32) * 2 - 1;
  for (let i = 0; i < Math.floor(0.22 * RATE); i++) {
    const t = i / RATE;
    b[i] += bp(rand(), t) * gain(t);
  }
  return b;
}

/** Printer head: a chattering trill and a paper-advance "zip" per line, then a two-note chime. */
function print(lineCount) {
  const perLine = 0.15;
  const t0 = 0.02;
  const end = t0 + lineCount * perLine + 0.02;
  const b = track(end + 0.08 + 0.18);
  for (let l = 0; l < lineCount; l++) {
    const lt = t0 + l * perLine;
    for (let k = 0; k < 6; k++) blip(b, lt + k * 0.014, k % 2 ? 1760 : 2093, 0.012, 0.035, 'square');
    const ft = lt + 0.095;
    voice(b, {
      start: ft,
      stop: ft + 0.06,
      wave: 'triangle',
      freq: envelope([[ft, 130, 'set'], [ft + 0.045, 240, 'exp']]),
      gain: envelope([[ft, 0.0001, 'set'], [ft + 0.008, 0.06, 'lin'], [ft + 0.05, 0.0008, 'exp']]),
    });
  }
  blip(b, end, 1568, 0.09, 0.06, 'triangle');
  blip(b, end + 0.08, 2093, 0.16, 0.06, 'triangle');
  return b;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

mkdirSync(OUT, { recursive: true });
const files = {
  'key-digit': tap('digit'),
  'key-op': tap('op'),
  'key-fn': tap('fn'),
  'key-equals': tap('equals'),
  'key-clear': tap('clear'),
  rip: rip(),
};
for (let n = 1; n <= 8; n++) files[`print-${n}`] = print(n);
for (const [name, buf] of Object.entries(files)) {
  writeFileSync(join(OUT, name + '.wav'), wav(buf));
  console.log(`${name}.wav  ${(buf.length / RATE).toFixed(2)}s`);
}
