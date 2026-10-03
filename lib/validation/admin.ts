import { z } from "zod";

import { supportedLocales } from "../wedding-config";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional();

export const createInvitationSchema = z
  .object({
    displayName: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(254).optional(),
    phone: optionalText(40),
    greetingOverride: optionalText(300),
    language: z.enum(supportedLocales).optional(),
    groupName: optionalText(160),
    maxGuests: z.number().int().min(1).max(20),
    plusOneAllowed: z.boolean(),
    personalMessage: optionalText(2000),
    status: z.enum(["active", "draft"]).default("active"),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.plusOneAllowed && value.maxGuests < 2) {
      context.addIssue({ code: "custom", message: "plus_one_requires_two_places", path: ["maxGuests"] });
    }
  });

export type CreateInvitationPayload = z.infer<typeof createInvitationSchema>;
