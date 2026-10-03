import Link from "next/link";

import { LanguageSwitcher } from "@/components/invitation/language-switcher";

export function SiteHeader({
  detailsLabel,
  privacyLabel,
  languageLabel,
  mainNavigationLabel,
}: {
  detailsLabel: string;
  privacyLabel: string;
  languageLabel: string;
  mainNavigationLabel: string;
}) {
  return (
    <header className="site-header">
      <Link aria-label="Ruben & Andrea" className="site-header__mark" href="/">
        R<span aria-hidden="true">&</span>A
      </Link>
      <nav aria-label={mainNavigationLabel} className="site-header__nav">
        <a href="#event-note">{detailsLabel}</a>
        <Link href="/privacy">{privacyLabel}</Link>
      </nav>
      <LanguageSwitcher label={languageLabel} />
    </header>
  );
}