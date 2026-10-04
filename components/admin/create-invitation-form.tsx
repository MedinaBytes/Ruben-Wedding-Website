"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvitationAction, createDemoInvitationAction } from "@/app/actions/admin-invitations";
import { supportedLocales } from "@/lib/wedding-config";

export function CreateInvitationForm({ labels }: { labels: Record<string, string> }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setErrorMessage("");
    setSuccessMessage("");
    setInvitationUrl("");

    const res = await createInvitationAction(formData);
    if (!res.success || !res.url) {
      setErrorMessage(res.error || labels.createInvitationError);
      return;
    }

    setInvitationUrl(res.url);
    setSuccessMessage(labels.createInvitationSuccess);
    startTransition(() => router.refresh());
  }

  async function handleDemo() {
    setErrorMessage("");
    setSuccessMessage("");
    const res = await createDemoInvitationAction();
    if (res.success && res.url) {
      setInvitationUrl(res.url);
      setSuccessMessage("Demo invitation created successfully!");
      startTransition(() => router.refresh());
    }
  }

  async function copyUrl() {
    if (!invitationUrl) return;
    await navigator.clipboard.writeText(invitationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: "600px" }}>
      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label htmlFor="invitation-display-name" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
            {labels.displayName} *
          </label>
          <input
            id="invitation-display-name"
            name="displayName"
            required
            maxLength={160}
            placeholder="e.g. Maria Gonzalez / Familie Schmidt"
            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label htmlFor="invitation-group-name" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              {labels.groupName}
            </label>
            <input
              id="invitation-group-name"
              name="groupName"
              placeholder="e.g. Family / Friends Vienna"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label htmlFor="invitation-language" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              {labels.preferredLanguage}
            </label>
            <select
              id="invitation-language"
              name="language"
              defaultValue=""
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem", background: "#FFFFFF" }}
            >
              <option value="">{labels.languageDefault}</option>
              {supportedLocales.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "de-AT" ? "Deutsch (DE)" : loc.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center" }}>
          <div>
            <label htmlFor="invitation-max-guests" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              {labels.guestPlaces}
            </label>
            <input
              id="invitation-max-guests"
              name="maxGuests"
              type="number"
              min={1}
              max={20}
              defaultValue={1}
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem" }}
            />
          </div>

          <div style={{ paddingTop: "1.2rem" }}>
            <label htmlFor="invitation-plus-one" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer", color: "#2B2425" }}>
              <input id="invitation-plus-one" name="plusOneAllowed" type="checkbox" style={{ width: "18px", height: "18px" }} />
              <span>{labels.plusOneAllowed}</span>
            </label>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label htmlFor="invitation-phone" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              Mobile Phone (Optional)
            </label>
            <input
              id="invitation-phone"
              name="phone"
              placeholder="e.g. +43 664 1234567"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem" }}
            />
          </div>

          <div>
            <label htmlFor="invitation-whatsapp" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
              WhatsApp Number (Optional)
            </label>
            <input
              id="invitation-whatsapp"
              name="whatsapp"
              placeholder="e.g. +436641234567"
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.9rem" }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="invitation-personal-message" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.35rem" }}>
            Personal Greeting Note (Optional)
          </label>
          <textarea
            id="invitation-personal-message"
            name="personalMessage"
            rows={2}
            placeholder="Personal message displayed to this guest in the story section..."
            style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }}
          />
        </div>

        {errorMessage && (
          <div style={{ background: "#FDF2F3", border: "1px solid #F5C6CB", color: "#8E2B38", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
            ✕ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{ background: "#EEF6EC", border: "1px solid #C3E6CB", color: "#2E6930", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
            ✓ {successMessage}
          </div>
        )}

        {invitationUrl && (
          <div style={{ background: "#FAF7F5", border: "1px solid #E4DBD3", borderRadius: "8px", padding: "1rem" }}>
            <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.82rem", fontWeight: 600, color: "#544648" }}>
              Personal Guest Invitation URL:
            </p>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                readOnly
                value={invitationUrl}
                style={{ flex: 1, minWidth: "220px", padding: "0.5rem", borderRadius: "4px", border: "1px solid #D5CBC4", fontSize: "0.85rem", fontFamily: "monospace" }}
              />
              <button
                type="button"
                onClick={copyUrl}
                style={{ background: "#8C2836", color: "#FFFFFF", border: 0, borderRadius: "4px", padding: "0.5rem 0.8rem", fontSize: "0.8rem", cursor: "pointer" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <a
                href={invitationUrl}
                target="_blank"
                rel="noreferrer"
                style={{ background: "#55644E", color: "#FFFFFF", borderRadius: "4px", padding: "0.5rem 0.8rem", fontSize: "0.8rem", textDecoration: "none" }}
              >
                Open ↗
              </a>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.7rem 1.4rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending ? labels.creatingInvitation : labels.createInvitation}
          </button>

          <button
            type="button"
            onClick={handleDemo}
            disabled={isPending}
            style={{
              background: "transparent",
              border: "1px solid #8C2836",
              color: "#8C2836",
              borderRadius: "6px",
              padding: "0.7rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ★ Create Demo Guest (1-Click)
          </button>
        </div>
      </form>
    </div>
  );
}
