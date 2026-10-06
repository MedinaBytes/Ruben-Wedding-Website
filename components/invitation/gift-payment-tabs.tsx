"use client";

import { useState } from "react";
import type { SiteSettingsData } from "./wedding-sections";

interface GiftPaymentTabsProps {
  siteSettings: SiteSettingsData;
  locale?: string;
}

const copyLabels: Record<string, { copied: string; copy: string; open: string }> = {
  es: { copied: "¡Copiado!", copy: "Copiar", open: "Abrir enlace" },
  en: { copied: "Copied!", copy: "Copy", open: "Open link" },
  "de-AT": { copied: "Kopiert!", copy: "Kopieren", open: "Link öffnen" },
  hu: { copied: "Másolva!", copy: "Másolás", open: "Hivatkozás megnyitása" },
};

const tabTitles: Record<string, { bank: string; revolut: string; wise: string; cash: string }> = {
  es: {
    bank: "Transferencia SEPA",
    revolut: "Revolut",
    wise: "Wise",
    cash: "En mano / Efectivo",
  },
  en: {
    bank: "Bank Transfer",
    revolut: "Revolut",
    wise: "Wise",
    cash: "Cash / Envelope",
  },
  "de-AT": {
    bank: "Banküberweisung",
    revolut: "Revolut",
    wise: "Wise",
    cash: "Kuvert / Bar",
  },
  hu: {
    bank: "Banki átutalás",
    revolut: "Revolut",
    wise: "Wise",
    cash: "Készpénz / Boríték",
  },
};

const subheadings: Record<string, { bank: string; revolut: string; wise: string; cash: string }> = {
  es: {
    bank: "Transferencia bancaria europea tradicional (EUR)",
    revolut: "Envío instantáneo entre cuentas Revolut o tarjeta",
    wise: "Transferencia internacional multidivisa sin altas comisiones",
    cash: "Buzón nupcial de sobres en el Palacio de Hetzendorf",
  },
  en: {
    bank: "Traditional European bank transfer (EUR)",
    revolut: "Instant transfer via Revolut Pay or card",
    wise: "Multi-currency international transfer with low fees",
    cash: "Imperial wedding envelope box at Schloss Hetzendorf",
  },
  "de-AT": {
    bank: "Klassische Banküberweisung (EUR)",
    revolut: "Sofortüberweisung über Revolut Pay oder Karte",
    wise: "Internationale Multiwährungs-Überweisung mit geringen Gebühren",
    cash: "Kaiserliche Hochzeits-Kuvertbox im Schloss Hetzendorf",
  },
  hu: {
    bank: "Hagyományos európai banki átutalás (EUR)",
    revolut: "Azonnali átutalás Revolut Pay-en vagy kártyán keresztül",
    wise: "Nemzetközi többdevizás átutalás alacsony díjakkal",
    cash: "Esküvői borítékgyűjtő a Hetzendorf Kastélyban",
  },
};

export function GiftPaymentTabs({ siteSettings, locale = "es" }: GiftPaymentTabsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showBank = siteSettings.enableBankTransfer !== false && Boolean(siteSettings.iban || siteSettings.accountHolder);
  const showRevolut = siteSettings.enableRevolut !== false && Boolean(siteSettings.revolutTag);
  const showWise = siteSettings.enableWise !== false && Boolean(siteSettings.wiseTag);
  const showCash = siteSettings.enableCash !== false;

  const tabs: Array<{ id: "bank" | "revolut" | "wise" | "cash"; label: string; icon: string }> = [];

  const lang = tabTitles[locale] || tabTitles.en;
  const subs = subheadings[locale] || subheadings.en;
  const labels = copyLabels[locale] || copyLabels.en;

  if (showBank) tabs.push({ id: "bank", label: lang.bank, icon: "🏦" });
  if (showRevolut) tabs.push({ id: "revolut", label: lang.revolut, icon: "⚡" });
  if (showWise) tabs.push({ id: "wise", label: lang.wise, icon: "🌐" });
  if (showCash) tabs.push({ id: "cash", label: lang.cash, icon: "✉️" });

  const [activeTab, setActiveTab] = useState<"bank" | "revolut" | "wise" | "cash">(
    tabs[0]?.id || "bank"
  );

  const handleCopy = (text: string, key: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  if (tabs.length === 0) {
    return (
      <div style={{ marginTop: "1.25rem", padding: "1.25rem", background: "rgba(247, 245, 242, 0.9)", border: "1px solid #E8DFD8", borderRadius: "8px", fontSize: "0.9rem", color: "#6E6264" }}>
        {siteSettings.giftNote || "Una aportación para nuestras próximas aventuras juntos será un detalle muy especial."}
      </div>
    );
  }

  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0].id;

  const revolutUrl = siteSettings.revolutTag?.startsWith("http")
    ? siteSettings.revolutTag
    : siteSettings.revolutTag?.startsWith("@")
    ? `https://revolut.me/${siteSettings.revolutTag.slice(1)}`
    : siteSettings.revolutTag
    ? `https://revolut.me/${siteSettings.revolutTag}`
    : null;

  const wiseUrl = siteSettings.wiseTag?.startsWith("http")
    ? siteSettings.wiseTag
    : null;

  return (
    <div style={{ marginTop: "1.75rem", width: "100%", maxWidth: "640px", margin: "1.75rem auto 0 auto" }}>
      {/* Tab Switcher Pills */}
      <div
        role="tablist"
        aria-label="Payment Methods"
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: isActive ? "1px solid #8C2836" : "1px solid #E2D7CF",
                background: isActive ? "#8C2836" : "rgba(255, 255, 255, 0.8)",
                color: isActive ? "#FFFFFF" : "#5A4C4E",
                boxShadow: isActive ? "0 2px 8px rgba(140, 40, 54, 0.18)" : "none",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content Box */}
      <div
        role="tabpanel"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          border: "1px solid #E8DFD8",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          textAlign: "left",
        }}
      >
        {/* BANK TAB */}
        {currentTab === "bank" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🏦</span>
              <h4 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.15rem", margin: 0, color: "#2B2425" }}>
                {lang.bank}
              </h4>
            </div>
            <p style={{ margin: "0 0 1.25rem 0", color: "#776A6C", fontSize: "0.82rem" }}>
              {subs.bank}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {siteSettings.accountHolder && (
                <div style={{ background: "#FAF7F5", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #EFE8E1" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7D80", marginBottom: "0.15rem" }}>
                    Titular / Beneficiary
                  </div>
                  <div style={{ fontWeight: 600, color: "#2B2425", fontSize: "0.95rem" }}>
                    {siteSettings.accountHolder}
                  </div>
                </div>
              )}

              {siteSettings.bankName && (
                <div style={{ background: "#FAF7F5", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #EFE8E1" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7D80", marginBottom: "0.15rem" }}>
                    Banco / Financial Institution
                  </div>
                  <div style={{ fontWeight: 500, color: "#2B2425", fontSize: "0.92rem" }}>
                    {siteSettings.bankName}
                  </div>
                </div>
              )}

              {siteSettings.iban && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", background: "#FAF7F5", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #EFE8E1" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7D80", marginBottom: "0.15rem" }}>
                      IBAN
                    </div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#8C2836", fontSize: "0.95rem", wordBreak: "break-all" }}>
                      {siteSettings.iban}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(siteSettings.iban!, "iban")}
                    style={{
                      flexShrink: 0,
                      background: copiedKey === "iban" ? "#E8F5E9" : "#FFFFFF",
                      color: copiedKey === "iban" ? "#2E7D32" : "#8C2836",
                      border: copiedKey === "iban" ? "1px solid #A5D6A7" : "1px solid #DACEC6",
                      borderRadius: "6px",
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copiedKey === "iban" ? `✓ ${labels.copied}` : labels.copy}
                  </button>
                </div>
              )}

              {siteSettings.bic && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", background: "#FAF7F5", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #EFE8E1" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7D80", marginBottom: "0.15rem" }}>
                      BIC / SWIFT
                    </div>
                    <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#2B2425", fontSize: "0.9rem" }}>
                      {siteSettings.bic}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(siteSettings.bic!, "bic")}
                    style={{
                      flexShrink: 0,
                      background: copiedKey === "bic" ? "#E8F5E9" : "#FFFFFF",
                      color: copiedKey === "bic" ? "#2E7D32" : "#8C2836",
                      border: copiedKey === "bic" ? "1px solid #A5D6A7" : "1px solid #DACEC6",
                      borderRadius: "6px",
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copiedKey === "bic" ? `✓ ${labels.copied}` : labels.copy}
                  </button>
                </div>
              )}

              {siteSettings.giftNote && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "#6A5D60", fontStyle: "italic", borderLeft: "3px solid #ECC57B", paddingLeft: "0.75rem" }}>
                  {siteSettings.giftNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVOLUT TAB */}
        {currentTab === "revolut" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>⚡</span>
              <h4 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.15rem", margin: 0, color: "#2B2425" }}>
                Revolut Pay
              </h4>
            </div>
            <p style={{ margin: "0 0 1.25rem 0", color: "#776A6C", fontSize: "0.82rem" }}>
              {subs.revolut}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", background: "#FAF7F5", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #EFE8E1" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7D80", marginBottom: "0.15rem" }}>
                    Revtag / Username
                  </div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#8C2836", fontSize: "1.05rem" }}>
                    {siteSettings.revolutTag}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(siteSettings.revolutTag!, "revolut")}
                    style={{
                      background: copiedKey === "revolut" ? "#E8F5E9" : "#FFFFFF",
                      color: copiedKey === "revolut" ? "#2E7D32" : "#8C2836",
                      border: copiedKey === "revolut" ? "1px solid #A5D6A7" : "1px solid #DACEC6",
                      borderRadius: "6px",
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copiedKey === "revolut" ? `✓ ${labels.copied}` : labels.copy}
                  </button>
                  {revolutUrl && (
                    <a
                      href={revolutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        background: "#8C2836",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {labels.open} ↗
                    </a>
                  )}
                </div>
              </div>

              {siteSettings.revolutNote && (
                <div style={{ fontSize: "0.82rem", color: "#6A5D60", lineHeight: 1.5, background: "#FAF7F5", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  {siteSettings.revolutNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* WISE TAB */}
        {currentTab === "wise" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>🌐</span>
              <h4 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.15rem", margin: 0, color: "#2B2425" }}>
                Wise (TransferWise)
              </h4>
            </div>
            <p style={{ margin: "0 0 1.25rem 0", color: "#776A6C", fontSize: "0.82rem" }}>
              {subs.wise}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", background: "#FAF7F5", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #EFE8E1" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A7D80", marginBottom: "0.15rem" }}>
                    Wise Email / Tag
                  </div>
                  <div style={{ fontWeight: 600, color: "#8C2836", fontSize: "0.95rem" }}>
                    {siteSettings.wiseTag}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(siteSettings.wiseTag!, "wise")}
                    style={{
                      background: copiedKey === "wise" ? "#E8F5E9" : "#FFFFFF",
                      color: copiedKey === "wise" ? "#2E7D32" : "#8C2836",
                      border: copiedKey === "wise" ? "1px solid #A5D6A7" : "1px solid #DACEC6",
                      borderRadius: "6px",
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copiedKey === "wise" ? `✓ ${labels.copied}` : labels.copy}
                  </button>
                  {wiseUrl && (
                    <a
                      href={wiseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        background: "#55644E",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                        padding: "0.4rem 0.75rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      {labels.open} ↗
                    </a>
                  )}
                </div>
              </div>

              {siteSettings.wiseNote && (
                <div style={{ fontSize: "0.82rem", color: "#6A5D60", lineHeight: 1.5, background: "#FAF7F5", padding: "0.75rem 1rem", borderRadius: "8px" }}>
                  {siteSettings.wiseNote}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CASH / EN MANO TAB */}
        {currentTab === "cash" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "1.2rem" }}>✉️</span>
              <h4 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.15rem", margin: 0, color: "#2B2425" }}>
                {lang.cash}
              </h4>
            </div>
            <p style={{ margin: "0 0 1.25rem 0", color: "#776A6C", fontSize: "0.82rem" }}>
              {subs.cash}
            </p>

            <div
              style={{
                background: "linear-gradient(135deg, #FAF7F5 0%, #F5EFEB 100%)",
                border: "1px solid #E4DBD3",
                borderRadius: "10px",
                padding: "1.25rem",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#8C2836",
                  color: "#ECC57B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(140, 40, 54, 0.25)",
                }}
              >
                🏰
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#2B2425", fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                  Palacio de Hetzendorf (Wien)
                </div>
                <div style={{ fontSize: "0.85rem", color: "#544749", lineHeight: 1.6 }}>
                  {siteSettings.cashNote ||
                    "Dispondremos de un buzón imperial nupcial en el Palacio Hetzendorf durante el cóctel de bienvenida para quienes deseen entregar su sobre en mano con sus mejores deseos."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
