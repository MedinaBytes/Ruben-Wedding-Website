"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
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
const CHANGE_EVENT = "wedding_sound_changed";

function subscribeSound(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getSoundSnapshot(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const soundEnabled = useSyncExternalStore(subscribeSound, getSoundSnapshot, getServerSnapshot);
  const [hasUnlockedAudio, setHasUnlockedAudio] = useState<boolean>(false);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {}
  }, []);

  const toggleSound = useCallback(() => {
    try {
      const next = !getSoundSnapshot();
      localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      window.dispatchEvent(new Event(CHANGE_EVENT));
      if (next) {
        playSynthesizedSound("toggle");
      }
    } catch {}
  }, []);

  const play = useCallback(
    (effect: SoundEffect) => {
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
