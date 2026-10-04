import Link from "next/link";

import { LanguageSwitcher } from "@/components/invitation/language-switcher";
import { SoundToggle } from "@/components/invitation/sound-toggle";

export function SiteHeader({
  detailsLabel,
  detailsHref = "#event-note",
  privacyLabel,
  languageLabel,
  mainNavigationLabel,
  invitation,
  showDetailsLink = true,
  showLanguageSwitcher = true,
}: {
  detailsLabel: string;
  detailsHref?: string;
  privacyLabel: string;
  languageLabel: string;
  mainNavigationLabel: string;
  invitation?: { id: string; token: string };
  showDetailsLink?: boolean;
  showLanguageSwitcher?: boolean;
}) {
  return (
    <header className="site-header">
      <Link aria-label="Ruben & Andrea" className="site-header__mark" href={invitation ? `/i/${invitation.token}` : "/"}>
        R<span aria-hidden="true">&</span>A
      </Link>
      <nav aria-label={mainNavigationLabel} className="site-header__nav">
        {showDetailsLink && <a href={detailsHref}>{detailsLabel}</a>}
        <a href="#locations">Venues</a>
        <a href="#music">Music</a>
        <a href="#rsvp">RSVP</a>
        <Link href="/privacy">{privacyLabel}</Link>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifySelf: "end" }}>
        <SoundToggle />
        {showLanguageSwitcher && <LanguageSwitcher invitation={invitation} label={languageLabel} />}
      </div>
    </header>
  );
}