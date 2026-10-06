"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminHeaderProps {
  signOutAction: () => Promise<void>;
}

interface NavGroup {
  category: string;
  items: Array<{
    label: string;
    href: string;
    badge?: string;
    icon: string;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    category: "General",
    items: [
      { label: "Dashboard", href: "/admin", icon: "📊" },
      { label: "Analítica", href: "/admin/analytics", icon: "📈" },
    ],
  },
  {
    category: "Invitados",
    items: [
      { label: "Invitaciones", href: "/admin/invitations", icon: "💌" },
      { label: "Importar", href: "/admin/invitations/import", icon: "📥" },
      { label: "RSVPs", href: "/admin/rsvps", icon: "✓" },
    ],
  },
  {
    category: "Palacio & Evento",
    items: [
      { label: "Mesas", href: "/admin/seating", icon: "🪑" },
      { label: "Check-In", href: "/admin/checkin", icon: "🚪" },
      { label: "Música", href: "/admin/music", icon: "🎵" },
    ],
  },
  {
    category: "Sistema",
    items: [
      { label: "Ajustes & Pagos", href: "/admin/settings", icon: "⚙️" },
      { label: "WhatsApp", href: "/admin/whatsapp", icon: "💬" },
      { label: "Exportar", href: "/admin/export", icon: "📦" },
      { label: "Danger Zone", href: "/admin/danger", icon: "⚠️" },
    ],
  },
];

export function AdminHeader({ signOutAction }: AdminHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E8DFD8",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Brand & Quick Preview Link */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link
            href="/admin"
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "1.45rem",
              color: "#8C2836",
              textDecoration: "none",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            R <span style={{ fontStyle: "italic", fontWeight: 400, color: "#ECC57B" }}>&amp;</span> A
            <span
              style={{
                fontSize: "0.82rem",
                color: "#776A6C",
                fontFamily: "var(--font-body, system-ui)",
                fontWeight: 500,
                marginLeft: "0.5rem",
                padding: "0.15rem 0.5rem",
                background: "#FAF7F5",
                borderRadius: "4px",
                border: "1px solid #ECE3DC",
              }}
            >
              Admin Suite
            </span>
          </Link>

          <a
            href="/i/demo"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.78rem",
              color: "#55644E",
              textDecoration: "none",
              background: "#F4F7F2",
              border: "1px solid #DCE6D7",
              borderRadius: "6px",
              padding: "0.25rem 0.65rem",
              fontWeight: 500,
            }}
          >
            <span>Ver Invitación Web</span>
            <span style={{ fontSize: "0.7rem" }}>↗</span>
          </a>
        </div>

        {/* Right Section: Mobile Toggle & Sign Out */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <form action={signOutAction}>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "1px solid #E2D7CF",
                borderRadius: "6px",
                padding: "0.4rem 0.85rem",
                fontSize: "0.82rem",
                color: "#7A2833",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              Cerrar Sesión
            </button>
          </form>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: "none",
              background: "#FAF7F5",
              border: "1px solid #E2D7CF",
              borderRadius: "6px",
              padding: "0.4rem 0.65rem",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
            className="admin-mobile-toggle"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Categorized Desktop Navigation Hub */}
      <nav
        aria-label="Main Admin Navigation"
        style={{
          borderTop: "1px solid #F0E8E2",
          background: "#FAF7F5",
        }}
        className="admin-desktop-nav"
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0.35rem 1.5rem",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <div
              key={group.category}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                paddingRight: groupIdx < NAV_GROUPS.length - 1 ? "1.25rem" : 0,
                borderRight: groupIdx < NAV_GROUPS.length - 1 ? "1px solid #EADBCE" : "none",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#96888A",
                  fontWeight: 700,
                  marginRight: "0.4rem",
                  userSelect: "none",
                }}
              >
                {group.category}:
              </span>

              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.35rem 0.65rem",
                      borderRadius: "6px",
                      fontSize: "0.83rem",
                      fontWeight: active ? 600 : 500,
                      color: active ? "#FFFFFF" : "#544648",
                      background: active ? "#8C2836" : "transparent",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      boxShadow: active ? "0 2px 6px rgba(140, 40, 54, 0.2)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", opacity: active ? 1 : 0.85 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            background: "#FFFFFF",
            borderTop: "1px solid #E8DFD8",
            padding: "1rem 1.5rem 1.5rem",
          }}
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.category} style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#8C2836",
                  fontWeight: 700,
                  marginBottom: "0.4rem",
                }}
              >
                {group.category}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        fontWeight: active ? 600 : 500,
                        color: active ? "#FFFFFF" : "#44383A",
                        background: active ? "#8C2836" : "#FAF7F5",
                        textDecoration: "none",
                        border: "1px solid #ECE4DD",
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          .admin-mobile-toggle {
            display: inline-flex !important;
          }
          .admin-desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
