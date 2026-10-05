import { beforeEach, describe, expect, it, vi } from "vitest";
import { resilientStore } from "@/lib/storage/resilient-store";

vi.mock("server-only", () => ({}));

describe("demo invitation management and production isolation", () => {
  beforeEach(() => {
    // Re-enable demo before each test for clean baseline
    resilientStore.setDemoEnabled(true);
  });

  it("provides demo invitation when demo is enabled", () => {
    expect(resilientStore.isDemoEnabled()).toBe(true);

    const demoById = resilientStore.getInvitationById("00000000-0000-0000-0000-000000000001");
    expect(demoById).not.toBeNull();
    expect(demoById?.display_name).toContain("Sarah & Guest");

    const demoByToken = resilientStore.getInvitationByToken("demo");
    expect(demoByToken).not.toBeNull();
    expect(demoByToken?.id).toBe("00000000-0000-0000-0000-000000000001");

    const all = resilientStore.getInvitations();
    expect(all.some((i) => i.id === "00000000-0000-0000-0000-000000000001")).toBe(true);
  });

  it("completely removes and blocks demo invitation when disabled", () => {
    resilientStore.setDemoEnabled(false);
    expect(resilientStore.isDemoEnabled()).toBe(false);

    // ID lookup returns null
    const demoById = resilientStore.getInvitationById("00000000-0000-0000-0000-000000000001");
    expect(demoById).toBeNull();

    // Token lookup returns null
    const demoByToken = resilientStore.getInvitationByToken("demo");
    expect(demoByToken).toBeNull();

    // Invitations array does not include demo record
    const all = resilientStore.getInvitations();
    expect(all.some((i) => i.id === "00000000-0000-0000-0000-000000000001")).toBe(false);
    expect(all.some((i) => i.token === "demo")).toBe(false);
  });

  it("deleting demo invitation permanently disables demo mode", () => {
    resilientStore.deleteInvitation("00000000-0000-0000-0000-000000000001");

    expect(resilientStore.isDemoEnabled()).toBe(false);
    expect(resilientStore.getInvitationByToken("demo")).toBeNull();
    expect(resilientStore.getInvitationById("00000000-0000-0000-0000-000000000001")).toBeNull();
  });
});
