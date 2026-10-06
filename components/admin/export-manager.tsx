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
          setDownloadSuccess("✓ Respaldo JSON completo descargado con éxito.");
          setTimeout(() => setDownloadSuccess(null), 4000);
        } else {
          alert(res.error || "Error al generar el respaldo completo.");
        }
      } catch {
        alert("Ocurrió un error al contactar el servidor de exportación.");
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
            filename = `wedding-invitados-${dateStr}.csv`;
          } else if (type === "rsvps") {
            content = "\uFEFF" + res.csv.rsvps;
            filename = `wedding-rsvps-menus-${dateStr}.csv`;
          } else {
            content = "\uFEFF" + res.csv.seating;
            filename = `wedding-distribucion-mesas-${dateStr}.csv`;
          }

          triggerDownload(content, filename, "text/csv;charset=utf-8;");
          setDownloadSuccess(`✓ Archivo CSV (${type}) descargado correctamente.`);
          setTimeout(() => setDownloadSuccess(null), 4000);
        } else {
          alert(res.error || "Error al descargar el archivo CSV.");
        }
      } catch {
        alert("Ocurrió un error al procesar la descarga.");
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
                Snapshot Total
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Copia de Seguridad Completa (JSON)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Exporta todos los registros del sistema: invitaciones ({counts.invitations}), respuestas RSVP ({counts.rsvps}), canciones ({counts.songRequests}), mesas ({counts.tableAssignments}) y configuración global.
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
            <span>{isExporting ? "Generando Snapshot..." : "Descargar Respaldo JSON"}</span>
            <span>↓</span>
          </button>
        </div>

        {/* Card 2: Guests CSV */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>👥</span>
              <span style={{ fontSize: "0.72rem", background: "#FAF7F5", color: "#544648", border: "1px solid #E5DCD4", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                {counts.invitations} Registros
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Lista de Invitados &amp; Enlaces (CSV)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Incluye nombres oficiales, tokens de enlace único, hogares/familias (households), idioma preferido, teléfono y estado de invitación.
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
            <span>Descargar Invitados (CSV)</span>
            <span>↓</span>
          </button>
        </div>

        {/* Card 3: RSVPs & Catering CSV */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>🍽️</span>
              <span style={{ fontSize: "0.72rem", background: "#E8F5E9", color: "#1B5E20", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 700 }}>
                Catering &amp; Dietas
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Respuestas RSVP &amp; Menús (CSV)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Planilla lista para entregar al chef ejecutivo de Hetzendorf: asistencia confirmada, recuento de comensales, platos elegidos y alergias alimentarias.
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
            <span>Descargar Menús &amp; Dietas (CSV)</span>
            <span>↓</span>
          </button>
        </div>

        {/* Card 4: Seating Plan CSV */}
        <div className="admin-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.75rem" }}>🪑</span>
              <span style={{ fontSize: "0.72rem", background: "#FAF7F5", color: "#544648", border: "1px solid #E5DCD4", padding: "0.2rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
                {counts.tableAssignments} Asignados
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 0.4rem 0", color: "#2B2425" }}>
              Distribución de Mesas (CSV)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.84rem", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
              Asignación por mesas imperiales: nombre de mesa, número, invitado asignado y notas de protocolo para los meseros y la recepción.
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
            <span>Descargar Mesas (CSV)</span>
            <span>↓</span>
          </button>
        </div>
      </div>

      {/* Supabase Free Tier Backup Runbook */}
      <div className="admin-card" style={{ background: "#FBF9F7", border: "1px solid #E5DDD5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🛡️</span>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, color: "#2B2425" }}>
            Guía de Respaldo Supabase Free Tier (Runbook)
          </h3>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#6A5D60", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
          El plan gratuito de Supabase no incluye copias de seguridad automáticas diarias y pausa proyectos inactivos tras 7 días. Nuestro cron diario automático <code>/api/cron/keepalive</code> previene la pausa, pero se recomienda guardar respaldos periódicos con estos pasos:
        </p>
        <ol style={{ fontSize: "0.84rem", color: "#4C3F42", lineHeight: 1.6, paddingLeft: "1.25rem", margin: 0 }}>
          <li>
            <strong>Descargar el Snapshot JSON mensual:</strong> Haz clic en el botón superior <em>&quot;Descargar Respaldo JSON&quot;</em> una vez al mes para archivar un archivo local en tu computadora.
          </li>
          <li>
            <strong>Respaldo completo de base de datos vía CLI:</strong> Si tienes acceso a la terminal con Supabase CLI configurado, puedes generar un volcado SQL nativo:
            <pre style={{ background: "#2B2425", color: "#F3EFEA", padding: "0.6rem 0.85rem", borderRadius: "6px", fontSize: "0.78rem", marginTop: "0.4rem", overflowX: "auto" }}>
              supabase db dump --db-url &quot;tu-connection-string-postgresql&quot; &gt; backup-wedding.sql
            </pre>
          </li>
          <li>
            <strong>Almacenamiento Seguro:</strong> Guarda el archivo JSON o SQL en tu nube personal (Google Drive, iCloud o Dropbox) para máxima tranquilidad antes de la boda.
          </li>
        </ol>
      </div>
    </div>
  );
}
