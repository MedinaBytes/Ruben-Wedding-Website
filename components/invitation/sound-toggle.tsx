"use client";

import { useSound } from "@/lib/sound";

export function SoundToggle({
  labelOn = "Audio On",
  labelOff = "Muted",
}: {
  labelOn?: string;
  labelOff?: string;
} = {}) {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Mute audio" : "Enable sound"}
      className={`sound-toggle-btn ${soundEnabled ? "is-active" : ""}`}
      title={soundEnabled ? labelOn : labelOff}
    >
      <span className="sound-toggle-btn__icon" aria-hidden="true">
        {soundEnabled ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </span>
      <span className="sound-toggle-btn__text">{soundEnabled ? labelOn : labelOff}</span>
    </button>
  );
}

