import type { Metadata } from "next";
import Link from "next/link";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin Portal — Ruben & Andrea Wedding",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await hasAuthenticatedAdmin();

  return (
    <div style={{ minHeight: "100dvh", background: "#FAF7F5", color: "#2B2425", fontFamily: "var(--font-body, system-ui)" }}>
      {isAdmin && (
        <header
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E8DFD8",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "0.75rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            {/* Brand Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Link href="/admin" style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", color: "#8C2836", textDecoration: "none", fontWeight: 600 }}>
                R <i>&</i> A <span style={{ fontSize: "0.85rem", color: "#776A6C", fontFamily: "var(--font-body)", fontWeight: 400, marginLeft: "0.35rem" }}>Admin</span>
              </Link>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
              {[
                { label: "Dashboard", href: "/admin" },
                { label: "Invitations", href: "/admin/invitations" },
                { label: "Bulk Import", href: "/admin/invitations/import" },
                { label: "RSVPs", href: "/admin/rsvps" },
                { label: "Music", href: "/admin/music" },
                { label: "WhatsApp", href: "/admin/whatsapp" },
                { label: "Settings", href: "/admin/settings" },
                { label: "Danger Zone", href: "/admin/danger" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    color: "#544648",
                    textDecoration: "none",
                    fontWeight: 500,
                    transition: "all 0.15s ease",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Sign Out Action */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <form action={signOutAdmin}>
                <button
                  type="submit"
                  style={{
                    background: "transparent",
                    border: "1px solid #DCD3CB",
                    borderRadius: "6px",
                    padding: "0.35rem 0.85rem",
                    fontSize: "0.8rem",
                    color: "#7A2833",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </header>
      )}

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {children}
      </main>
    </div>
  );
}
