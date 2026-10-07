import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resilientStore } from "@/lib/storage/resilient-store";

let cachedSettings: { data: Record<string, unknown>; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5000; // 5 seconds cache in memory

/**
 * Invalidate the in-memory settings cache so the next read fetches fresh data from Supabase.
 */
export function invalidateSettingsCache(): void {
  cachedSettings = null;
}

/**
 * Fetch effective site settings, prioritizing remote Supabase `site_settings` table,
 * merged over default local resilientStore settings.
 */
export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.expiresAt > now) {
    return { ...cachedSettings.data };
  }

  // Base defaults from resilientStore
  const settings: Record<string, unknown> = { ...resilientStore.getSettings() };

  try {
    const client = createSupabaseAdminClient();
    const { data, error } = await client.from("site_settings").select("key, value");

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row && typeof row.key === "string") {
          settings[row.key] = row.value;
        }
      }

      // Sync demo state to resilientStore memory
      if (typeof settings.enableDemoInvitation === "boolean") {
        resilientStore.setDemoEnabled(settings.enableDemoInvitation);
      }
    }
  } catch {
    // Supabase unavailable (e.g. offline unit tests) - retain local defaults
  }

  cachedSettings = {
    data: { ...settings },
    expiresAt: now + CACHE_TTL_MS,
  };

  return settings;
}

/**
 * Get a specific typed setting with optional fallback.
 */
export async function getSiteSetting<T = unknown>(key: string, defaultValue?: T): Promise<T> {
  const settings = await getSiteSettings();
  if (key in settings && settings[key] !== undefined && settings[key] !== null) {
    return settings[key] as T;
  }
  return defaultValue as T;
}

/**
 * Determine if demo mode is enabled (Sarah & Guest and /i/demo).
 * Strictly honors Supabase `site_settings` if configured, otherwise defaults to false in production.
 */
export async function isDemoEnabled(): Promise<boolean> {
  const settings = await getSiteSettings();
  if (typeof settings.enableDemoInvitation === "boolean") {
    return settings.enableDemoInvitation;
  }
  return process.env.NODE_ENV !== "production";
}
