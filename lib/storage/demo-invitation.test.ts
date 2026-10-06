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

  it("manages demo song requests up to 3 songs with auto-save, deletion, and limit enforcement", () => {
    const demoId = "00000000-0000-0000-0000-000000000001";
    // Clear any previous song requests for baseline
    resilientStore.saveSongRequests(demoId, []);

    // 1. Add first song
    const r1 = resilientStore.addSongRequest(demoId, {
      title: "Danube Waltz",
      artist: "Strauss",
      spotifyUrl: "https://open.spotify.com/track/1",
    });
    expect(r1.success).toBe(true);

    // 2. Add second song
    const r2 = resilientStore.addSongRequest(demoId, {
      title: "Radetzky March",
      artist: "Strauss",
      spotifyUrl: "https://open.spotify.com/track/2",
    });
    expect(r2.success).toBe(true);

    // 3. Add third song
    const r3 = resilientStore.addSongRequest(demoId, {
      title: "Vienna Blood",
      artist: "Strauss",
      spotifyUrl: "https://open.spotify.com/track/3",
    });
    expect(r3.success).toBe(true);

    // Verify 3 songs exist
    let currentSongs = resilientStore.getSongRequests(demoId);
    expect(currentSongs).toHaveLength(3);
    expect(currentSongs.map((s) => s.slot)).toEqual([1, 2, 3]);

    // 4. Attempting to add a 4th song must be rejected
    const r4 = resilientStore.addSongRequest(demoId, {
      title: "Fourth Song",
      artist: "Artist",
    });
    expect(r4.success).toBe(false);
    expect(r4.error).toBe("maximum_reached");
    expect(resilientStore.getSongRequests(demoId)).toHaveLength(3);

    // 5. Attempting duplicate must be rejected
    resilientStore.deleteSongRequest(demoId, currentSongs[0].id!);
    expect(resilientStore.getSongRequests(demoId)).toHaveLength(2);

    const dup = resilientStore.addSongRequest(demoId, {
      title: "Radetzky March",
      artist: "Strauss",
    });
    expect(dup.success).toBe(false);
    expect(dup.error).toBe("already_submitted");

    // 6. Adding a replacement song reaches 3 again
    const replacement = resilientStore.addSongRequest(demoId, {
      title: "Kaiser Walzer",
      artist: "Strauss",
    });
    expect(replacement.success).toBe(true);
    currentSongs = resilientStore.getSongRequests(demoId);
    expect(currentSongs).toHaveLength(3);
  });
});
