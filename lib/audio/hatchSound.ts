'use client';

type HatchCue = 'wiggle' | 'crack' | 'open';

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtor) return null;

  if (!audioContext) {
    audioContext = new AudioCtor();
  }

  return audioContext;
}

function shapeGain(
  ctx: AudioContext,
  gain: GainNode,
  now: number,
  points: Array<[number, number]>,
) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(points[0]?.[1] ?? 0, now);
  for (const [offset, value] of points.slice(1)) {
    gain.gain.linearRampToValueAtTime(value, now + offset);
  }
}

function playTone(
  ctx: AudioContext,
  {
    frequency,
    type,
    gainPoints,
    duration,
    detune = 0,
  }: {
    frequency: number;
    type: OscillatorType;
    gainPoints: Array<[number, number]>;
    duration: number;
    detune?: number;
  },
) {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.detune.setValueAtTime(detune, now);

  shapeGain(ctx, gain, now, gainPoints);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playNoiseBurst(
  ctx: AudioContext,
  {
    duration,
    lowpass,
    gainPoints,
  }: {
    duration: number;
    lowpass: number;
    gainPoints: Array<[number, number]>;
  },
) {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  source.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(lowpass, now);

  shapeGain(ctx, gain, now, gainPoints);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

export async function playHatchCue(cue: HatchCue, enabled: boolean) {
  if (!enabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  if (cue === 'wiggle') {
    playTone(ctx, {
      frequency: 190,
      type: 'sine',
      duration: 0.16,
      gainPoints: [
        [0, 0],
        [0.03, 0.06],
        [0.12, 0.02],
        [0.16, 0],
      ],
    });
    return;
  }

  if (cue === 'crack') {
    playNoiseBurst(ctx, {
      duration: 0.22,
      lowpass: 1800,
      gainPoints: [
        [0, 0],
        [0.01, 0.16],
        [0.08, 0.09],
        [0.22, 0],
      ],
    });
    playTone(ctx, {
      frequency: 420,
      type: 'triangle',
      duration: 0.2,
      detune: -120,
      gainPoints: [
        [0, 0],
        [0.02, 0.05],
        [0.14, 0.01],
        [0.2, 0],
      ],
    });
    return;
  }

  playTone(ctx, {
    frequency: 660,
    type: 'triangle',
    duration: 0.28,
    gainPoints: [
      [0, 0],
      [0.03, 0.08],
      [0.16, 0.05],
      [0.28, 0],
    ],
  });
  playTone(ctx, {
    frequency: 880,
    type: 'sine',
    duration: 0.32,
    detune: 8,
    gainPoints: [
      [0, 0],
      [0.05, 0.05],
      [0.2, 0.03],
      [0.32, 0],
    ],
  });
}
