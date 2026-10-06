"use client";

import { useState } from "react";

export interface SongRequestItem {
  id: string;
  invitationId?: string;
  songTitle: string;
  artist: string | null;
  spotifyUrl: string | null;
  selectedForPlaylist: boolean;
  guestName: string;
  submittedAt: string;
}

export function MusicManager({ songs }: { songs: SongRequestItem[] }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<SongRequestItem[]>(songs);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Group frequency: count occurrences of normalized title + artist
  const frequencyMap = new Map<string, number>();
  songs.forEach((s) => {
    const key = `${s.songTitle.toLowerCase().trim()} — ${(s.artist || "").toLowerCase().trim()}`;
    frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);
  });

  // Count requests per guest/invitation to track the 3-song limit
  const guestSongCountMap = new Map<string, number>();
  items.forEach((s) => {
    const key = s.invitationId || s.guestName;
    guestSongCountMap.set(key, (guestSongCountMap.get(key) || 0) + 1);
  });
  const completedGuestsCount = Array.from(guestSongCountMap.values()).filter((c) => c >= 3).length;

  const filtered = items.filter((s) => {
    const query = search.toLowerCase();
    return (
      s.songTitle.toLowerCase().includes(query) ||
      (s.artist && s.artist.toLowerCase().includes(query)) ||
      s.guestName.toLowerCase().includes(query)
    );
  });

  async function toggleSelected(id: string, current: boolean) {
    setUpdatingId(id);
    const next = !current;
    try {
      const res = await fetch("/api/admin/music/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, selected: next }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, selectedForPlaylist: next } : item)),
        );
      }
    } catch {
      alert("Failed to update song selection.");
    } finally {
      setUpdatingId(null);
    }
  }

  function exportCsv() {
    const headers = ["Song Title", "Artist", "Requested By", "Frequency", "Selected for Playlist", "Spotify URL"];
    const rows = filtered.map((s) => {
      const key = `${s.songTitle.toLowerCase().trim()} — ${(s.artist || "").toLowerCase().trim()}`;
      const freq = frequencyMap.get(key) || 1;
      return [
        `"${s.songTitle.replace(/"/g, '""')}"`,
        `"${(s.artist || "").replace(/"/g, '""')}"`,
        `"${s.guestName.replace(/"/g, '""')}"`,
        freq,
        s.selectedForPlaylist ? "YES" : "NO",
        s.spotifyUrl || "",
      ];
    });

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding_music_requests_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const selectedCount = items.filter((i) => i.selectedForPlaylist).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Guest Music Requests
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
            {items.length} Total Requests · {selectedCount} Selected for Wedding Setlist · <strong>{completedGuestsCount}</strong> Guests Completed (3/3 Limit)
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          style={{
            background: "#55644E",
            color: "#FFFFFF",
            border: 0,
            borderRadius: "6px",
            padding: "0.55rem 1.1rem",
            fontSize: "0.85rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          ⬇ Export Music CSV
        </button>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="search"
          placeholder="Search by song title, artist, or guest..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "0.55rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #D5CBC4",
            fontSize: "0.9rem",
            background: "#FFFFFF",
          }}
        />
      </div>

      <div className="admin-table-scroll-wrap">
        <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#F7F3EF", borderBottom: "1px solid #E4DBD3", color: "#6A5E60", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.75rem 1rem", width: "40px" }}>Set</th>
              <th style={{ padding: "0.75rem 1rem" }}>Song Title</th>
              <th style={{ padding: "0.75rem 1rem" }}>Artist</th>
              <th style={{ padding: "0.75rem 1rem" }}>Frequency</th>
              <th style={{ padding: "0.75rem 1rem" }}>Requested By</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Spotify</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#8E7F81" }}>
                  No song requests found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const key = `${s.songTitle.toLowerCase().trim()} — ${(s.artist || "").toLowerCase().trim()}`;
                const freq = frequencyMap.get(key) || 1;
                const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${s.songTitle} ${s.artist || ""}`.trim())}`;
                const guestCount = guestSongCountMap.get(s.invitationId || s.guestName) || 1;

                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #EFEAE5", background: s.selectedForPlaylist ? "#F9FCF8" : "transparent" }}>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <input
                        type="checkbox"
                        checked={s.selectedForPlaylist}
                        disabled={updatingId === s.id}
                        onChange={() => toggleSelected(s.id, s.selectedForPlaylist)}
                        aria-label={`Select ${s.songTitle} for playlist`}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#2B2425" }}>
                      {s.songTitle}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#6A5D60" }}>
                      {s.artist || "—"}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "999px",
                          background: freq > 1 ? "#F7E2E4" : "#F0ECE8",
                          color: freq > 1 ? "#8C2836" : "#6E6264",
                        }}
                      >
                        {freq} {freq === 1 ? "request" : "requests"}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", color: "#544648" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600 }}>{s.guestName}</span>
                        {guestCount >= 3 ? (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              background: "#ECFDF5",
                              color: "#065F46",
                              border: "1px solid #A7F3D0",
                            }}
                            title="Guest has reached the 3-song maximum limit"
                          >
                            ✓ 3/3 (Completo)
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              background: "#F3F4F6",
                              color: "#4B5563",
                              border: "1px solid #E5E7EB",
                            }}
                          >
                            {guestCount}/3
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <a
                        href={s.spotifyUrl || spotifySearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          fontSize: "0.78rem",
                          color: "#1DB954",
                          textDecoration: "none",
                          fontWeight: 600,
                          border: "1px solid rgba(29, 185, 84, 0.3)",
                          borderRadius: "4px",
                          padding: "0.2rem 0.55rem",
                        }}
                      >
                        Open ↗
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
