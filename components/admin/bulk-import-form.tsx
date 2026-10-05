"use client";

import { useState } from "react";
import Link from "next/link";

interface ParsedRow {
  displayName: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  language: string;
  maxGuests: number;
  plusOneAllowed: boolean;
  groupName?: string;
  personalMessage?: string;
}

interface CreatedInvitation {
  id: string;
  displayName: string;
  url: string;
  language: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}

export function BulkImportForm() {
  const [csvContent, setCsvContent] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    created: CreatedInvitation[];
    errors: Array<{ row: number; displayName: string; message: string }>;
  } | null>(null);

  function findColumnIndex(headers: string[], aliases: string[]) {
    return headers.findIndex((h) => aliases.includes(h.toLowerCase().replace(/[\s_-]+/g, "")));
  }

  function handleParse(text: string) {
    setCsvContent(text);
    setResult(null);

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    // Split headers and find indices using aliases
    const rawHeaders = lines[0].split(",").map((h) => h.trim());
    const nameIdx = findColumnIndex(rawHeaders, ["displayname", "name", "fullname", "guest", "guestname", "invitado", "gast", "vendeg"]);
    const emailIdx = findColumnIndex(rawHeaders, ["email", "guestemail", "mail", "correo", "emailaddress"]);
    const whatsappIdx = findColumnIndex(rawHeaders, ["whatsapp", "wa", "whatsappnumber", "celular", "mobile", "tel"]);
    const phoneIdx = findColumnIndex(rawHeaders, ["phone", "mobilephone", "telefono", "telefon"]);
    const langIdx = findColumnIndex(rawHeaders, ["language", "lang", "locale", "idioma", "sprache", "nyelv"]);
    const guestsIdx = findColumnIndex(rawHeaders, ["maxguests", "guests", "seats", "places", "invitados", "gaste"]);
    const plusOneIdx = findColumnIndex(rawHeaders, ["plusoneallowed", "plusone", "plus1", "companion", "+1"]);
    const groupIdx = findColumnIndex(rawHeaders, ["groupname", "group", "family", "grupo", "gruppe", "csoport"]);
    const msgIdx = findColumnIndex(rawHeaders, ["personalmessage", "message", "note", "greeting", "mensaje", "nachricht"]);

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Basic CSV split respecting simple quotes if present
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      const name = nameIdx !== -1 ? parts[nameIdx] : parts[0];
      if (!name) continue;

      const email = emailIdx !== -1 ? parts[emailIdx] : undefined;
      const whatsapp = whatsappIdx !== -1 ? parts[whatsappIdx] : undefined;
      const phone = phoneIdx !== -1 ? parts[phoneIdx] : undefined;
      const lang = langIdx !== -1 && parts[langIdx] ? parts[langIdx] : "en";
      let maxGuests = guestsIdx !== -1 ? parseInt(parts[guestsIdx], 10) || 1 : 1;
      const plusOneRaw = plusOneIdx !== -1 ? parts[plusOneIdx]?.toLowerCase() : "";
      const plusOne = plusOneRaw === "true" || plusOneRaw === "1" || plusOneRaw === "yes" || plusOneRaw === "si";
      if (plusOne && maxGuests < 2) {
        maxGuests = 2;
      }
      const group = groupIdx !== -1 ? parts[groupIdx] : undefined;
      const personalMessage = msgIdx !== -1 ? parts[msgIdx] : undefined;

      rows.push({
        displayName: name,
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        phone: phone || undefined,
        language: lang,
        maxGuests,
        plusOneAllowed: plusOne,
        groupName: group || undefined,
        personalMessage: personalMessage || undefined,
      });
    }

    setParsedRows(rows);
  }

  async function handleImport() {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/invitations/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      alert("Import request failed. Please check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      handleParse(content);
    };
    reader.readAsText(file);
  }

  function handleDownloadTemplate(e: React.MouseEvent) {
    e.preventDefault();
    const csvContent =
      "display_name,email,whatsapp,language,max_guests,plus_one_allowed,group_name,personal_message\n" +
      "Familia Quijada Sanchez,maria.quijada@example.com,+34612345678,es,4,false,Family Ruben,Nos emociona compartir este viaje con ustedes.\n" +
      "Christian & Guest,christian.weber@example.at,+436641234567,de-AT,2,true,Friends Vienna,Wir freuen uns sehr auf ein unvergessliches Fest!\n" +
      "Mate Kovacs,mate.kovacs@example.hu,+36301234567,hu,1,false,Friends Hungary,Szeretettel várunk Bécsben!\n" +
      "Sarah Jenkins,sarah.j@example.com,+447911123456,en,2,true,International Friends,Looking forward to celebrating together in Vienna!\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wedding_guests_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleExportResults() {
    if (!result || result.created.length === 0) return;
    const headers = "id,display_name,language,email,whatsapp,invitation_url,whatsapp_message\n";
    const rows = result.created.map((c) => {
      const cleanWa = (c.whatsappMessage || "").replace(/"/g, '""');
      return `"${c.id}","${c.displayName}","${c.language}","${c.email || ""}","${c.whatsapp || ""}","${c.url}","${cleanWa}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wedding_invitations_generated_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text: string, id: string, isMessage = false) {
    await navigator.clipboard.writeText(text);
    if (isMessage) {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Bulk Guest List Import &amp; Dispatch Links
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
            Import guests from CSV with email &amp; WhatsApp, auto-generating secure token URLs and pre-formatted dispatch messages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "#FFFFFF",
            border: "1px solid #D5CBC4",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.85rem",
            color: "#544648",
            textDecoration: "none",
            fontWeight: 600,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: "pointer",
          }}
        >
          ⬇ Download Sample CSV Template
        </button>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <label htmlFor="csv-input" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2B2425" }}>
            Paste CSV Content (or upload file below):
          </label>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "#F5EFEB",
              color: "#8C2836",
              padding: "0.35rem 0.75rem",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              border: "1px solid #E2D7CF",
            }}
          >
            📁 Choose .csv File
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>
        <textarea
          id="csv-input"
          rows={7}
          value={csvContent}
          onChange={(e) => handleParse(e.target.value)}
          placeholder={`display_name,email,whatsapp,language,max_guests,plus_one_allowed,group_name\nFamilia Rodriguez,diego@example.com,+34612345678,es,4,false,Family Ruben\nChristian & Guest,christian@example.at,+436641234567,de-AT,2,true,Friends Vienna`}
          style={{
            width: "100%",
            fontFamily: "monospace",
            fontSize: "0.82rem",
            padding: "0.75rem",
            border: "1px solid #D5CBC4",
            borderRadius: "6px",
            boxSizing: "border-box",
            lineHeight: 1.4,
          }}
        />

        {parsedRows.length > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#55644E", margin: "0 0 0.5rem 0" }}>
              ✓ Ready to import {parsedRows.length} guest invitations:
            </p>
            <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #EBE4DE", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8F5F2", borderBottom: "1px solid #EBE4DE" }}>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Name</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Email</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>WhatsApp / Phone</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Group</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Seats</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>+1</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Lang</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F5EFEB" }}>
                      <td style={{ padding: "0.4rem 0.6rem", fontWeight: 500 }}>{r.displayName}</td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "#6A5D60" }}>{r.email || "—"}</td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "#6A5D60" }}>{r.whatsapp || r.phone || "—"}</td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "#776A6C" }}>{r.groupName || "—"}</td>
                      <td style={{ padding: "0.4rem 0.6rem" }}>{r.maxGuests}</td>
                      <td style={{ padding: "0.4rem 0.6rem" }}>{r.plusOneAllowed ? "Yes" : "No"}</td>
                      <td style={{ padding: "0.4rem 0.6rem", textTransform: "uppercase" }}>{r.language}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleImport}
              style={{
                marginTop: "1.25rem",
                background: "#8C2836",
                color: "#FFFFFF",
                border: 0,
                borderRadius: "6px",
                padding: "0.65rem 1.4rem",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: isSubmitting ? "wait" : "pointer",
              }}
            >
              {isSubmitting ? "Importing & Generating Links..." : `Execute Bulk Import (${parsedRows.length} Guests)`}
            </button>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
                Import Complete
              </h2>
              <p style={{ color: "#55644E", fontWeight: 600, fontSize: "0.95rem", margin: 0 }}>
                ✓ Successfully created {result.imported} guest invitations.
              </p>
            </div>
            {result.created.length > 0 && (
              <button
                type="button"
                onClick={handleExportResults}
                style={{
                  background: "#FAF7F5",
                  border: "1px solid #D5CBC4",
                  borderRadius: "6px",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#4A3E40",
                  cursor: "pointer",
                }}
              >
                📊 Download Generated Links (CSV)
              </button>
            )}
          </div>

          {result.errors.length > 0 && (
            <div style={{ background: "#FDF2F3", border: "1px solid #F5C6CB", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#8E2B38" }}>
              <strong>Failed Rows ({result.errors.length}):</strong>
              <ul style={{ margin: "0.3rem 0 0 1.2rem", padding: 0 }}>
                {result.errors.map((err, i) => (
                  <li key={i}>Row {err.row}: {err.message} ({err.displayName})</li>
                ))}
              </ul>
            </div>
          )}

          {result.created.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#6A5D60", marginBottom: "0.5rem", fontWeight: 600 }}>
                Generated Invitation Links &amp; Dispatch Actions:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {result.created.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#FAF7F5",
                      border: "1px solid #EAE2DB",
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontWeight: 700, color: "#2B2425", fontSize: "0.95rem" }}>{c.displayName}</span>
                        <span style={{ fontSize: "0.72rem", background: "#E8F0E4", color: "#3B612C", padding: "0.15rem 0.4rem", borderRadius: "4px", textTransform: "uppercase" }}>
                          {c.language}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        {c.email && (
                          <span style={{ fontSize: "0.78rem", color: "#6A5D60", background: "#FFFFFF", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid #E2D7CF" }}>
                            ✉ {c.email}
                          </span>
                        )}
                        {c.whatsapp && (
                          <span style={{ fontSize: "0.78rem", color: "#25D366", background: "#FFFFFF", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid #E2D7CF" }}>
                            📱 {c.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ color: "#8C2836", fontFamily: "monospace", fontSize: "0.82rem", wordBreak: "break-all" }}>
                        {c.url}
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.url, c.id, false)}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #D5CBC4",
                            borderRadius: "4px",
                            padding: "0.25rem 0.55rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            color: copiedId === c.id ? "#3B612C" : "#4A3E40",
                          }}
                        >
                          {copiedId === c.id ? "✓ Copied" : "Copy Link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.whatsappMessage, c.id, true)}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #D5CBC4",
                            borderRadius: "4px",
                            padding: "0.25rem 0.55rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            color: copiedMsgId === c.id ? "#3B612C" : "#4A3E40",
                          }}
                        >
                          {copiedMsgId === c.id ? "✓ Copied Msg" : "Copy WhatsApp Msg"}
                        </button>
                        {c.whatsapp && (
                          <a
                            href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(c.whatsappMessage)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: "#25D366",
                              color: "#FFFFFF",
                              border: 0,
                              borderRadius: "4px",
                              padding: "0.25rem 0.55rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            Open WhatsApp ↗
                          </a>
                        )}
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: "#FAF7F5",
                            color: "#8C2836",
                            border: "1px solid #D5CBC4",
                            borderRadius: "4px",
                            padding: "0.25rem 0.55rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Open Invite ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/admin/invitations" style={{ color: "#8C2836", fontSize: "0.9rem", fontWeight: 600 }}>
              ← Return to Invitations List
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
