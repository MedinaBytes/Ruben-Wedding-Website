import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeLookupValue } from "@/lib/invitations/lookup-normalize";

const { adminClientFactory, cookieDelete, cookieGet, cookieSet, rateLimitRpc } = vi.hoisted(() => ({
  adminClientFactory: vi.fn(),
  cookieDelete: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  rateLimitRpc: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet, set: cookieSet, delete: cookieDelete }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: adminClientFactory,
}));

describe("lookup invitation normalization", () => {
  it("normalizes names without losing their accents", () => {
    expect(normalizeLookupValue("  JOSÉ   García  ")).toEqual({ kind: "name", value: "josé garcía" });
  });

  it("normalizes email casing", () => {
    expect(normalizeLookupValue(" MULLER@Example.com ")).toEqual({ kind: "email", value: "muller@example.com" });
  });

  it("normalizes formatted international phone numbers to E.164", () => {
    expect(normalizeLookupValue("+43 (660) 123-4567")).toEqual({ kind: "phone", value: "+436601234567" });
  });

  it("rejects invalid email and phone inputs", () => {
    expect(normalizeLookupValue("person@invalid")).toBeNull();
    expect(normalizeLookupValue("+43 12")).toBeNull();
    expect(normalizeLookupValue(" ")).toBeNull();
  });
});

function mockLookupClient(results: Record<string, unknown[]>) {
  const aliasInsert = vi.fn(async () => ({ error: null }));
  const from = vi.fn((table: string) => {
    if (table === "invitation_token_aliases") return { insert: aliasInsert };

    const filters: Record<string, string> = {};
    const query: Record<string, unknown> = {
      select: () => query,
      eq: (column: string, value: string) => {
        filters[column] = value;
        return query;
      },
      limit: () => query,
      then: (resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) => {
        const lookupValue = Object.entries(filters).find(([column]) => column !== "status")?.[1];
        const result = lookupValue ? results[lookupValue] ?? [] : [];
        return Promise.resolve({ data: result, error: null }).then(resolve, reject);
      },
    };
    return query;
  });

  return {
    client: { from, rpc: rateLimitRpc },
    aliasInsert,
    from,
  };
}

describe("lookupInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("LOOKUP_RATE_LIMIT_SECRET", "test-only-rate-secret");
    cookieGet.mockReturnValue({ value: "a".repeat(43) });
    rateLimitRpc.mockResolvedValue({ data: true, error: null });
  });

  it("mints a hashed token alias only for one exact active match", async () => {
    const invitation = {
      id: "11111111-1111-4111-8111-111111111111",
      display_name: "Alex Example",
      greeting_override: null,
    };
    const mock = mockLookupClient({ "alex@example.com": [invitation] });
    adminClientFactory.mockReturnValue(mock.client);
    const { lookupInvitation } = await import("./lookup-invitation");

    const result = await lookupInvitation(" ALEX@example.com ", "en");

    expect(result).toMatchObject({ success: true, displayName: "Alex Example" });
    expect(result.success && "url" in result).toBe(false);
    expect(mock.aliasInsert).not.toHaveBeenCalled();
    expect(cookieSet).toHaveBeenCalledWith("guest_lookup_match", expect.any(String), expect.any(Object));
    expect(cookieSet).toHaveBeenCalledWith(`wedding_manual_locale_${invitation.id}`, "en", expect.any(Object));
  });

  it("issues the hashed route token only after a valid confirmation grant", async () => {
    const invitation = {
      id: "11111111-1111-4111-8111-111111111111",
      display_name: "Alex Example",
      greeting_override: null,
    };
    const payload = Buffer.from(`${invitation.id}|en|${Date.now() + 60_000}`).toString("base64url");
    const signature = createHmac("sha256", "test-only-rate-secret").update(payload).digest("hex");
    cookieGet.mockImplementation((name: string) => name === "guest_lookup_match" ? { value: `${payload}.${signature}` } : undefined);
    const mock = mockLookupClient({ [invitation.id]: [invitation] });
    adminClientFactory.mockReturnValue(mock.client);
    const { issueInvitationUrl } = await import("./lookup-invitation");

    const result = await issueInvitationUrl();

    expect(result.success).toBe(true);
    if (!result.success) throw new Error("Expected confirmation token issuance to succeed.");
    expect(result.url).toMatch(/^\/i\/[A-Za-z0-9_-]{43}$/);
    expect(mock.aliasInsert).toHaveBeenCalledWith({
      invitation_id: invitation.id,
      token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(cookieDelete).toHaveBeenCalledWith("guest_lookup_match");
  });

  it("returns the same generic result for multiple matching invitations", async () => {
    const matches = [
      { id: "invitation-one", display_name: "Alex Example", greeting_override: null },
      { id: "invitation-two", display_name: "Alex Example", greeting_override: null },
    ];
    const mock = mockLookupClient({ "alex example": matches });
    adminClientFactory.mockReturnValue(mock.client);
    const { lookupInvitation } = await import("./lookup-invitation");

    const result = await lookupInvitation("Alex Example", "en");

    expect(result).toEqual({ success: false, reason: "not_found" });
    expect(mock.aliasInsert).not.toHaveBeenCalled();
  });

  it("does not query candidates after a rate limit is reached", async () => {
    const mock = mockLookupClient({});
    adminClientFactory.mockReturnValue(mock.client);
    rateLimitRpc.mockResolvedValueOnce({ data: false, error: null }).mockResolvedValueOnce({ data: true, error: null });
    const { lookupInvitation } = await import("./lookup-invitation");

    const result = await lookupInvitation("Alex Example", "en");

    expect(result).toEqual({ success: false, reason: "rate_limited" });
    expect(mock.from).not.toHaveBeenCalledWith("invitations");
  });
});
