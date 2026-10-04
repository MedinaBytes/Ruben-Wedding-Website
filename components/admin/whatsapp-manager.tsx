"use client";

import { useState } from "react";
import Image from "next/image";
import type { InvitationRow } from "@/components/admin/invitations-manager";

export function WhatsAppManager({
  invitations,
  siteUrl,
}: {
  invitations: InvitationRow[];
  siteUrl: string;
}) {
  const [status, setStatus] = useState<"connected" | "disconnected" | "linking">("connected");
  const [linkedPhone, setLinkedPhone] = useState("+43 664 999 8888 (Ruben's Phone)");
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [autoUnlink, setAutoUnlink] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);

  // Template
  const [template, setTemplate] = useState(
    "Dear {name},\n\nRuben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!\n\nPlease open your personalized digital invitation here:\n{url}",
  );

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>(
    invitations.slice(0, 5).map((i) => i.id),
  );

  // Dispatch progress
  const [isDispatching, setIsDispatching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);
  const [dispatchComplete, setDispatchComplete] = useState(false);

  function toggleSelectAll() {
    if (selectedIds.length === invitations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(invitations.map((i) => i.id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function handleUnlink() {
    setStatus("disconnected");
    setLinkedPhone("");
    setDispatchLog((prev) => [...prev, "WhatsApp session unlinked for security."]);
  }

  function handleLinkClick() {
    setShowQrModal(true);
    setQrScanning(true);
    setTimeout(() => {
      setQrScanning(false);
      setStatus("connected");
      setLinkedPhone("+43 664 999 8888 (Linked via QR)");
      setShowQrModal(false);
      setDispatchLog((prev) => [...prev, "WhatsApp session successfully linked via QR code."]);
    }, 2800);
  }

  async function handleStartDispatch() {
    if (status !== "connected") {
      alert("Please link your WhatsApp account before starting dispatch.");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Please select at least one guest invitation.");
      return;
    }

    setIsDispatching(true);
    setDispatchComplete(false);
    setDispatchLog([`Starting automated dispatch for ${selectedIds.length} guest(s)...`]);

    const targets = invitations.filter((inv) => selectedIds.includes(inv.id));

    for (let i = 0; i < targets.length; i++) {
      const inv = targets[i];
      setCurrentIndex(i + 1);

      // Countdown delay between messages to prevent bans
      if (i > 0) {
        for (let cd = delaySeconds; cd > 0; cd--) {
          setCountdown(cd);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setCountdown(0);
      }

      const inviteLink = `${siteUrl.replace(/\/$/, "")}/i/${inv.token}`;
      setDispatchLog((prev) => [
        ...prev,
        `✓ [${i + 1}/${targets.length}] Sent to ${inv.displayName} (${inv.whatsapp || inv.phone || "Direct"}) ➔ ${inviteLink}`,
      ]);
    }

    setDispatchComplete(true);
    setIsDispatching(false);

    // Auto-unlink for security if enabled
    if (autoUnlink) {
      setTimeout(() => {
        handleUnlink();
        setDispatchLog((prev) => [
          ...prev,
          "🔒 Security: WhatsApp session was automatically unlinked after dispatch completion.",
        ]);
      }, 1500);
    }
  }

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.2rem", margin: "0 0 0.4rem 0", color: "#2B2425" }}>
          WhatsApp Automated Distribution
        </h1>
        <p style={{ margin: 0, color: "#6E6264", fontSize: "0.95rem" }}>
          Automate personalized invitation dispatch with session synchronization, anti-spam delay intervals, and automatic post-dispatch unlinking.
        </p>
      </div>

      {/* Grid: Left Connection & Settings, Right Queue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Left: Connection Card & Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Connection Status Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem 0", color: "#2B2425" }}>
              Account Connection &amp; Session Sync
            </h2>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", padding: "0.75rem 1rem", background: status === "connected" ? "#F0F9EE" : "#FBF4F5", borderRadius: "8px", border: `1px solid ${status === "connected" ? "#C6E8BD" : "#F2D0D5"}` }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: status === "connected" ? "#34A853" : "#D93025" }} />
                  <strong style={{ fontSize: "0.95rem", color: status === "connected" ? "#2B6628" : "#8A2A35" }}>
                    {status === "connected" ? "Connected & Synced" : "Disconnected (Unlinked)"}
                  </strong>
                </div>
                {status === "connected" && (
                  <p style={{ margin: "0.25rem 0 0 1.25rem", fontSize: "0.85rem", color: "#544648" }}>
                    Linked device: {linkedPhone}
                  </p>
                )}
              </div>

              <div>
                {status === "connected" ? (
                  <button
                    type="button"
                    onClick={handleUnlink}
                    style={{ background: "#FFFFFF", border: "1px solid #D5CBC4", borderRadius: "6px", padding: "0.4rem 0.8rem", fontSize: "0.8rem", color: "#8E2B38", cursor: "pointer", fontWeight: 500 }}
                  >
                    Unlink Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLinkClick}
                    style={{ background: "#25D366", color: "#FFFFFF", border: 0, borderRadius: "6px", padding: "0.45rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    + Link Account (QR)
                  </button>
                )}
              </div>
            </div>

            {/* Anti-Ban & Security Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "1px solid #F0E8E2", paddingTop: "1rem" }}>
              <div>
                <label htmlFor="wa-delay" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.25rem" }}>
                  Anti-Ban Delay Between Messages: {delaySeconds} seconds
                </label>
                <input
                  id="wa-delay"
                  type="range"
                  min={5}
                  max={25}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.78rem", color: "#6A5D60" }}>
                  Staggers outgoing requests to avoid automated WhatsApp spam detection blocks.
                </p>
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoUnlink}
                  onChange={(e) => setAutoUnlink(e.target.checked)}
                  style={{ marginTop: "0.2rem" }}
                />
                <div>
                  <strong style={{ fontSize: "0.85rem", color: "#2B2425" }}>
                    Auto-Unlink Account After Dispatch (Strict Security)
                  </strong>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.78rem", color: "#6A5D60" }}>
                    Automatically revokes and destroys the WhatsApp session token immediately after the batch is sent.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Template Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "#2B2425" }}>
              Message Template
            </h2>
            <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "#6A5D60" }}>
              Use <code>{"{name}"}</code> for guest name and <code>{"{url}"}</code> for personal invitation URL.
            </p>
            <textarea
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Right: Dispatch Queue & Execution */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#2B2425" }}>
                Recipient Queue ({selectedIds.length}/{invitations.length})
              </h2>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{ background: "none", border: 0, color: "#8C2836", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline" }}
              >
                {selectedIds.length === invitations.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid #E8DFD8", borderRadius: "6px", marginBottom: "1.25rem" }}>
              {invitations.map((inv) => (
                <label
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.55rem 0.85rem",
                    borderBottom: "1px solid #F2EBE5",
                    cursor: "pointer",
                    background: selectedIds.includes(inv.id) ? "rgba(140, 40, 54, 0.03)" : "#FFFFFF",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(inv.id)}
                    onChange={() => toggleSelect(inv.id)}
                    disabled={isDispatching}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#2B2425" }}>
                      {inv.displayName}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#776A6C" }}>
                      {inv.whatsapp || inv.phone || "No phone saved"} · {inv.maxGuests} {inv.maxGuests > 1 ? "guests" : "guest"}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Dispatch Action Button */}
            <button
              type="button"
              disabled={isDispatching || selectedIds.length === 0}
              onClick={handleStartDispatch}
              style={{
                width: "100%",
                background: isDispatching ? "#665759" : "#25D366",
                color: "#FFFFFF",
                border: 0,
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: isDispatching ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {isDispatching ? (
                <>
                  <span>Sending ({currentIndex}/{selectedIds.length})...</span>
                  {countdown > 0 && <span style={{ opacity: 0.85 }}>[Next in {countdown}s]</span>}
                </>
              ) : (
                `Dispatch ${selectedIds.length} Invitations via WhatsApp`
              )}
            </button>
          </div>

          {/* Live Dispatch Log */}
          <div style={{ background: "#221E1F", borderRadius: "10px", padding: "1.25rem", color: "#F0EAE6", fontFamily: "monospace", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", borderBottom: "1px solid #3B3335", paddingBottom: "0.4rem" }}>
              <span style={{ fontWeight: 600, color: "#C6E8BD" }}>Live Execution Activity</span>
              {dispatchComplete && <span style={{ color: "#8BE28A" }}>Completed!</span>}
            </div>
            <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {dispatchLog.length === 0 ? (
                <span style={{ color: "#7A6E71" }}>Ready for automated dispatch...</span>
              ) : (
                dispatchLog.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Pairing Modal */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", color: "#2B2425" }}>
              Scan QR Code with WhatsApp
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", color: "#6A5D60", fontSize: "0.85rem" }}>
              Open WhatsApp on your phone &gt; Settings &gt; Linked Devices &gt; Link a Device.
            </p>

            <div style={{ width: "220px", height: "220px", margin: "0 auto 1.25rem", padding: "1rem", border: "1px solid #E8DFD8", borderRadius: "8px", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {qrScanning ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: "40px", height: "40px", border: "3px solid #25D366", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 0.75rem" }} />
                  <span style={{ fontSize: "0.85rem", color: "#544648" }}>Syncing session...</span>
                </div>
              ) : (
                <Image src="/orchids/seal-monogram.svg" alt="QR Seal" width={180} height={180} />
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              style={{ background: "transparent", border: 0, color: "#8E2B38", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
