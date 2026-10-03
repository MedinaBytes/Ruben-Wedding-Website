import { describe, expect, it } from "vitest";

import {
  generateInvitationToken,
  hashInvitationToken,
  invitationTokenSchema,
} from "./token";

describe("invitation tokens", () => {
  it("generates URL-safe tokens from 32 bytes of randomness", () => {
    const token = generateInvitationToken();

    expect(token).toHaveLength(43);
    expect(invitationTokenSchema.safeParse(token).success).toBe(true);
  });

  it("hashes valid tokens and rejects malformed values", () => {
    const token = "A".repeat(43);
    const hash = hashInvitationToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
    expect(() => hashInvitationToken("guest-name")).toThrow();
  });
});