import fs from "node:fs";

const sampleRate = 44100;

function writeWav(path, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }

  fs.writeFileSync(path, buffer);
}

function makeNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state / 0xffffffff) * 2 - 1;
  };
}

function makeStream(seconds) {
  const count = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(count);
  const noise = makeNoise(0x51a7e);
  let smoothA = 0;
  let smoothB = 0;

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    smoothA = smoothA * 0.985 + noise() * 0.015;
    smoothB = smoothB * 0.93 + noise() * 0.07;
    const ripple = Math.sin(t * Math.PI * 2 * 2.1) * 0.08 + Math.sin(t * Math.PI * 2 * 5.7) * 0.04;
    samples[i] = (smoothA * 0.95 + smoothB * 0.22 + ripple) * 0.42;
  }

  return samples;
}

function makeChime(seconds) {
  const count = Math.floor(sampleRate * seconds);
  const samples = new Float32Array(count);
  const notes = [261.63, 329.63, 392.0, 523.25];

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    let value = 0;
    for (let n = 0; n < notes.length; n += 1) {
      const local = (t + n * 0.42) % 2.8;
      const envelope = Math.exp(-local * 1.9);
      value += Math.sin(local * Math.PI * 2 * notes[n]) * envelope * 0.18;
      value += Math.sin(local * Math.PI * 2 * notes[n] * 2.01) * envelope * 0.035;
    }
    samples[i] = value;
  }

  return samples;
}

fs.mkdirSync("public/asset", { recursive: true });
writeWav("public/asset/stream.wav", makeStream(8));
writeWav("public/asset/chime.wav", makeChime(8));
