"use client";

import { useSound } from "@/lib/sound";

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-pressed={soundEnabled}
      aria-label={soundEnabled ? "Mute ambient audio" : "Enable sound"}
      className="sound-toggle-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        background: "transparent",
        border: "1px solid rgba(180, 140, 145, 0.35)",
        borderRadius: "999px",
        padding: "0.3rem 0.75rem",
        fontSize: "0.75rem",
        fontFamily: "var(--font-body)",
        color: "var(--color-ink)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      <span aria-hidden="true" style={{ color: soundEnabled ? "#8C2836" : "#776A6C", fontSize: "0.85rem" }}>
        {soundEnabled ? "♫" : "✕"}
      </span>
      <span>{soundEnabled ? "Audio On" : "Muted"}</span>
    </button>
  );
}
