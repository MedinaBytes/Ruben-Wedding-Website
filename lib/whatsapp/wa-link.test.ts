import { describe, expect, it } from "vitest";
import {
  buildWhatsAppInvitationLink,
  buildWhatsAppReminderLink,
  getWhatsAppInvitationText,
  normalizePhoneForWaMe,
} from "./wa-link";

describe("WhatsApp wa.me click-to-chat links", () => {
  it("normalizes phone numbers to clean digits", () => {
    expect(normalizePhoneForWaMe("+43 660 123 4567")).toBe("436601234567");
    expect(normalizePhoneForWaMe("+34 (600) 88-99-00")).toBe("34600889900");
    expect(normalizePhoneForWaMe("")).toBe("");
    expect(normalizePhoneForWaMe(null)).toBe("");
  });

  it("builds localized invitation link with phone target", () => {
    const result = buildWhatsAppInvitationLink({
      phoneNumber: "+43 660 999888",
      guestName: "Don Fernando",
      invitationUrl: "https://theandyrubenwedding.website/i/fernando",
      language: "es",
    });

    expect(result.hasPhone).toBe(true);
    expect(result.url).toContain("https://wa.me/43660999888?text=");
    expect(result.text).toContain("¡Hola Don Fernando!");
    expect(result.text).toContain("https://theandyrubenwedding.website/i/fernando");
  });

  it("builds reminder link in German and Hungarian", () => {
    const deReminder = buildWhatsAppReminderLink({
      phoneNumber: "+43 1 234567",
      guestName: "Familie Weber",
      invitationUrl: "https://theandyrubenwedding.website/i/weber",
      daysLeft: 14,
      language: "de",
    });
    expect(deReminder.text).toContain("Liebe/r Familie Weber");
    expect(deReminder.text).toContain("noch 14 Tage");

    const huReminder = buildWhatsAppReminderLink({
      guestName: "Kovács Család",
      invitationUrl: "https://theandyrubenwedding.website/i/kovacs",
      daysLeft: 3,
      language: "hu",
    });
    expect(huReminder.hasPhone).toBe(false);
    expect(huReminder.url).toContain("https://wa.me/?text=");
    expect(huReminder.text).toContain("még 3 nap maradt");
  });
});
