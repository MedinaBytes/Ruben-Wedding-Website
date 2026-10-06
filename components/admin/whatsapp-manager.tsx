"use client";

import { useEffect, useRef, useState } from "react";
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
  "de-AT": { name: "Deutsch (AT)", flag: "🇦🇹" },
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
  const [status, setStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [linkedPhone, setLinkedPhone] = useState<string>("");
  const [liveQrCode, setLiveQrCode] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isServerless, setIsServerless] = useState<boolean>(false);
  const [delaySeconds, setDelaySeconds] = useState(8);
  const [autoUnlink, setAutoUnlink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Direct 1-Click Guided Assistant
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [assistantIndex, setAssistantIndex] = useState(0);
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Test send state
  const [testPhone, setTestPhone] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Multi-Language Templates
  const [templates, setTemplates] = useState<Record<string, string>>(defaultTemplates);
  const [activeTab, setActiveTab] = useState<string>("en");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>(
    invitations.slice(0, 10).map((i) => i.id),
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

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load session state on mount
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch(`/api/admin/whatsapp/session?_t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status);
          if (data.isServerless) setIsServerless(true);
          if (data.linkedPhone) setLinkedPhone(data.linkedPhone);
          if (data.qrCode) setLiveQrCode(data.qrCode);
          if (data.error) setPairingError(data.error);
        }
      } catch {
        setStatus("disconnected");
      } finally {
        setIsCheckingSession(false);
      }
    }
    void loadStatus();

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

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

  async function handleLinkClick() {
    setShowQrModal(true);
    setStatus("connecting");
    setLiveQrCode(null);
    setPairingError(null);
    setDispatchLog((prev) => [...prev, "Initializing WhatsApp Web bot session and generating QR code..."]);

    try {
      const res = await fetch(`/api/admin/whatsapp/session?_t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isServerless) setIsServerless(true);
        if (data.qrCode) {
          setLiveQrCode(data.qrCode);
          setPairingError(null);
        }
        if (data.error) {
          setPairingError(data.error);
        }
        if (data.status === "connected") {
          setStatus("connected");
          setLinkedPhone(data.linkedPhone || "Connected");
          setShowQrModal(false);
          setLiveQrCode(null);
          setPairingError(null);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        setPairingError(errJson?.error || `HTTP error ${res.status}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setPairingError(msg);
      setDispatchLog((prev) => [...prev, `Error starting session: ${msg}`]);
    }

    // Start polling every 1.5s while modal is active
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const pollRes = await fetch(`/api/admin/whatsapp/session?_t=${Date.now()}`, { cache: "no-store" });
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          if (pollData.isServerless) setIsServerless(true);
          if (pollData.qrCode) {
            setLiveQrCode(pollData.qrCode);
            setPairingError(null);
          }
          if (pollData.error) {
            setPairingError(pollData.error);
          }
          if (pollData.status === "connected") {
            setStatus("connected");
            setLinkedPhone(pollData.linkedPhone || "Connected Device");
            setShowQrModal(false);
            setLiveQrCode(null);
            setPairingError(null);
            setDispatchLog((prev) => [
              ...prev,
              `✓ Real WhatsApp session successfully linked: ${pollData.linkedPhone || "Phone linked"}!`,
            ]);
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          }
        }
      } catch {}
    }, 1500);
  }

  function handleCloseModal() {
    setShowQrModal(false);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }

  async function handleUnlink() {
    try {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      await fetch("/api/admin/whatsapp/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlink" }),
      });
      setStatus("disconnected");
      setLinkedPhone("");
      setLiveQrCode(null);
      setPairingError(null);
      setDispatchLog((prev) => [...prev, "WhatsApp session unlinked and destroyed."]);
    } catch {
      alert("Failed to unlink session.");
    }
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

  async function markGuestDispatched(inv: InvitationRow) {
    if (!dispatchedIds.includes(inv.id)) {
      setDispatchedIds((prev) => [...prev, inv.id]);
    }
    const phone = inv.whatsapp || inv.phone || "";
    try {
      await fetch("/api/admin/whatsapp/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markDispatched: true,
          invitationId: inv.id,
          phone,
          guestName: inv.displayName,
        }),
      });
    } catch {}
  }

  function openDirectWhatsAppForGuest(inv: InvitationRow) {
    const phone = inv.whatsapp || inv.phone || "";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    if (!cleanPhone) {
      alert(`No phone number saved for ${inv.displayName}. Please add a phone number first.`);
      return;
    }
    const message = getMessageForGuest(inv);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    try {
      navigator.clipboard.writeText(message);
      setCopiedNotice(`✓ Copied text & link to clipboard for ${inv.displayName}!`);
      setTimeout(() => setCopiedNotice(null), 3500);
    } catch {}

    window.open(url, "_blank", "noopener,noreferrer");
    void markGuestDispatched(inv);
    setDispatchLog((prev) => [
      ...prev,
      `✓ Opened direct WhatsApp chat for ${inv.displayName} (${phone}) in ${resolveGuestLanguage(inv.language).toUpperCase()}`,
    ]);
  }

  // 1-Click Guided Assistant Handlers
  function launchAssistant() {
    if (selectedIds.length === 0) {
      alert("Please select at least one guest invitation.");
      return;
    }
    setAssistantIndex(0);
    setShowAssistantModal(true);
  }

  function handleAssistantSendCurrent() {
    const targets = invitations.filter((inv) => selectedIds.includes(inv.id));
    const current = targets[assistantIndex];
    if (!current) return;

    openDirectWhatsAppForGuest(current);

    if (assistantIndex + 1 < targets.length) {
      setAssistantIndex((prev) => prev + 1);
    }
  }

  async function handleSendTest() {
    if (!testPhone) {
      alert("Please enter a phone number with country code (e.g. +436641234567 or 436641234567).");
      return;
    }

    const cleanPhone = testPhone.replace(/[^\d]/g, "");
    const guest = invitations[0];
    const message = guest
      ? getMessageForGuest(guest)
      : "Dear Ruben & Andrea,\n\nTest invitation message successfully delivered via WhatsApp!";

    // If bot is not connected, open direct WhatsApp chat immediately
    if (status !== "connected") {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setDispatchLog((prev) => [
        ...prev,
        `✓ Opened test WhatsApp chat for ${testPhone}.`,
      ]);
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await fetch("/api/admin/whatsapp/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message,
          guestName: "Test Recipient",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispatchLog((prev) => [
          ...prev,
          `✓ Test message successfully sent to ${testPhone} (ID: ${data.messageId || "delivered"})`,
        ]);
        alert(`Test invitation sent successfully to ${testPhone}!`);
      } else if (data.directUrl) {
        window.open(data.directUrl, "_blank", "noopener,noreferrer");
      } else {
        alert(data.error || "Failed to send test message");
      }
    } catch {
      alert("Network error sending test message");
    } finally {
      setIsSendingTest(false);
    }
  }

  async function handleStartDispatch() {
    if (selectedIds.length === 0) {
      alert("Please select at least one guest invitation.");
      return;
    }

    // If bot is not connected, launch the 1-Click Guided Assistant so browser popup blocker doesn't block tabs!
    if (status !== "connected") {
      launchAssistant();
      return;
    }

    setIsDispatching(true);
    setDispatchComplete(false);
    setDispatchLog([`Starting automated multi-language dispatch for ${selectedIds.length} guest(s)...`]);

    const targets = invitations.filter((inv) => selectedIds.includes(inv.id));

    for (let i = 0; i < targets.length; i++) {
      const inv = targets[i];
      setCurrentIndex(i + 1);

      if (i > 0 && delaySeconds > 0) {
        for (let cd = delaySeconds; cd > 0; cd--) {
          setCountdown(cd);
          await new Promise((r) => setTimeout(r, 1000));
        }
        setCountdown(0);
      }

      const lang = resolveGuestLanguage(inv.language);
      const personalizedMsg = getMessageForGuest(inv);
      const phone = inv.whatsapp || inv.phone || "";

      if (!phone) {
        setDispatchLog((prev) => [
          ...prev,
          `⚠️ [${i + 1}/${targets.length}] Skipped ${inv.displayName}: No phone number saved.`,
        ]);
        continue;
      }

      try {
        const res = await fetch("/api/admin/whatsapp/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            message: personalizedMsg,
            invitationId: inv.id,
            guestName: inv.displayName,
          }),
        });
        const data = await res.json();

        if (data.success) {
          markGuestDispatched(inv);
          setDispatchLog((prev) => [
            ...prev,
            `✓ [${i + 1}/${targets.length}] [${lang.toUpperCase()}] Delivered to ${inv.displayName} (${phone}) via WhatsApp Bot`,
          ]);
        } else if (data.directUrl) {
          window.open(data.directUrl, "_blank", "noopener,noreferrer");
          markGuestDispatched(inv);
          setDispatchLog((prev) => [
            ...prev,
            `ℹ [${i + 1}/${targets.length}] [${lang.toUpperCase()}] Opened direct WhatsApp chat for ${inv.displayName} (${phone}).`,
          ]);
        } else {
          setDispatchLog((prev) => [
            ...prev,
            `❌ [${i + 1}/${targets.length}] Failed for ${inv.displayName}: ${data.error || "Unknown error"}`,
          ]);
        }
      } catch (err: unknown) {
        setDispatchLog((prev) => [
          ...prev,
          `❌ [${i + 1}/${targets.length}] Network error for ${inv.displayName}: ${err instanceof Error ? err.message : "Error"}`,
        ]);
      }
    }

    setDispatchComplete(true);
    setIsDispatching(false);

    if (autoUnlink && status === "connected") {
      setTimeout(async () => {
        await handleUnlink();
        setDispatchLog((prev) => [
          ...prev,
          "🔒 Security: WhatsApp session automatically unlinked and destroyed after dispatch.",
        ]);
      }, 1500);
    }
  }

  const selectedPreviewGuest = invitations.find((i) => i.id === previewGuestId) || invitations[0];
  const previewMessage = selectedPreviewGuest ? getMessageForGuest(selectedPreviewGuest) : "";

  const selectedTargets = invitations.filter((i) => selectedIds.includes(i.id));
  const currentAssistantGuest = selectedTargets[assistantIndex] || selectedTargets[0];

  return (
    <div style={{ maxWidth: "1080px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.2rem", margin: "0 0 0.4rem 0", color: "#2B2425" }}>
          WhatsApp Automated Distribution
        </h1>
        <p style={{ margin: 0, color: "#6E6264", fontSize: "0.95rem" }}>
          Dispatch personalized wedding invitations with guest names and unique links in English, Spanish, German, and Hungarian.
        </p>
      </div>

      {/* Production & Cloud Hosting Advisory Banner */}
      <div
        style={{
          background: "#F0F9EE",
          border: "1px solid #C6E8BD",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", maxWidth: "780px" }}>
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>💬</span>
          <div>
            <strong style={{ color: "#2B6628", fontSize: "0.95rem" }}>
              Recommended on Official Website: Direct 1-Click WhatsApp Dispatch
            </strong>
            <p style={{ margin: "0.25rem 0 0 0", color: "#3B5A38", fontSize: "0.85rem", lineHeight: 1.45 }}>
              On cloud &amp; serverless hosting (Vercel), background WebSockets terminate between requests.
              Use the <strong>Direct 1-Click Dispatch Assistant</strong> below: it opens official WhatsApp (Web or Mobile App)
              with the guest's personalized invitation prefilled in their language — 100% reliable, zero pairing drops, and zero ban risk!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={launchAssistant}
          disabled={selectedIds.length === 0}
          style={{
            background: "#25D366",
            color: "#FFFFFF",
            border: 0,
            borderRadius: "7px",
            padding: "0.6rem 1.2rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(37, 211, 102, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            whiteSpace: "nowrap",
          }}
        >
          <span>🚀</span> Start 1-Click Dispatch ({selectedIds.length})
        </button>
      </div>

      {copiedNotice && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.75rem 1rem",
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: "6px",
            color: "#1E40AF",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {copiedNotice}
        </div>
      )}

      {/* Grid: Left Connection & Templates, Right Queue & Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Left: Connection Card & Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Connection Status Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem 0", color: "#2B2425" }}>
              Account Connection &amp; Dispatch Engine
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                padding: "0.85rem 1.1rem",
                background: status === "connected" ? "#F0F9EE" : status === "connecting" ? "#FFF8E6" : "#FBF4F5",
                borderRadius: "8px",
                border: `1px solid ${status === "connected" ? "#C6E8BD" : status === "connecting" ? "#F5DEB3" : "#F2D0D5"}`,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: status === "connected" ? "#34A853" : status === "connecting" ? "#FFA000" : "#D93025",
                    }}
                  />
                  <strong style={{ fontSize: "0.95rem", color: status === "connected" ? "#2B6628" : status === "connecting" ? "#8A5A00" : "#8A2A35" }}>
                    {isCheckingSession
                      ? "Checking connection..."
                      : status === "connected"
                        ? "Connected & Synced (WhatsApp Bot)"
                        : status === "connecting"
                          ? "Connecting (Awaiting QR Scan)..."
                          : "Direct 1-Click Mode Active (Recommended)"}
                  </strong>
                </div>
                {status === "connected" ? (
                  <p style={{ margin: "0.25rem 0 0 1.25rem", fontSize: "0.85rem", color: "#544648" }}>
                    Linked device: <strong>{linkedPhone || "WhatsApp Phone"}</strong>
                  </p>
                ) : (
                  <p style={{ margin: "0.25rem 0 0 1.25rem", fontSize: "0.8rem", color: "#776A6C" }}>
                    {isServerless
                      ? "Cloud serverless environment: Direct 1-Click Dispatch is ready to use!"
                      : "Optional: Pair a phone device for background socket dispatch."}
                  </p>
                )}
              </div>

              <div>
                {status === "connected" ? (
                  <button
                    type="button"
                    onClick={handleUnlink}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #D5CBC4",
                      borderRadius: "6px",
                      padding: "0.45rem 0.9rem",
                      fontSize: "0.82rem",
                      color: "#8E2B38",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Unlink Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLinkClick}
                    style={{
                      background: "#FAF7F5",
                      color: "#4A3E3D",
                      border: "1px solid #D5CBC4",
                      borderRadius: "6px",
                      padding: "0.45rem 0.85rem",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>📷</span> Pair Device (QR)
                  </button>
                )}
              </div>
            </div>

            {/* Test Send Input */}
            <div style={{ background: "#FBF9F7", border: "1px solid #ECE4DD", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
              <label htmlFor="test-phone" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.3rem" }}>
                Send Test Invitation to Your Phone:
              </label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id="test-phone"
                  type="text"
                  placeholder="e.g. +436641234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #D5CBC4",
                    fontSize: "0.85rem",
                    background: "#FFFFFF",
                  }}
                />
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={handleSendTest}
                  style={{
                    background: "#25D366",
                    color: "#FFFFFF",
                    border: 0,
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: isSendingTest ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isSendingTest ? "Sending..." : "💬 Open Test in WhatsApp"}
                </button>
              </div>
              <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.75rem", color: "#776A6C" }}>
                Opens official WhatsApp with the sample invitation message ready to send.
              </p>
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
                  min={4}
                  max={20}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#8C2836" }}
                />
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.78rem", color: "#6A5D60" }}>
                  Recommended: 6–10s when using automated queues to prevent WhatsApp anti-spam flags.
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
                    Auto-Unlink Account After Bot Dispatch (Strict Privacy)
                  </strong>
                  <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.78rem", color: "#6A5D60" }}>
                    Automatically closes and clears session keys immediately after bot queue completes.
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
                  Each guest automatically receives their invitation in their designated language.
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
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>

        {/* Right: Dispatch Queue & Execution */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Queue Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#2B2425" }}>
                  Recipient Queue ({selectedIds.length}/{invitations.length})
                </h2>
                <span style={{ fontSize: "0.78rem", color: "#047857", fontWeight: 600 }}>
                  {dispatchedIds.length} dispatched this session
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{ background: "none", border: 0, color: "#8C2836", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline" }}
              >
                {selectedIds.length === invitations.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* List */}
            <div style={{ maxHeight: "290px", overflowY: "auto", border: "1px solid #E8DFD8", borderRadius: "6px", marginBottom: "1rem" }}>
              {invitations.map((inv) => {
                const lang = resolveGuestLanguage(inv.language);
                const langInfo = languageLabels[lang] || { name: lang, flag: "" };
                const isSelected = selectedIds.includes(inv.id);
                const isPreview = previewGuestId === inv.id;
                const isDispatched = dispatchedIds.includes(inv.id);
                const phone = inv.whatsapp || inv.phone || "";

                return (
                  <div
                    key={inv.id}
                    onClick={() => setPreviewGuestId(inv.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.55rem 0.75rem",
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#2B2425", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {inv.displayName}
                        </span>
                        <span
                          style={{
                            background: "#F2EBE5",
                            color: "#8C2836",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                          }}
                        >
                          {langInfo.flag} {lang.toUpperCase()}
                        </span>
                        {isDispatched && (
                          <span style={{ fontSize: "0.68rem", background: "#ECFDF5", color: "#065F46", padding: "0.1rem 0.35rem", borderRadius: "4px", fontWeight: 600 }}>
                            ✓ Sent
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#776A6C", marginTop: "0.1rem" }}>
                        {phone || "No phone"} · {inv.maxGuests} {inv.maxGuests > 1 ? "guests" : "guest"}
                      </div>
                    </div>

                    {phone ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDirectWhatsAppForGuest(inv);
                        }}
                        style={{
                          fontSize: "0.72rem",
                          color: "#FFFFFF",
                          background: "#25D366",
                          border: 0,
                          borderRadius: "4px",
                          padding: "0.3rem 0.55rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        💬 Send
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>No #</span>
                    )}
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

            {/* Primary Action Button: 1-Click Assistant */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={launchAssistant}
                style={{
                  width: "100%",
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "7px",
                  padding: "0.75rem 1rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 2px 8px rgba(37, 211, 102, 0.2)",
                }}
              >
                <span>💬</span> Launch 1-Click Dispatch Assistant ({selectedIds.length} Selected)
              </button>

              {status === "connected" && (
                <button
                  type="button"
                  disabled={isDispatching || selectedIds.length === 0}
                  onClick={handleStartDispatch}
                  style={{
                    width: "100%",
                    background: "#55644E",
                    color: "#FFFFFF",
                    border: 0,
                    borderRadius: "6px",
                    padding: "0.55rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: isDispatching ? "not-allowed" : "pointer",
                  }}
                >
                  {isDispatching ? (
                    <>
                      <span>Sending via Bot ({currentIndex}/{selectedIds.length})...</span>
                      {countdown > 0 && <span style={{ opacity: 0.85 }}>[{countdown}s pause]</span>}
                    </>
                  ) : (
                    `Dispatch Automatically via WhatsApp Bot (${selectedIds.length})`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Live Dispatch Log */}
          <div style={{ background: "#221E1F", borderRadius: "10px", padding: "1.25rem", color: "#F0EAE6", fontFamily: "monospace", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", borderBottom: "1px solid #3B3335", paddingBottom: "0.4rem" }}>
              <span style={{ fontWeight: 600, color: "#C6E8BD" }}>Live Execution Activity</span>
              {dispatchComplete && <span style={{ color: "#8BE28A" }}>Completed!</span>}
            </div>
            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {dispatchLog.length === 0 ? (
                <span style={{ color: "#7A6E71" }}>Ready for automated dispatch...</span>
              ) : (
                dispatchLog.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Guided Assistant Modal */}
      {showAssistantModal && currentAssistantGuest && (() => {
        const lang = resolveGuestLanguage(currentAssistantGuest.language);
        const langInfo = languageLabels[lang] || { name: lang, flag: "" };
        const phone = currentAssistantGuest.whatsapp || currentAssistantGuest.phone || "";
        const msg = getMessageForGuest(currentAssistantGuest);
        const isCurrentDispatched = dispatchedIds.includes(currentAssistantGuest.id);
        const isLast = assistantIndex >= selectedTargets.length - 1;

        return (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(5px)",
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
                borderRadius: "14px",
                padding: "2rem",
                maxWidth: "520px",
                width: "100%",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Assistant Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #EFEAE5", paddingBottom: "0.85rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>💬</span>
                    <h3 style={{ margin: 0, fontFamily: "var(--font-display, serif)", fontSize: "1.3rem", color: "#2B2425" }}>
                      1-Click WhatsApp Assistant
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "#8C2836", fontWeight: 700 }}>
                    Guest {assistantIndex + 1} of {selectedTargets.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAssistantModal(false)}
                  style={{
                    background: "#F4EFEA",
                    border: 0,
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    color: "#6A5D60",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Guest Card */}
              <div style={{ background: "#FAF7F5", border: "1px solid #E5DDD5", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: "1.1rem", color: "#2B2425" }}>
                    {currentAssistantGuest.displayName}
                  </strong>
                  <span style={{ background: "#FFFFFF", border: "1px solid #E0D6CD", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>
                    {langInfo.flag} {langInfo.name}
                  </span>
                </div>

                <div style={{ fontSize: "0.85rem", color: "#6A5D60", marginTop: "0.35rem" }}>
                  Phone: <strong>{phone || "⚠️ No phone number saved"}</strong>
                </div>

                {isCurrentDispatched && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "#065F46", fontWeight: 600 }}>
                    ✓ Already marked as dispatched in this session
                  </div>
                )}
              </div>

              {/* Message Preview */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#6E5E60", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Personalized Message to Send:
                </label>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.82rem",
                    color: "#2D2224",
                    background: "#FDFBF7",
                    border: "1px solid #EAE1D8",
                    padding: "0.85rem",
                    borderRadius: "6px",
                    maxHeight: "140px",
                    overflowY: "auto",
                    lineHeight: 1.45,
                  }}
                >
                  {msg}
                </div>
              </div>

              {/* Main Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <button
                  type="button"
                  disabled={!phone}
                  onClick={handleAssistantSendCurrent}
                  style={{
                    background: "#25D366",
                    color: "#FFFFFF",
                    border: 0,
                    borderRadius: "8px",
                    padding: "0.85rem",
                    fontSize: "1rem",
                    fontWeight: 700,
                    cursor: !phone ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 3px 10px rgba(37, 211, 102, 0.3)",
                  }}
                >
                  <span>💬</span> Open WhatsApp &amp; Send ({currentAssistantGuest.displayName})
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    disabled={assistantIndex === 0}
                    onClick={() => setAssistantIndex((prev) => Math.max(0, prev - 1))}
                    style={{
                      background: "transparent",
                      border: "1px solid #D5CBC4",
                      borderRadius: "6px",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.82rem",
                      cursor: assistantIndex === 0 ? "not-allowed" : "pointer",
                      color: "#6A5D60",
                    }}
                  >
                    ⏮ Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(msg);
                        setCopiedNotice(`✓ Copied text & link to clipboard for ${currentAssistantGuest.displayName}!`);
                        setTimeout(() => setCopiedNotice(null), 3000);
                      } catch {}
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid #D5CBC4",
                      borderRadius: "6px",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      color: "#4A3E3D",
                    }}
                  >
                    📋 Copy Text
                  </button>

                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => setAssistantIndex((prev) => Math.min(selectedTargets.length - 1, prev + 1))}
                    style={{
                      background: "transparent",
                      border: "1px solid #D5CBC4",
                      borderRadius: "6px",
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.82rem",
                      cursor: isLast ? "not-allowed" : "pointer",
                      color: "#6A5D60",
                    }}
                  >
                    Skip ⏩
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Pairing Modal */}
      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(5px)",
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
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "460px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontFamily: "var(--font-display, serif)", fontSize: "1.45rem", color: "#2B2425" }}>
              Pair WhatsApp Multi-Device Bot
            </h3>

            {pairingError ? (
              <div style={{ margin: "1rem 0", padding: "1rem", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", textAlign: "left" }}>
                <strong style={{ color: "#991B1B", fontSize: "0.88rem", display: "block", marginBottom: "0.35rem" }}>
                  ⚠️ Cloud Serverless Connection Notice
                </strong>
                <p style={{ margin: 0, color: "#B91C1C", fontSize: "0.8rem", lineHeight: 1.45 }}>
                  {pairingError}
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      launchAssistant();
                    }}
                    style={{
                      width: "100%",
                      background: "#25D366",
                      color: "#FFFFFF",
                      border: 0,
                      borderRadius: "6px",
                      padding: "0.6rem 1rem",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    👉 Switch to Direct 1-Click Dispatch
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ margin: "0 0 1.25rem 0", color: "#6A5D60", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  1. Open WhatsApp on your phone.<br />
                  2. Go to <strong>Settings</strong> &gt; <strong>Linked Devices</strong>.<br />
                  3. Tap <strong>Link a Device</strong> and point your camera here:
                </p>

                <div
                  style={{
                    width: "240px",
                    height: "240px",
                    margin: "0 auto 1.25rem",
                    padding: "0.5rem",
                    border: "2px solid #E8DFD8",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {liveQrCode ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={liveQrCode}
                      alt="WhatsApp Multi-Device QR Code"
                      width={220}
                      height={220}
                      style={{ display: "block", borderRadius: "6px" }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          border: "3px solid #25D366",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                          margin: "0 auto 0.75rem",
                        }}
                      />
                      <span style={{ fontSize: "0.85rem", color: "#544648", fontWeight: 500, display: "block" }}>
                        Generating pairing QR...
                      </span>
                      <button
                        type="button"
                        onClick={handleLinkClick}
                        style={{
                          marginTop: "0.75rem",
                          background: "#F4EFEA",
                          border: "1px solid #DCD3CB",
                          borderRadius: "6px",
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#6E5B5D",
                        }}
                      >
                        Tap to retry
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                background: "transparent",
                border: 0,
                color: "#8E2B38",
                fontSize: "0.85rem",
                cursor: "pointer",
                textDecoration: "underline",
                fontWeight: 600,
                marginTop: "0.5rem",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
