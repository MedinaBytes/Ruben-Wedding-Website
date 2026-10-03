import { z } from "zod";

import { supportedLocales } from "../wedding-config";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const rsvpPayloadSchema = z
  .object({
    attendanceStatus: z.enum(["yes", "no"]),
    attendeeCount: z.number().int().min(0).max(20),
    guestNames: z.array(z.string().trim().min(1).max(120)).max(19).default([]),
    dietaryRequirements: optionalText(1000),
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
            spotifyUrl: z.string().url().max(2048).optional(),
          })
          .strict(),
      )
      .max(3),
    language: z.enum(supportedLocales),
  })
  .strict();

export type RsvpPayload = z.infer<typeof rsvpPayloadSchema>;
export type SongRequestPayload = z.infer<typeof songRequestPayloadSchema>;

export function validateRsvpForInvitation(
  value: unknown,
  invitation: { maxGuests: number; plusOneAllowed: boolean },
) {
  const result = rsvpPayloadSchema.safeParse(value);
  if (!result.success) return { success: false as const, reason: "invalid_request" as const };

  if (
    result.data.attendeeCount > invitation.maxGuests ||
    (!invitation.plusOneAllowed && result.data.attendeeCount > 1)
  ) {
    return { success: false as const, reason: "guest_limit" as const };
  }

  return { success: true as const, data: result.data };
}