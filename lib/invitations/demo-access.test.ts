import { beforeEach, describe, expect, it, vi } from "vitest";
import { resilientStore } from "@/lib/storage/resilient-store";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

const { findActiveInvitationByToken } = await import("./store");

describe("public /i/demo accessibility guard", () => {
  beforeEach(() => {
    resilientStore.setDemoEnabled(true);
  });

  it("resolves demo invitation when demo is enabled", async () => {
    const inv = await findActiveInvitationByToken("demo");
    expect(inv).not.toBeNull();
    expect(inv?.display_name).toContain("Sarah & Guest");
  });

  it("returns null for /i/demo when demo mode is disabled for production", async () => {
    resilientStore.setDemoEnabled(false);

    const inv = await findActiveInvitationByToken("demo");
    expect(inv).toBeNull();

    const invById = await findActiveInvitationByToken("00000000-0000-0000-0000-000000000001");
    expect(invById).toBeNull();
  });
});
