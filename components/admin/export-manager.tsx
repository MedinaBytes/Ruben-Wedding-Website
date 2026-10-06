"use client";

import { useState, useTransition } from "react";
import { exportAllWeddingDataAction } from "@/app/actions/admin-export";

interface ExportManagerProps {
  initialCounts: {
    invitations: number;
    rsvps: number;
    songRequests: number;
    tableAssignments: number;
    wishes: number;
  };
}

export function ExportManager({ initialCounts }: ExportManagerProps) {
  const [counts] = useState(initialCounts);
  const [isExporting, startExport] = useTransition();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleFullJsonBackup() {
    startExport(async () => {
      try {
        const res = await exportAllWeddingDataAction();
        if (res.success) {
          const jsonStr = JSON.stringify(res, null, 2);
          const dateStr = new Date().toISOString().split("T")[0];
          triggerDownload(jsonStr, `wedding-full-backup-${dateStr}.json`, "application/json");
          setDownloadSuccess("✓ Complete JSON backup downloaded successfully.");
          setTimeout(() => setDownloadSuccess(null), 4000);
        } else {
          alert(res.error || "Error generating complete backup.");
        }
      } catch {
        alert("An error occurred while contacting the export server.");
      }
    });
  }

  function handleDownloadCsv(type: "guests" | "rsvps" | "seating") {
    startExport(async () => {
      try {
        const res = await exportAllWeddingDataAction();
        if (res.success && res.csv) {
          const dateStr = new Date().toISOString().split("T")[0];
          let content = "";
          let filename = "";

          if (type === "guests") {
            content = "\uFEFF" + res.csv.guests;
            filename = `wedding-guests-${dateStr}.csv`;
          } else if (type === "rsvps") {
            content = "\uFEFF" + res.csv.rsvps;
            filename = `wedding-rsvps-catering-${dateStr}.csv`;
          } else {
            content = "\uFEFF" + res.csv.seating;
            filename = `wedding-seating-tables-${dateStr}.csv`;
          }

          triggerDownload(content, filename, "text/csv;charset=utf-8;");
          setDownloadSuccess(`✓ CSV file (${type}) downloaded successfully.`);
          setTimeout(() => setDownloadSuccess(null), 4000);
        } else {
          alert(res.error || "Error downloading CSV file.");
        }
      } catch {
        alert("An error occurred while processing the download.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {downloadSuccess && (
        <div
          style={{
            background: "#E8F5E9",
            color: "#1B5E20",
            border: "1px solid #C8E6C9",
            borderRadius: "8px",
            padding: "0.85rem 1.25rem",
            fontSize: "0.88rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{downloadSuccess}</span>
          <button
            type="button"
            onClick={() => setDownloadSuccess(null)}
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "#1B5E20", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of 4 Export Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {/* Card 1: JSON Full Backup */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>📦</span>
              <span style={{ fontSize: "0.72rem", background: "#8C2836", color: "#FFFFFF", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 700 }}>
                Complete Snapshot
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Full System Backup (JSON)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Exports all platform records: invitations ({counts.invitations}), RSVP confirmations ({counts.rsvps}), song suggestions ({counts.songRequests}), table seating ({counts.tableAssignments}), and global site settings.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleFullJsonBackup}
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "7px",
              padding: "0.6rem 1.2rem",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: isExporting ? "wait" : "pointer",
              boxShadow: "0 2px 6px rgba(140, 40, 54, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span>{isExporting ? "Generating Snapshot..." : "Download JSON Backup"}</span>
            <span>↓</span>
          </button>
        </div>

        {/* Card 2: Guests CSV */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>👥</span>
              <span style={{ fontSize: "0.72rem", background: "#FAF7F5", color: "#544648", border: "1px solid #E5DCD4", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                {counts.invitations} Records
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Guest List &amp; Private Links (CSV)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Includes guest display names, private access token URLs, household families, preferred language, contact details, and invitation status.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadCsv("guests")}
            style={{
              background: "#FAF7F5",
              color: "#4C3F42",
              border: "1px solid #D8CFC8",
              borderRadius: "7px",
              padding: "0.6rem 1.2rem",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: isExporting ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span>Download Guests (CSV)</span>
            <span>↓</span>
          </button>
        </div>

        {/* Card 3: RSVPs & Catering CSV */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>🍽️</span>
              <span style={{ fontSize: "0.72rem", background: "#E8F5E9", color: "#1B5E20", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 700 }}>
                Catering &amp; Dietary
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              RSVP Responses &amp; Menus (CSV)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Spreadsheet ready for the palace executive catering chef: attendance status, confirmed guest counts, selected dishes, and dietary restrictions.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadCsv("rsvps")}
            style={{
              background: "#FAF7F5",
              color: "#4C3F42",
              border: "1px solid #D8CFC8",
              borderRadius: "7px",
              padding: "0.6rem 1.2rem",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: isExporting ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span>Download Catering &amp; RSVPs (CSV)</span>
            <span>↓</span>
          </button>
        </div>

        {/* Card 4: Seating Plan CSV */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>🪑</span>
              <span style={{ fontSize: "0.72rem", background: "#FAF7F5", color: "#544648", border: "1px solid #E5DCD4", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                {counts.tableAssignments} Assigned
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Table Seating Allocation (CSV)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Imperial palace seating arrangement: table names, table numbers, seated guest names, and protocol notes for reception staff.
            </p>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownloadCsv("seating")}
            style={{
              background: "#FAF7F5",
              color: "#4C3F42",
              border: "1px solid #D8CFC8",
              borderRadius: "7px",
              padding: "0.6rem 1.2rem",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: isExporting ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span>Download Seating Plan (CSV)</span>
            <span>↓</span>
          </button>
        </div>
      </div>

      {/* Supabase Free Tier Backup Runbook */}
      <div className="admin-card" style={{ background: "#FBF9F7", border: "1px solid #E5DDD5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🛡️</span>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "#2B2425" }}>
            Supabase Free Tier Backup Runbook
          </h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#6A5D60", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
          The Supabase free tier does not provide automated daily backups and pauses dormant projects after 7 days of inactivity. Our daily automated keep-alive cron (<code>/api/cron/keepalive</code>) prevents auto-pause, but periodic offline backups are strongly recommended:
        </p>
        <ol style={{ fontSize: "0.84rem", color: "#4C3F42", lineHeight: 1.6, paddingLeft: "1.25rem", margin: 0 }}>
          <li>
            <strong>Monthly JSON Snapshot:</strong> Click the <em>&quot;Download JSON Backup&quot;</em> button above once a month to archive an offline copy on your computer.
          </li>
          <li>
            <strong>Direct SQL Dump via Supabase CLI:</strong> If you have access to a terminal with the Supabase CLI installed, you can generate a complete PostgreSQL dump:
            <pre style={{ background: "#2B2425", color: "#F3EFEA", padding: "0.6rem 0.85rem", borderRadius: "6px", fontSize: "0.78rem", marginTop: "0.4rem", overflowX: "auto" }}>
              supabase db dump --db-url &quot;your-postgresql-connection-string&quot; &gt; backup-wedding.sql
            </pre>
          </li>
          <li>
            <strong>Secure Cloud Archival:</strong> Store the exported JSON or SQL file in your private cloud storage (Google Drive, iCloud, or Dropbox) for complete peace of mind.
          </li>
        </ol>
      </div>
    </div>
  );
}
