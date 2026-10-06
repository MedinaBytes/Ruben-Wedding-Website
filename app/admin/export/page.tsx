import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { exportAllWeddingDataAction } from "@/app/actions/admin-export";
import { ExportManager } from "@/components/admin/export-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exportar & Copias de Seguridad — Panel de Administración",
  robots: { index: false, follow: false },
};

export default async function AdminExportPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const exportSummary = await exportAllWeddingDataAction();

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "#8C2836" }}>
            Herramientas de Respaldo
          </span>
          <span style={{ color: "#C8BDC0" }}>·</span>
          <span style={{ fontSize: "0.76rem", color: "#7B6F71" }}>Schloss Hetzendorf 2027</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.1rem", margin: "0 0 0.5rem 0", color: "#2B2425", fontWeight: 600 }}>
          Exportación &amp; Respaldo de Datos
        </h1>
        <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.94rem", lineHeight: 1.5 }}>
          Descarga en un clic copias de seguridad completas en formato JSON y hojas de cálculo CSV para el catering, florista y organizadores del evento.
        </p>
      </div>

      <ExportManager initialCounts={exportSummary.counts} />
    </div>
  );
}
