// Tiny Web Audio sound utils - no external files
let ctx;
const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
};

export const playTick = (volume = 0.08) => {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = 1200;
  g.gain.value = volume;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
  o.stop(c.currentTime + 0.05);
};

export const playChime = (freq = 880) => {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(c.destination);
  g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
  o.start();
  o.stop(c.currentTime + 0.65);
};

export const playSuccess = () => {
  const c = getCtx();
  if (!c) return;
  // Pleasant two-note chime
  [660, 990].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime + i * 0.12;
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.start(t);
    o.stop(t + 0.55);
  });
};

export const playWrong = () => {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.value = 180;
  g.gain.value = 0.0001;
  o.connect(g);
  g.connect(c.destination);
  g.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
  o.frequency.exponentialRampToValueAtTime(90, c.currentTime + 0.4);
  o.start();
  o.stop(c.currentTime + 0.55);
};

// Schedule a series of ticks that slow down over duration
export const playSpinTicks = (duration = 4000) => {
  const start = performance.now();
  const tick = () => {
    const elapsed = performance.now() - start;
    if (elapsed >= duration) return;
    playTick(0.06);
    // Progressively slower
    const progress = elapsed / duration;
    const interval = 60 + progress * 260; // 60ms -> 320ms
    setTimeout(tick, interval);
  };
  tick();
};
