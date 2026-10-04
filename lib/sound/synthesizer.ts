"use client";

/**
 * Procedural Web Audio Synthesizer
 * Zero external audio files or license risks.
 * Generates tactile, organic acoustic textures:
 * wax cracking, paper sliding, soft metallic shimmers, and harmonic blooms.
 */

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!globalAudioCtx) {
    globalAudioCtx = new AudioCtx();
  }
  if (globalAudioCtx.state === "suspended") {
    void globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

export type SoundEffect =
  | "seal-tap"
  | "envelope-open"
  | "card-reveal"
  | "button-click"
  | "rsvp-success"
  | "toggle";

export function playSynthesizedSound(effect: SoundEffect, volume = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 1)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  switch (effect) {
    case "seal-tap": {
      // Tactile wax crack: high-frequency noise snap + warm low resonant thump
      const now = ctx.currentTime;

      // Resonant bass pop
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.1);

      // Noise crack
      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(3, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.05);
      break;
    }

    case "envelope-open": {
      // Soft paper slide: smooth filtered white noise with gentle rise and fall
      const now = ctx.currentTime;
      const duration = 0.45;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(now);
      noise.stop(now + duration);
      break;
    }

    case "card-reveal": {
      // Soft celestial shimmer: ascending harmonic sine triad (E5, G#5, B5, E6)
      const now = ctx.currentTime;
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + index * 0.06;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.045, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.75);
      });
      break;
    }

    case "button-click": {
      // Subtle tactile micro-tick
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.02);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.025);
      break;
    }

    case "rsvp-success": {
      // Warm blooming chord chime: F#4, A#4, C#5, F#5 with long crystalline tail
      const now = ctx.currentTime;
      const chord = [369.99, 466.16, 554.37, 739.99];
      chord.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + index * 0.08;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.06, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + 1.5);
      });
      break;
    }

    case "toggle": {
      // High delicate chime tick
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1480, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }
  }
}
