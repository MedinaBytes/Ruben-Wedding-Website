import { describe, expect, it } from "vitest";

import { deriveInvitationStatus, resolveLocalePreference } from "../invitations/status";
import { supportedLocales } from "../wedding-config";
import {
  isManualSongRequestPayload,
  isSpotifySongSubmissionPayload,
  songRequestPayloadSchema,
  spotifySongSubmissionSchema,
  validateRsvpForInvitation,
} from "./guest";

describe("guest request validation", () => {
  it("enforces the invitation guest allowance and plus-one flag", () => {
    const allowed = validateRsvpForInvitation(
      { attendanceStatus: "yes", attendeeCount: 2, guestNames: ["Test Guest"], language: "en" },
      { maxGuests: 2, plusOneAllowed: true },
    );
    const denied = validateRsvpForInvitation(
      { attendanceStatus: "yes", attendeeCount: 2, guestNames: ["Test Guest"], language: "en" },
      { maxGuests: 1, plusOneAllowed: false },
    );

    expect(allowed.success).toBe(true);
    expect(denied).toEqual({ success: false, reason: "guest_limit" });
  });

  it("accepts up to three song requests and rejects a fourth", () => {
    const threeSongs = ["One", "Two", "Three"].map((title) => ({ title }));
    const fourSongs = [...threeSongs, { title: "Four" }];

    expect(songRequestPayloadSchema.safeParse({ requests: threeSongs, language: "en" }).success).toBe(true);
    expect(songRequestPayloadSchema.safeParse({ requests: fourSongs, language: "en" }).success).toBe(false);
  });

  it("distinguishes manual song requests from Spotify track submissions", () => {
    const manualPayload = {
      requests: [{ title: "Love Song", artist: "The Artist", spotifyUrl: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh" }],
      language: "en",
    };
    const spotifyPayload = {
      trackIds: ["4iV5W9uYEdYUVa79Axb7Rh", "1301WleyT98MSxVHPZCA6M"],
      language: "en",
    };

    expect(isManualSongRequestPayload(manualPayload)).toBe(true);
    expect(isSpotifySongSubmissionPayload(spotifyPayload)).toBe(true);
    expect(isManualSongRequestPayload(spotifyPayload)).toBe(false);
    expect(isSpotifySongSubmissionPayload(manualPayload)).toBe(false);
  });

  it("accepts at most three valid, distinct Spotify track IDs", () => {
    const trackIds = ["4iV5W9uYEdYUVa79Axb7Rh", "1301WleyT98MSxVHPZCA6M", "0eGsygTp906u18L0OimcLq"];

    expect(spotifySongSubmissionSchema.safeParse({ trackIds, language: "en" }).success).toBe(true);
    expect(spotifySongSubmissionSchema.safeParse({ trackIds: trackIds.slice(0, 2), language: "en" }).success).toBe(true);
    expect(spotifySongSubmissionSchema.safeParse({ trackIds: [...trackIds, "3n3Ppam7vgaVa1iaRUc9Lp"], language: "en" }).success).toBe(false);
    expect(spotifySongSubmissionSchema.safeParse({ trackIds: [trackIds[0], trackIds[0]], language: "en" }).success).toBe(false);
    expect(spotifySongSubmissionSchema.safeParse({ trackIds: ["not-a-spotify-id"], language: "en" }).success).toBe(false);
  });

  it("resolves locale using invitation, manual, browser, then English priority", () => {
    expect(resolveLocalePreference("de-AT", "es", "hu", supportedLocales)).toBe("de-AT");
    expect(resolveLocalePreference(undefined, "es", "hu", supportedLocales)).toBe("es");
    expect(resolveLocalePreference(undefined, undefined, "hu", supportedLocales)).toBe("hu");
    expect(resolveLocalePreference("unknown", undefined, "unknown", supportedLocales)).toBe("en");
  });

  it("derives invitation status from activity and RSVP", () => {
    expect(deriveInvitationStatus({ invitationStatus: "active", wasOpened: false, attendanceStatus: null })).toBe("NOT_OPENED");
    expect(deriveInvitationStatus({ invitationStatus: "active", wasOpened: true, attendanceStatus: null })).toBe("OPENED_PENDING");
    expect(deriveInvitationStatus({ invitationStatus: "active", wasOpened: true, attendanceStatus: "yes" })).toBe("CONFIRMED");
    expect(deriveInvitationStatus({ invitationStatus: "active", wasOpened: true, attendanceStatus: "no" })).toBe("DECLINED");
    expect(deriveInvitationStatus({ invitationStatus: "revoked", wasOpened: false, attendanceStatus: null })).toBe("REVOKED");
  });
});