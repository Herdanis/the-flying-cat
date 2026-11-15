// ============================================
// Sound
// ============================================

const KEY = 'dino-ladder.muted';

export type Sound = 'roll' | 'rocket' | 'hole' | 'win';

let ctx: AudioContext | null = null;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // storage can be blocked; mute still applies for this session
  }
}

function context(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  }
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

// One blip: exponential ramp needs non-zero edges, hence the tiny start gain.
function blip(
  audio: AudioContext,
  start: number,
  freq: number,
  ms: number,
  type: OscillatorType,
  volume: number,
  to?: number,
): void {
  const t0 = audio.currentTime + start;
  const end = t0 + ms / 1000;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, end);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(amp).connect(audio.destination);
  osc.start(t0);
  osc.stop(end + 0.02);
}

export function play(kind: Sound): void {
  if (muted) return;
  const audio = context();
  if (!audio) return;
  try {
    switch (kind) {
      case 'roll':
        blip(audio, 0, 260, 55, 'square', 0.05);
        blip(audio, 0.07, 190, 70, 'square', 0.04);
        break;
      case 'rocket':
        blip(audio, 0, 320, 280, 'triangle', 0.07, 900);
        break;
      case 'hole':
        blip(audio, 0, 520, 320, 'sine', 0.08, 140);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((freq, i) =>
          blip(audio, i * 0.11, freq, 180, 'triangle', 0.06),
        );
        break;
    }
  } catch {
    // audio is decoration; never break a turn over it
  }
}
