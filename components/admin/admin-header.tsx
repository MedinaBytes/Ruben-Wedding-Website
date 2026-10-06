"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminHeaderProps {
  signOutAction: () => Promise<void>;
}

interface NavItem {
  label: string;
  href: string;
  icon: () => React.JSX.Element;
}

const PRIMARY_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    label: "Invitaciones",
    href: "/admin/invitations",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: "RSVPs",
    href: "/admin/rsvps",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  },
  {
    label: "Mesas",
    href: "/admin/seating",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="3" r="2" />
        <circle cx="12" cy="21" r="2" />
        <circle cx="3" cy="12" r="2" />
        <circle cx="21" cy="12" r="2" />
      </svg>
    ),
  },
  {
    label: "Música",
    href: "/admin/music",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    label: "Ajustes",
    href: "/admin/settings",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="4" x2="20" y1="21" y2="21" />
        <line x1="4" x2="20" y1="14" y2="14" />
        <line x1="4" x2="20" y1="7" y2="7" />
        <circle cx="14" cy="7" r="2" />
        <circle cx="8" cy="14" r="2" />
        <circle cx="16" cy="21" r="2" />
      </svg>
    ),
  },
];

const SECONDARY_NAV: NavItem[] = [
  {
    label: "WhatsApp",
    href: "/admin/whatsapp",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: "Analítica",
    href: "/admin/analytics",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
  {
    label: "Check-In",
    href: "/admin/checkin",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
      </svg>
    ),
  },
  {
    label: "Exportar",
    href: "/admin/export",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
    ),
  },
  {
    label: "Danger Zone",
    href: "/admin/danger",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    ),
  },
];

export function AdminHeader({ signOutAction }: AdminHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset menu open state synchronously on route change
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMoreDropdownOpen(false);
    setMobileOpen(false);
  }

  // Robust click-outside listener for Tools dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    if (moreDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreDropdownOpen]);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreDropdownOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Do not render the admin header on the login screen
  if (pathname === "/admin/login") {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isSecondaryActive = SECONDARY_NAV.some((item) => isActive(item.href));

  return (
    <header className="admin-header-nav">
      <div className="admin-header-nav__inner">
        {/* Brand Lockup */}
        <div className="admin-header-nav__brand-group">
          <Link href="/admin" className="admin-header-nav__brand">
            <span className="admin-header-nav__monogram">
              R<i>&</i>A
            </span>
            <div className="admin-header-nav__title-wrap">
              <span className="admin-header-nav__title">Wedding Concierge</span>
              <span className="admin-header-nav__subtitle">Vienna · Hetzendorf 2027</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="admin-header-nav__menu" aria-label="Navegación principal de administración">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${active ? "admin-nav-item--active" : ""}`}
              >
                <span className="admin-nav-item__icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="admin-nav-item__label">{item.label}</span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="admin-nav-dropdown-wrap" ref={dropdownRef}>
            <button
              type="button"
              className={`admin-nav-item admin-nav-dropdown-btn ${isSecondaryActive ? "admin-nav-item--active" : ""}`}
              onClick={() => setMoreDropdownOpen((prev) => !prev)}
              aria-expanded={moreDropdownOpen}
              aria-haspopup="true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              <span>Herramientas</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: moreDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {moreDropdownOpen && (
              <div className="admin-nav-dropdown-menu" role="menu">
                {SECONDARY_NAV.map((sub) => {
                  const subActive = isActive(sub.href);
                  const SubIcon = sub.icon;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      role="menuitem"
                      className={`admin-nav-dropdown-link ${subActive ? "admin-nav-dropdown-link--active" : ""}`}
                      onClick={() => setMoreDropdownOpen(false)}
                    >
                      <SubIcon />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: View Web Invitation + Sign Out */}
        <div className="admin-header-nav__actions">
          <a
            href="/i/demo/invitation"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-header-nav__preview-btn"
            title="Abrir vista previa de la invitación web de los invitados"
          >
            <span>Ver Invitación</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
          </a>

          <form action={signOutAction}>
            <button type="submit" className="admin-header-nav__signout-btn" title="Cerrar sesión de administrador">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
              <span>Salir</span>
            </button>
          </form>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="admin-header-nav__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú de navegación"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="admin-mobile-drawer">
          <div className="admin-mobile-drawer__section">
            <span className="admin-mobile-drawer__heading">Secciones Principales</span>
            <div className="admin-mobile-drawer__grid">
              {PRIMARY_NAV.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-mobile-link ${active ? "admin-mobile-link--active" : ""}`}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="admin-mobile-drawer__section" style={{ marginTop: "1rem" }}>
            <span className="admin-mobile-drawer__heading">Herramientas &amp; Sistema</span>
            <div className="admin-mobile-drawer__grid">
              {SECONDARY_NAV.map((sub) => {
                const subActive = isActive(sub.href);
                const SubIcon = sub.icon;
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={() => setMobileOpen(false)}
                    className={`admin-mobile-link ${subActive ? "admin-mobile-link--active" : ""}`}
                  >
                    <SubIcon />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
