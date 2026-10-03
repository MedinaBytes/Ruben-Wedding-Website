import { describe, expect, it } from "vitest";

import { getWeddingDateLabel, getWeddingInstant } from "./event-time";
import { weddingConfig } from "./wedding-config";

describe("wedding configuration", () => {
  it("keeps the ceremony date and timezone in the canonical config", () => {
    expect(weddingConfig.event.date).toBe("2027-10-02");
    expect(weddingConfig.event.localStart).toBe("2027-10-02T15:00:00");
    expect(weddingConfig.event.timeZone).toBe("Europe/Vienna");
  });

  it("keeps all supported locales in one place", () => {
    expect(weddingConfig.locales).toEqual(["en", "es", "de", "hu"]);
  });

  it("resolves the wedding start in Europe/Vienna, including daylight saving time", () => {
    expect(getWeddingInstant().toISOString()).toBe("2027-10-02T13:00:00.000Z");
  });

  it("formats the event date with a locale-specific weekday and month", () => {
    expect(getWeddingDateLabel("de", true)).toBe("Samstag, 2. Oktober 2027");
  });
});