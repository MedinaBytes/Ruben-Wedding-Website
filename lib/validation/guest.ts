import { z } from "zod";

import { supportedLocales } from "../wedding-config";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const rsvpPayloadSchema = z
  .object({
    attendanceStatus: z.enum(["yes", "no"]),
    attendeeCount: z.number().int().min(0).max(20),
    guestNames: z.array(z.string().trim().min(1).max(120)).max(19).default([]),
    dietaryRequirements: optionalText(1000),
    mealPreferences: z
      .array(
        z
          .object({
            guestName: z.string().trim().max(120),
            meal: z.enum(["classic", "fish", "vegetarian", "vegan", "kids", "standard"]).default("standard"),
            allergies: optionalText(500),
          })
          .strict(),
      )
      .optional()
      .default([]),
    notes: optionalText(2000),
    language: z.enum(supportedLocales),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.attendanceStatus === "yes" && value.attendeeCount < 1) {
      context.addIssue({ code: "custom", message: "attendee_count_required", path: ["attendeeCount"] });
    }
    if (value.attendanceStatus === "no" && (value.attendeeCount !== 0 || value.guestNames.length > 0)) {
      context.addIssue({ code: "custom", message: "declined_rsvp_has_no_attendees", path: ["attendeeCount"] });
    }
    if (value.guestNames.length > Math.max(0, value.attendeeCount - 1)) {
      context.addIssue({ code: "custom", message: "guest_names_exceed_attendee_count", path: ["guestNames"] });
    }
  });

export const songRequestPayloadSchema = z
  .object({
    requests: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(200),
            artist: optionalText(160),
            spotifyUrl: z.union([z.string().url().max(2048), z.literal("")]).optional().transform((value) => (value === "" ? undefined : value)),
          })
          .strict(),
      )
      .max(3),
    language: z.enum(supportedLocales),
  })
  .strict();

export const spotifySongSubmissionSchema = z
  .object({
    trackIds: z.array(z.string().regex(/^[A-Za-z0-9]{22}$/)).min(1).max(3),
    language: z.enum(supportedLocales),
  })
  .strict()
  .superRefine(({ trackIds }, context) => {
    if (new Set(trackIds).size !== trackIds.length) {
      context.addIssue({ code: "custom", message: "duplicate_tracks", path: ["trackIds"] });
    }
  });

export const singleSongSubmissionSchema = z.object({
  song: z.object({
    title: z.string().trim().min(1).max(200),
    artist: z.string().trim().max(160).nullable().optional(),
    spotifyUrl: z.union([z.string().url().max(2048), z.literal(""), z.null()]).optional().transform((val) => val || undefined),
    trackId: z.string().trim().max(100).nullable().optional(),
    artworkUrl: z.union([z.string().url().max(2048), z.literal(""), z.null()]).optional().transform((val) => val || undefined),
  }),
  language: z.enum(supportedLocales).optional().default("es"),
});

export type RsvpPayload = z.infer<typeof rsvpPayloadSchema>;
export type SongRequestPayload = z.infer<typeof songRequestPayloadSchema>;
export type SpotifySongSubmission = z.infer<typeof spotifySongSubmissionSchema>;
export type SingleSongSubmission = z.infer<typeof singleSongSubmissionSchema>;

export function isSingleSongSubmissionPayload(value: unknown): value is SingleSongSubmission {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (!("song" in candidate) || typeof candidate.song !== "object" || candidate.song === null) return false;
  return singleSongSubmissionSchema.safeParse(value).success;
}

export function isManualSongRequestPayload(value: unknown): value is SongRequestPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (!("requests" in candidate) || !Array.isArray(candidate.requests) || !("language" in candidate)) return false;
  return songRequestPayloadSchema.safeParse(value).success;
}

export function isSpotifySongSubmissionPayload(value: unknown): value is SpotifySongSubmission {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (!("trackIds" in candidate) || !Array.isArray(candidate.trackIds) || !("language" in candidate)) return false;
  return spotifySongSubmissionSchema.safeParse(value).success;
}

export function validateRsvpForInvitation(
  value: unknown,
  invitation: { maxGuests: number; plusOneAllowed: boolean },
) {
  const result = rsvpPayloadSchema.safeParse(value);
  if (!result.success) return { success: false as const, reason: "invalid_request" as const };

  const totalAllowed = invitation.maxGuests + (invitation.plusOneAllowed ? 1 : 0);
  if (result.data.attendeeCount > totalAllowed) {
    return { success: false as const, reason: "guest_limit" as const };
  }

  return { success: true as const, data: result.data };
}