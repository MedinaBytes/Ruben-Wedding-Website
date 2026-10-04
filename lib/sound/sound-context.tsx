"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { playSynthesizedSound, type SoundEffect } from "./synthesizer";

interface SoundContextValue {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  play: (effect: SoundEffect) => void;
  hasUnlockedAudio: boolean;
}

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "wedding_sound_enabled";

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [hasUnlockedAudio, setHasUnlockedAudio] = useState<boolean>(false);

  // Read stored preference once mounted
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setSoundEnabledState(stored === "true");
      }
    } catch {
      // Storage access disabled or restricted
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    } catch {}
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      } catch {}
      if (next) {
        playSynthesizedSound("toggle");
      }
      return next;
    });
  }, []);

  const play = useCallback(
    (effect: SoundEffect) => {
      // Any call to play marks user interaction and unlocks Web Audio
      setHasUnlockedAudio(true);
      if (soundEnabled) {
        playSynthesizedSound(effect);
      }
    },
    [soundEnabled],
  );

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, toggleSound, play, hasUnlockedAudio }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider
    return {
      soundEnabled: false,
      setSoundEnabled: () => {},
      toggleSound: () => {},
      play: () => {},
      hasUnlockedAudio: false,
    };
  }
  return context;
}
