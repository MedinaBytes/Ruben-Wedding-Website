import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();
const authMock = vi.fn();
const auditMock = vi.fn();
const rpcMock = vi.fn();
const purgeMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/admin/auth", () => ({
  getAuthenticatedAdminIdentity: authMock,
}));

vi.mock("@/lib/admin/audit", () => ({
  recordAdminAudit: auditMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    rpc: rpcMock,
  }),
}));

vi.mock("@/lib/storage/resilient-store", () => ({
  resilientStore: {
    purgeWeddingData: purgeMock,
  },
}));

describe("deleteWeddingData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
    rpcMock.mockResolvedValue({ error: null });
    auditMock.mockResolvedValue(undefined);
    redirectMock.mockImplementation((url: string) => {
      throw new Error(`redirect:${url}`);
    });
  });

  it("records the audit only after the deletion succeeds", async () => {
    const formData = new FormData();
    formData.set("confirmation", "DELETE WEDDING DATA");

    const order: string[] = [];
    rpcMock.mockImplementation(async () => {
      order.push("rpc");
      return { error: null };
    });
    auditMock.mockImplementation(async () => {
      order.push("audit");
    });
    redirectMock.mockImplementation((url: string) => {
      order.push(`redirect:${url}`);
      throw new Error(`redirect:${url}`);
    });

    await expect(deleteWeddingData(formData)).rejects.toThrow("redirect:/admin?deleted=1");
    expect(order).toEqual(["rpc", "audit", "redirect:/admin?deleted=1"]);
    expect(purgeMock).toHaveBeenCalledWith(true);
  });
});

const { deleteWeddingData } = await import("./admin-data");
