import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{4,64}$/);

export function generateInvitationToken() {
  return randomBytes(8).toString("base64url");
}

export function hashInvitationToken(token: string) {
  const validatedToken = invitationTokenSchema.parse(token);
  return createHash("sha256").update(validatedToken).digest("hex");
}