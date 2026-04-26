// =============================================
// BEAUTY & THE MATHS — Sound Engine
// Web Audio API — no external files needed
// =============================================

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function play(freq, type, duration, gainVal = 0.15, fadeOut = true) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(gainVal, ac.currentTime);
    if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (e) { /* silent fail */ }
}

export const sounds = {
  correct() {
    play(880, 'sine', 0.12, 0.1);
    setTimeout(() => play(1100, 'sine', 0.1, 0.08), 60);
  },
  wrong() {
    play(220, 'sawtooth', 0.18, 0.1);
  },
  timeout() {
    play(180, 'square', 0.3, 0.08);
    setTimeout(() => play(160, 'square', 0.2, 0.06), 100);
  },
  combo() {
    [880, 1046, 1318, 1760].forEach((f, i) => {
      setTimeout(() => play(f, 'sine', 0.1, 0.07), i * 50);
    });
  },
  sessionStart() {
    [440, 550, 660, 880].forEach((f, i) => {
      setTimeout(() => play(f, 'sine', 0.12, 0.06), i * 80);
    });
  },
  sessionEnd() {
    [660, 550, 440, 880].forEach((f, i) => {
      setTimeout(() => play(f, 'sine', 0.15, 0.08), i * 100);
    });
  },
  tick() {
    play(440, 'sine', 0.05, 0.03, false);
  }
};
