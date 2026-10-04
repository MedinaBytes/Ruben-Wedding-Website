"use client";

import { useState } from "react";
import Link from "next/link";

interface ParsedRow {
  displayName: string;
  groupName?: string;
  maxGuests: number;
  plusOneAllowed: boolean;
  language: string;
}

export function BulkImportForm() {
  const [csvContent, setCsvContent] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    created: Array<{ id: string; displayName: string; url: string }>;
    errors: Array<{ row: number; displayName: string; message: string }>;
  } | null>(null);

  function handleParse(text: string) {
    setCsvContent(text);
    setResult(null);

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    // Identify header row
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf("display_name");
    const langIdx = headers.indexOf("language");
    const guestsIdx = headers.indexOf("max_guests");
    const plusOneIdx = headers.indexOf("plus_one_allowed");
    const groupIdx = headers.indexOf("group_name");

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      const name = nameIdx !== -1 ? parts[nameIdx] : parts[0];
      if (!name) continue;

      const lang = langIdx !== -1 ? parts[langIdx] : "en";
      const maxGuests = guestsIdx !== -1 ? parseInt(parts[guestsIdx], 10) || 1 : 1;
      const plusOne = plusOneIdx !== -1 ? parts[plusOneIdx]?.toLowerCase() === "true" : false;
      const group = groupIdx !== -1 ? parts[groupIdx] : undefined;

      rows.push({
        displayName: name,
        language: lang,
        maxGuests,
        plusOneAllowed: plusOne,
        groupName: group,
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

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Bulk CSV Guest List Import
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
            Import multiple guests at once, auto-generating secure 256-bit token invitation URLs.
          </p>
        </div>
        <a
          href="/wedding_guests_template.csv"
          download="wedding_guests_template.csv"
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
          }}
        >
          ⬇ Download CSV Template
        </a>
      </div>

      <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
        <label htmlFor="csv-input" style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.5rem" }}>
          Paste CSV Content (with headers: <code>display_name,language,max_guests,plus_one_allowed,group_name</code>)
        </label>
        <textarea
          id="csv-input"
          rows={7}
          value={csvContent}
          onChange={(e) => handleParse(e.target.value)}
          placeholder={`display_name,language,max_guests,plus_one_allowed,group_name\nFamilia Rodriguez,es,4,false,Family Ruben\nChristian & Guest,de-AT,2,true,Friends Vienna`}
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
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #EBE4DE", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8F5F2", borderBottom: "1px solid #EBE4DE" }}>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Name</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Group</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Guests</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>+1</th>
                    <th style={{ padding: "0.4rem 0.6rem" }}>Lang</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F5EFEB" }}>
                      <td style={{ padding: "0.4rem 0.6rem", fontWeight: 500 }}>{r.displayName}</td>
                      <td style={{ padding: "0.4rem 0.6rem", color: "#776A6C" }}>{r.groupName || "—"}</td>
                      <td style={{ padding: "0.4rem 0.6rem" }}>{r.maxGuests}</td>
                      <td style={{ padding: "0.4rem 0.6rem" }}>{r.plusOneAllowed ? "Yes" : "No"}</td>
                      <td style={{ padding: "0.4rem 0.6rem" }}>{r.language}</td>
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
              {isSubmitting ? "Importing..." : `Execute Bulk Import (${parsedRows.length} Guests)`}
            </button>
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", marginTop: 0, color: "#2B2425" }}>
            Import Complete
          </h2>
          <p style={{ color: "#55644E", fontWeight: 600, fontSize: "0.95rem" }}>
            ✓ Successfully created {result.imported} guest invitations.
          </p>

          {result.created.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#6A5D60", marginBottom: "0.5rem" }}>
                Generated Invitation Links:
              </p>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #EBE4DE", borderRadius: "6px", padding: "0.75rem", background: "#FAF7F5" }}>
                {result.created.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #EFE8E2", fontSize: "0.82rem" }}>
                    <span style={{ fontWeight: 600, color: "#2B2425" }}>{c.displayName}</span>
                    <span style={{ color: "#8C2836", fontFamily: "monospace" }}>{c.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/admin/invitations" style={{ color: "#8C2836", fontSize: "0.9rem", fontWeight: 500 }}>
              ← Return to Invitations List
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
