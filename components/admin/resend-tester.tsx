"use client";

import { useEffect, useState } from "react";
import { checkResendStatusAction, testResendConnectionAction, type ResendStatusResult } from "@/app/actions/admin-email";
import { buildEnvelopeInvitationHtml } from "@/lib/email/template";

export function ResendTester({
  defaultRecipient = "",
  initialConfigured = false,
}: {
  defaultRecipient?: string;
  initialConfigured?: boolean;
}) {
  const [statusInfo, setStatusInfo] = useState<ResendStatusResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [testEmail, setTestEmail] = useState(defaultRecipient);
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [dispatchMessage, setDispatchMessage] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState<"es" | "en" | "de" | "hu">("es");

  useEffect(() => {
    async function loadStatus() {
      setCheckingStatus(true);
      try {
        const info = await checkResendStatusAction();
        setStatusInfo(info);
      } catch {
        // Ignored
      } finally {
        setCheckingStatus(false);
      }
    }
    loadStatus();
  }, []);

  async function handleTest(e: React.MouseEvent) {
    e.preventDefault();
    setDispatchStatus("loading");
    setDispatchMessage("");

    // Grab surrounding form values
    const form = (e.currentTarget as HTMLElement).closest("form");
    const formData = new FormData(form || undefined);
    formData.set("testEmail", testEmail);

    try {
      const res = await testResendConnectionAction(formData);
      if (res.success) {
        setDispatchStatus("success");
        setDispatchMessage(res.message || "Test email dispatched successfully via Resend!");
        // Refresh status
        const info = await checkResendStatusAction();
        setStatusInfo(info);
      } else {
        setDispatchStatus("error");
        setDispatchMessage(res.error || "Failed to deliver test email via Resend.");
      }
    } catch (err: unknown) {
      setDispatchStatus("error");
      setDispatchMessage(err instanceof Error ? err.message : "Network error during Resend test.");
    }
  }

  const sampleHtml = buildEnvelopeInvitationHtml({
    guestName: previewLanguage === "es" ? "Elena Rostova y Familia" : "Sarah & Marcus",
    invitationUrl: "https://theandyrubenwedding.website/i/demo",
    language: previewLanguage,
    maxGuests: 2,
    plusOneAllowed: true,
    siteUrl: typeof window !== "undefined" ? window.location.origin : "https://theandyrubenwedding.website",
  });

  const isConnected = statusInfo?.connected ?? initialConfigured;

  return (
    <div
      style={{
        marginTop: "1.25rem",
        padding: "1.25rem",
        background: "#FAF7F4",
        border: "1px solid #E4DBD3",
        borderRadius: "10px",
      }}
    >
      {/* Header status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1rem",
          paddingBottom: "0.85rem",
          borderBottom: "1px solid #EDE4DC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem" }}>⚡</span>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2B2425" }}>
              Resend Service Status
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6A5D60" }}>
              {statusInfo?.apiKeyMasked ? `Key: ${statusInfo.apiKeyMasked}` : "API Key pending"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {checkingStatus ? (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
                background: "#EAE5E0",
                color: "#6A5D60",
                fontWeight: 600,
              }}
            >
              Checking connection...
            </span>
          ) : isConnected ? (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                background: "#E8F5E9",
                color: "#1B5E20",
                border: "1px solid #C8E6C9",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2E7D32" }} />
              Connected &amp; Active (Resend API)
            </span>
          ) : statusInfo?.configured ? (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                background: "#FCEEEF",
                color: "#992836",
                border: "1px solid #F5C6CB",
                fontWeight: 700,
              }}
            >
              ⚠ Invalid Key or Error
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "999px",
                background: "#F4EFEA",
                color: "#7D6E60",
                border: "1px solid #DFD5CC",
                fontWeight: 600,
              }}
            >
              ○ Not Configured (Enter key below)
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            style={{
              background: "#FFFFFF",
              border: "1px solid #D5CBC4",
              color: "#44383A",
              borderRadius: "6px",
              padding: "0.35rem 0.75rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✉ Preview Envelope
          </button>
        </div>
      </div>

      {/* Test Dispatch Form */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#44383A", marginBottom: "0.25rem" }}>
            Send Test Verification Email To:
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your-email@example.com"
            style={{
              width: "100%",
              padding: "0.5rem 0.7rem",
              borderRadius: "6px",
              border: "1px solid #D5CBC4",
              fontSize: "0.85rem",
              backgroundColor: "#FFFFFF",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleTest}
          disabled={dispatchStatus === "loading"}
          style={{
            background: "#8C2836",
            color: "#FFFFFF",
            border: 0,
            borderRadius: "6px",
            padding: "0.55rem 1.15rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: dispatchStatus === "loading" ? "wait" : "pointer",
            boxShadow: "0 2px 6px rgba(140, 40, 54, 0.2)",
          }}
        >
          {dispatchStatus === "loading" ? "Sending via Resend..." : "⚡ Test Resend API"}
        </button>
      </div>

      {/* Feedback Messages */}
      {dispatchStatus === "success" && (
        <div
          style={{
            marginTop: "0.85rem",
            padding: "0.65rem 0.9rem",
            background: "#E8F5E9",
            border: "1px solid #C8E6C9",
            borderRadius: "6px",
            color: "#1B5E20",
            fontSize: "0.82rem",
            fontWeight: 500,
          }}
        >
          ✓ {dispatchMessage}
        </div>
      )}

      {dispatchStatus === "error" && (
        <div
          style={{
            marginTop: "0.85rem",
            padding: "0.65rem 0.9rem",
            background: "#FCEEEF",
            border: "1px solid #F5C6CB",
            borderRadius: "6px",
            color: "#8C2836",
            fontSize: "0.82rem",
            lineHeight: 1.4,
          }}
        >
          ✗ <strong>Resend Error:</strong> {dispatchMessage}
        </div>
      )}

      {/* Envelope Template Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 24, 25, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F2",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              overflow: "hidden",
              border: "1px solid #D5CBC4",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #E2D7CF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#2B2425", fontFamily: "var(--font-display, serif)" }}>
                  ✉ Royal Closed Envelope Email Preview
                </h3>
                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.75rem", color: "#776A6C" }}>
                  Featuring the olive botanical wax monogram seal as the interactive link
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select
                  value={previewLanguage}
                  onChange={(e) => setPreviewLanguage(e.target.value as "es" | "en" | "de" | "hu")}
                  style={{
                    padding: "0.3rem 0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #D0C5BD",
                    fontSize: "0.78rem",
                  }}
                >
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                  <option value="de">Deutsch (DE)</option>
                  <option value="hu">Magyar (HU)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.3rem",
                    cursor: "pointer",
                    color: "#6A5D60",
                    padding: "0 0.4rem",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Render HTML iframe */}
            <div style={{ flex: 1, overflow: "auto", padding: "1rem", backgroundColor: "#EDE5DB" }}>
              <iframe
                title="Email Template Preview"
                srcDoc={sampleHtml}
                style={{
                  width: "100%",
                  height: "620px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "0.75rem 1.25rem",
                borderTop: "1px solid #E2D7CF",
                backgroundColor: "#FFFFFF",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.78rem",
                color: "#6A5D60",
              }}
            >
              <span>Clicking the wax seal or CTA button opens the personalized URL.</span>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                style={{
                  background: "#8C2836",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "5px",
                  padding: "0.4rem 0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
