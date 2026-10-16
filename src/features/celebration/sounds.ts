/**
 * Web Audio API sound effects — synthesised, no external files.
 */

function pianoNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume = 0.35
) {
  const harmonics: [number, number, number][] = [
    [1.00, 1.00, 1.0],
    [2.00, 0.50, 1.3],
    [3.00, 0.25, 1.6],
    [4.00, 0.12, 2.0],
    [5.00, 0.06, 2.5],
    [6.00, 0.03, 3.0],
  ];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(volume, startTime + 0.004);
  masterGain.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + 0.08);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  masterGain.connect(ctx.destination);

  harmonics.forEach(([mult, relVol, decayMult]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = "sine";
    osc.frequency.value = frequency * mult;
    gain.gain.setValueAtTime(relVol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration / decayMult);
    osc.start(startTime);
    osc.stop(startTime + duration);
  });
}

/** Sparkle chime — four high bright notes shimmer upward on check-in. */
export function playCheckInSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx() as AudioContext;
    const t = ctx.currentTime;

    // C6 → E6 → G6 → C7 ascending sparkle
    const notes: [number, number, number][] = [
      [1046, 0.00, 0.20],
      [1318, 0.10, 0.16],
      [1568, 0.18, 0.12],
      [2093, 0.24, 0.10],
    ];

    notes.forEach(([freq, delay, vol]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(vol, t + delay + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.7);
      osc.start(t + delay);
      osc.stop(t + delay + 0.7);
    });

    setTimeout(() => ctx.close(), 1200);
  } catch { /* audio unavailable */ }
}

/** Ascending C major arpeggio — plays on milestone / confetti. */
export function playCelebrationSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx() as AudioContext;
    const t = ctx.currentTime;

    pianoNote(ctx, 523.25, t + 0.00, 0.6, 0.28); // C5
    pianoNote(ctx, 659.25, t + 0.14, 0.6, 0.28); // E5
    pianoNote(ctx, 783.99, t + 0.28, 0.6, 0.28); // G5
    pianoNote(ctx, 1046.5, t + 0.42, 1.0, 0.28); // C6 — long hold

    setTimeout(() => ctx.close(), 2000);
  } catch { /* audio unavailable */ }
}
