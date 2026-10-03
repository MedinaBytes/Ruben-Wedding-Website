import { describe, expect, it } from "vitest";

import { createInvitationSchema } from "./admin";

describe("admin invitation validation", () => {
  const baseInvitation = {
    displayName: "Alex & Sam",
    maxGuests: 2,
    plusOneAllowed: true,
  };

  it("accepts an active invitation with an allowed additional guest", () => {
    expect(createInvitationSchema.safeParse(baseInvitation).success).toBe(true);
  });

  it("accepts optional email and international phone lookup contacts", () => {
    expect(createInvitationSchema.safeParse({
      ...baseInvitation,
      email: "alex@example.com",
      phone: "+43 660 123 4567",
    }).success).toBe(true);
  });

  it("rejects malformed email lookup contacts", () => {
    expect(createInvitationSchema.safeParse({ ...baseInvitation, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an additional guest when only one place is available", () => {
    expect(createInvitationSchema.safeParse({ ...baseInvitation, maxGuests: 1 }).success).toBe(false);
  });

  it("rejects unknown fields so the API cannot silently widen its contract", () => {
    expect(createInvitationSchema.safeParse({ ...baseInvitation, administrator: true }).success).toBe(false);
  });
});
