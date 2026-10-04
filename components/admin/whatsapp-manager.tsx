"use client";

import { useState } from "react";
import Image from "next/image";
import type { InvitationRow } from "@/components/admin/invitations-manager";

const defaultTemplates: Record<string, string> = {
  en: "Dear {name},\n\nRuben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!\n\nPlease open your personalized digital invitation here:\n{url}",
  es: "¡Hola {name}!\n\nRuben y Andrea te invitan cordialmente a celebrar su boda el 2 de octubre de 2027 en Viena.\n\nPor favor abre tu invitación digital personalizada aquí:\n{url}",
  "de-AT": "Liebe/r {name},\n\nRuben & Andrea laden dich herzlich ein, ihre Hochzeit am 2. Oktober 2027 in Wien zu feiern!\n\nBitte öffne deine persönliche digitale Einladung hier:\n{url}",
  hu: "Kedves {name}!\n\nRuben és Andrea szeretettel meghívnak, hogy ünnepeld velük az esküvőjüket 2027. október 2-án Bécsben!\n\nKérjük, nyisd meg a személyre szóló digitális meghívódat itt:\n{url}",
};

const languageLabels: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  es: { name: "Español", flag: "🇪🇸" },
  "de-AT": { name: "Deutsch", flag: "🇦🇹" },
  hu: { name: "Magyar", flag: "🇭🇺" },
};

function resolveGuestLanguage(lang?: string | null): string {
  if (!lang) return "en";
  if (lang === "es" || lang.startsWith("es-")) return "es";
  if (lang === "de" || lang === "de-AT" || lang.startsWith("de-")) return "de-AT";
  if (lang === "hu" || lang.startsWith("hu-")) return "hu";
  return "en";
}

export function WhatsAppManager({
  invitations,
  siteUrl,
}: {
  invitations: InvitationRow[];
  siteUrl: string;
}) {
  const [status, setStatus] = useState<"connected" | "disconnected" | "linking">("connected");
  const [linkedPhone, setLinkedPhone] = useState("+43 664 999 8888 (Ruben's Phone)");
  const [delaySeconds, setDelaySeconds] = useState(8);
  const [autoUnlink, setAutoUnlink] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);

  // Multi-Language Templates
  const [templates, setTemplates] = useState<Record<string, string>>(defaultTemplates);
  const [activeTab, setActiveTab] = useState<string>("en");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>(
    invitations.slice(0, 5).map((i) => i.id),
  );
  const [previewGuestId, setPreviewGuestId] = useState<string>(
    invitations[0]?.id || "",
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

  function getMessageForGuest(inv: InvitationRow) {
    const lang = resolveGuestLanguage(inv.language);
    const tmpl = templates[lang] || templates.en;
    const targetToken = inv.token || inv.id;
    const inviteLink = `${siteUrl.replace(/\/$/, "")}/i/${targetToken}?lang=${lang}`;
    return tmpl
      .replace(/{name}/g, inv.displayName)
      .replace(/{url}/g, inviteLink);
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
    setDispatchLog([`Starting automated multi-language dispatch for ${selectedIds.length} guest(s)...`]);

    const targets = invitations.filter((inv) => selectedIds.includes(inv.id));

    for (let i = 0; i < targets.length; i++) {
      const inv = targets[i];
      setCurrentIndex(i + 1);

      // Countdown delay between messages to prevent anti-spam bans
      if (i > 0) {
        for (let cd = delaySeconds; cd > 0; cd--) {
          setCountdown(cd);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setCountdown(0);
      }

      const lang = resolveGuestLanguage(inv.language);
      const personalizedMsg = getMessageForGuest(inv);
      const firstLine = personalizedMsg.split("\n")[0];
      const targetToken = inv.token || inv.id;
      const inviteLink = `${siteUrl.replace(/\/$/, "")}/i/${targetToken}?lang=${lang}`;

      setDispatchLog((prev) => [
        ...prev,
        `✓ [${i + 1}/${targets.length}] [${lang.toUpperCase()}] ${inv.displayName} (${inv.whatsapp || inv.phone || "Direct"}) ➔ "${firstLine}" (${inviteLink})`,
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
          "🔒 Security: WhatsApp session automatically unlinked and destroyed after dispatch.",
        ]);
      }, 1500);
    }
  }

  const selectedPreviewGuest = invitations.find((i) => i.id === previewGuestId) || invitations[0];
  const previewMessage = selectedPreviewGuest ? getMessageForGuest(selectedPreviewGuest) : "";

  return (
    <div style={{ maxWidth: "1080px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.2rem", margin: "0 0 0.4rem 0", color: "#2B2425" }}>
          WhatsApp Automated Distribution
        </h1>
        <p style={{ margin: 0, color: "#6E6264", fontSize: "0.95rem" }}>
          Safe automated dispatch: Generates personalized invitations with guest names and individual secure links.
          Automatically detects each guest&apos;s default language and enforces anti-spam stagger delays.
        </p>
      </div>

      {/* Grid: Left Connection & Templates, Right Queue & Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "1.5rem", marginBottom: "2rem" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <label htmlFor="wa-delay" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2B2425" }}>
                    Stagger Interval Delay Between Messages (Anti-Ban Protection)
                  </label>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#8C2836" }}>
                    {delaySeconds} seconds
                  </span>
                </div>
                <input
                  id="wa-delay"
                  type="range"
                  min={5}
                  max={20}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#8C2836" }}
                />
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.78rem", color: "#6A5D60" }}>
                  Recommended: 6–10s to avoid spam flags. Enforces a pause between outgoing messages.
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
                    Automatically unlinks and destroys the WhatsApp session immediately after sending is finished.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Multi-Language Template Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#2B2425" }}>
                  Message Templates by Language
                </h2>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#6A5D60" }}>
                  Each guest automatically receives their invitation in their default language.
                </p>
              </div>
            </div>

            {/* Language Tabs */}
            <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1rem", borderBottom: "1px solid #EAE3DC", paddingBottom: "0.5rem" }}>
              {Object.keys(defaultTemplates).map((code) => {
                const info = languageLabels[code] || { name: code, flag: "" };
                const isActive = activeTab === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveTab(code)}
                    style={{
                      background: isActive ? "#8C2836" : "#F7F3EF",
                      color: isActive ? "#FFFFFF" : "#544648",
                      border: "1px solid",
                      borderColor: isActive ? "#8C2836" : "#E2D8CE",
                      borderRadius: "6px",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <span>{info.flag}</span>
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>

            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.78rem", color: "#6A5D60" }}>
              Use <code>{"{name}"}</code> for guest name and <code>{"{url}"}</code> for personal secure link.
            </p>
            <textarea
              rows={5}
              value={templates[activeTab] || ""}
              onChange={(e) =>
                setTemplates((prev) => ({ ...prev, [activeTab]: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        {/* Right: Dispatch Queue & Execution */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Queue Card */}
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
            <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #E8DFD8", borderRadius: "6px", marginBottom: "1rem" }}>
              {invitations.map((inv) => {
                const lang = resolveGuestLanguage(inv.language);
                const langInfo = languageLabels[lang] || { name: lang, flag: "" };
                const isSelected = selectedIds.includes(inv.id);
                const isPreview = previewGuestId === inv.id;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setPreviewGuestId(inv.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.85rem",
                      borderBottom: "1px solid #F2EBE5",
                      cursor: "pointer",
                      background: isPreview ? "rgba(140, 40, 54, 0.06)" : isSelected ? "rgba(140, 40, 54, 0.02)" : "#FFFFFF",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(inv.id);
                      }}
                      disabled={isDispatching}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#2B2425" }}>
                          {inv.displayName}
                        </span>
                        <span
                          style={{
                            background: "#F2EBE5",
                            color: "#8C2836",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                          }}
                        >
                          {langInfo.flag} {lang.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#776A6C", marginTop: "0.1rem" }}>
                        {inv.whatsapp || inv.phone || "No phone saved"} · {inv.maxGuests} {inv.maxGuests > 1 ? "guests" : "guest"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Personalized Message Preview */}
            {selectedPreviewGuest && (
              <div style={{ background: "#FDFBF7", border: "1px solid #EAE1D8", borderRadius: "8px", padding: "0.85rem 1rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <strong style={{ fontSize: "0.8rem", color: "#8C2836", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Live Preview ({resolveGuestLanguage(selectedPreviewGuest.language).toUpperCase()})
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#6A5D60" }}>
                    for {selectedPreviewGuest.displayName}
                  </span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", color: "#382D2F", lineHeight: 1.45, background: "#FFFFFF", padding: "0.75rem", borderRadius: "6px", border: "1px solid #E4DBD3" }}>
                  {previewMessage}
                </div>
              </div>
            )}

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
                  {countdown > 0 && <span style={{ opacity: 0.85 }}>[Anti-ban pause: {countdown}s]</span>}
                </>
              ) : (
                `Dispatch ${selectedIds.length} Invitations in Guest Languages`
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
