// Small synthesized sounds, no audio files needed.

let ctx = null;
let lastTick = 0;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function tick() {
  if (!ctx) return;
  const now = ctx.currentTime;
  // At high speed ticks would merge into a buzz; cap them at ~40 per second.
  if (now - lastTick < 0.025) return;
  lastTick = now;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

export function win() {
  if (!ctx) return;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = now + i * 0.09;
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}
