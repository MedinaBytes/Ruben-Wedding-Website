"use client";

import { useState } from "react";
import { testSmtpConnectionAction } from "@/app/actions/admin-email";

export function SmtpTester({ defaultRecipient = "" }: { defaultRecipient?: string }) {
  const [testEmail, setTestEmail] = useState(defaultRecipient);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleTest(e: React.MouseEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    // Grab surrounding form values
    const form = (e.currentTarget as HTMLElement).closest("form");
    const formData = new FormData(form || undefined);
    formData.set("testEmail", testEmail);

    try {
      const res = await testSmtpConnectionAction(formData);
      if (res.success) {
        setStatus("success");
        setMessage(res.message || "Connection successful!");
      } else {
        setStatus("error");
        setMessage(res.error || "Failed to connect to SMTP server.");
      }
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Network error during SMTP test.");
    }
  }

  return (
    <div
      style={{
        marginTop: "1.25rem",
        padding: "1rem",
        background: "#FBF9F7",
        border: "1px dashed #D5CBC4",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#44383A", marginBottom: "0.25rem" }}>
            Send Test Email To:
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your-email@example.com"
            style={{
              width: "100%",
              padding: "0.45rem 0.65rem",
              borderRadius: "5px",
              border: "1px solid #D5CBC4",
              fontSize: "0.85rem",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleTest}
          disabled={status === "loading"}
          style={{
            alignSelf: "flex-end",
            background: "#55644E",
            color: "#FFFFFF",
            border: 0,
            borderRadius: "6px",
            padding: "0.55rem 1.1rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: status === "loading" ? "wait" : "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {status === "loading" ? "Testing Connection..." : "⚡ Test SMTP Connection"}
        </button>
      </div>

      {status === "success" && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.6rem 0.8rem",
            background: "#E8F0E6",
            border: "1px solid #C0D6BA",
            borderRadius: "5px",
            color: "#2C5224",
            fontSize: "0.83rem",
            fontWeight: 500,
          }}
        >
          ✓ {message}
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.6rem 0.8rem",
            background: "#FCEEEF",
            border: "1px solid #E8B6BA",
            borderRadius: "5px",
            color: "#8C2836",
            fontSize: "0.83rem",
            lineHeight: 1.4,
          }}
        >
          ✗ <strong>SMTP Error:</strong> {message}
        </div>
      )}
    </div>
  );
}
