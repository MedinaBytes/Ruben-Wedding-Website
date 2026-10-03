import Link from "next/link";

import { LanguageSwitcher } from "@/components/invitation/language-switcher";

export function SiteHeader({
  detailsLabel,
  detailsHref = "#event-note",
  privacyLabel,
  languageLabel,
  mainNavigationLabel,
  invitation,
}: {
  detailsLabel: string;
  detailsHref?: string;
  privacyLabel: string;
  languageLabel: string;
  mainNavigationLabel: string;
  invitation?: { id: string; token: string };
}) {
  return (
    <header className="site-header">
      <Link aria-label="Ruben & Andrea" className="site-header__mark" href="/">
        R<span aria-hidden="true">&</span>A
      </Link>
      <nav aria-label={mainNavigationLabel} className="site-header__nav">
        <a href={detailsHref}>{detailsLabel}</a>
        <Link href="/privacy">{privacyLabel}</Link>
      </nav>
      <LanguageSwitcher invitation={invitation} label={languageLabel} />
    </header>
  );
}