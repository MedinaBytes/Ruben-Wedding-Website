"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { LanguageSwitcher } from "@/components/invitation/language-switcher";
import { SoundToggle } from "@/components/invitation/sound-toggle";

export function SiteHeader({
  detailsLabel,
  detailsHref = "#event-note",
  venuesLabel = "Venues",
  storyLabel = "Our Story",
  musicLabel = "Music",
  rsvpLabel = "RSVP",
  languageLabel,
  mainNavigationLabel,
  invitation,
  showDetailsLink = true,
  showLanguageSwitcher = true,
  soundOnLabel,
  soundOffLabel,
}: {
  detailsLabel: string;
  detailsHref?: string;
  venuesLabel?: string;
  storyLabel?: string;
  musicLabel?: string;
  rsvpLabel?: string;
  privacyLabel?: string;
  languageLabel: string;
  mainNavigationLabel: string;
  invitation?: { id: string; token: string };
  showDetailsLink?: boolean;
  showLanguageSwitcher?: boolean;
  soundOnLabel?: string;
  soundOffLabel?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className={`site-header ${mobileMenuOpen ? "is-menu-open" : ""}`}>
      <div className="site-header__container">
        {/* Left: Couple Monogram */}
        <Link
          aria-label="Ruben & Andrea"
          className="site-header__mark"
          href={invitation ? `/i/${invitation.token}` : "/"}
          onClick={closeMenu}
        >
          <span className="site-header__mark-initial">R</span>
          <span aria-hidden="true" className="site-header__mark-amp">&</span>
          <span className="site-header__mark-initial">A</span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav aria-label={mainNavigationLabel} className="site-header__nav">
          {showDetailsLink && (
            <a href={detailsHref} className="site-header__nav-link">
              {detailsLabel}
            </a>
          )}
          <a href="#locations" className="site-header__nav-link">
            {venuesLabel}
          </a>
          <a href="#story" className="site-header__nav-link">
            {storyLabel}
          </a>
          <a href="#music" className="site-header__nav-link">
            {musicLabel}
          </a>
        </nav>

        {/* Right: Actions Cluster */}
        <div className="site-header__actions">
          {rsvpLabel && (
            <a href="#rsvp" className="site-header__rsvp-btn">
              {rsvpLabel}
            </a>
          )}
          <SoundToggle labelOn={soundOnLabel} labelOff={soundOffLabel} />
          {showLanguageSwitcher && (
            <LanguageSwitcher invitation={invitation} label={languageLabel} />
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="site-header__mobile-toggle"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="site-header__drawer-backdrop" onClick={closeMenu}>
          <div
            className="site-header__drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={mainNavigationLabel}
          >
            <nav className="site-header__drawer-nav">
              {showDetailsLink && (
                <a href={detailsHref} className="site-header__drawer-link" onClick={closeMenu}>
                  {detailsLabel}
                </a>
              )}
              <a href="#locations" className="site-header__drawer-link" onClick={closeMenu}>
                {venuesLabel}
              </a>
              <a href="#story" className="site-header__drawer-link" onClick={closeMenu}>
                {storyLabel}
              </a>
              <a href="#music" className="site-header__drawer-link" onClick={closeMenu}>
                {musicLabel}
              </a>
              {rsvpLabel && (
                <a href="#rsvp" className="site-header__drawer-rsvp" onClick={closeMenu}>
                  {rsvpLabel}
                </a>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}