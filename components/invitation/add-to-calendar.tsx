"use client";

import { useEffect, useRef, useState } from "react";
import { weddingConfig, type Locale } from "@/lib/wedding-config";

interface AddToCalendarProps {
  locale?: Locale | string;
  variant?: "pill" | "button" | "card";
}

const calendarI18n: Record<string, {
  button: string;
  headerDate: string;
  google: string;
  googleDesc: string;
  apple: string;
  appleDesc: string;
  outlook: string;
  outlookDesc: string;
  downloadIcs: string;
  downloadIcsDesc: string;
  title: string;
  description: string;
}> = {
  en: {
    button: "Add to Calendar",
    headerDate: "OCTOBER 2, 2027 · VIENNA (CEST)",
    google: "Google Calendar",
    googleDesc: "Web & Android",
    apple: "Apple Calendar",
    appleDesc: "iPhone, iPad & Mac (.ics)",
    outlook: "Outlook Calendar",
    outlookDesc: "Outlook.com & Office 365",
    downloadIcs: "Download .ics File",
    downloadIcsDesc: "Universal calendar format",
    title: "Ruben & Andrea — Wedding Celebration",
    description: "Wedding Ceremony at Kath. Kirche St. Oswald (14:30) followed by Evening Banquet & Reception at Hetzendorf Palace (Schloss Hetzendorf), Vienna.",
  },
  es: {
    button: "Añadir al Calendario",
    headerDate: "2 DE OCTUBRE DE 2027 · VIENA (CEST)",
    google: "Google Calendar",
    googleDesc: "Web y Android",
    apple: "Apple Calendar",
    appleDesc: "iPhone, iPad y Mac (.ics)",
    outlook: "Outlook Calendar",
    outlookDesc: "Outlook.com y Office 365",
    downloadIcs: "Descargar Evento .ics",
    downloadIcsDesc: "Formato universal",
    title: "Boda de Ruben y Andrea",
    description: "Ceremonia en Kath. Kirche St. Oswald (14:30) seguida de Recepción y Banquete en el Palacio Hetzendorf (Schloss Hetzendorf), Viena.",
  },
  "de-AT": {
    button: "Zum Kalender hinzufügen",
    headerDate: "2. OKTOBER 2027 · WIEN (MESZ)",
    google: "Google Kalender",
    googleDesc: "Web & Android",
    apple: "Apple Kalender",
    appleDesc: "iPhone, iPad & Mac (.ics)",
    outlook: "Outlook Kalender",
    outlookDesc: "Outlook.com & Office 365",
    downloadIcs: ".ics Kalenderdatei",
    downloadIcsDesc: "Universelles Format",
    title: "Hochzeit von Ruben & Andrea",
    description: "Kirchliche Trauung in der Kath. Kirche St. Oswald (14:30) mit anschließendem Festempfang & Dinner im Schloss Hetzendorf, Wien.",
  },
  hu: {
    button: "Naptárhoz adás",
    headerDate: "2027. OKTÓBER 2. · BÉCS (CEST)",
    google: "Google Naptár",
    googleDesc: "Web & Android",
    apple: "Apple Naptár",
    appleDesc: "iPhone, iPad & Mac (.ics)",
    outlook: "Outlook Naptár",
    outlookDesc: "Outlook.com & Office 365",
    downloadIcs: ".ics naptári fájl",
    downloadIcsDesc: "Univerzális naptárformátum",
    title: "Ruben és Andrea esküvője",
    description: "Esküvői szertartás a Kath. Kirche St. Oswald templomban (14:30), majd fogadás és vacsora a Hetzendorf-kastélyban, Bécsben.",
  },
};

export function AddToCalendar({ locale = "en" }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const langKey = locale.startsWith("de") ? "de-AT" : locale.startsWith("es") ? "es" : locale.startsWith("hu") ? "hu" : "en";
  const texts = calendarI18n[langKey] || calendarI18n.en;

  // Saturday, Oct 2, 2027: 14:30 CEST to 02:00 CEST next morning (UTC: 20271002T123000Z to 20271003T000000Z)
  const startUtc = "20271002T123000Z";
  const endUtc = "20271003T000000Z";
  const location = `${weddingConfig.ceremony.name}, ${weddingConfig.ceremony.address} & ${weddingConfig.reception.name}, ${weddingConfig.reception.address}`;

  // Google Calendar URL
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", texts.title);
  googleUrl.searchParams.set("dates", `${startUtc}/${endUtc}`);
  googleUrl.searchParams.set("details", texts.description);
  googleUrl.searchParams.set("location", location);

  // Outlook Web URL
  const outlookUrl = new URL("https://outlook.live.com/calendar/0/deeplink/compose");
  outlookUrl.searchParams.set("path", "/calendar/action/compose");
  outlookUrl.searchParams.set("rru", "addevent");
  outlookUrl.searchParams.set("startdt", "2027-10-02T12:30:00Z");
  outlookUrl.searchParams.set("enddt", "2027-10-03T00:00:00Z");
  outlookUrl.searchParams.set("subject", texts.title);
  outlookUrl.searchParams.set("body", texts.description);
  outlookUrl.searchParams.set("location", location);

  // Close on outside click and Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleDownloadIcs() {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ruben and Andrea//Wedding Celebration Vienna//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:wedding-ruben-andrea-2027@rubenandrea.com",
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${startUtc}`,
      `DTEND:${endUtc}`,
      `SUMMARY:${texts.title}`,
      `DESCRIPTION:${texts.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${location.replace(/,/g, "\\,")}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Ruben & Andrea Wedding tomorrow in Vienna!",
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Wedding ceremony begins soon at Kath. Kirche St. Oswald!",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Ruben-and-Andrea-Wedding-Vienna.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="calendar-sync-widget"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.65rem",
          background: isOpen ? "#8C2836" : "linear-gradient(135deg, #FFFFFF 0%, #FAF7F5 100%)",
          color: isOpen ? "#FFFFFF" : "#8C2836",
          border: "1.5px solid #CCA468",
          borderRadius: "999px",
          padding: "0.65rem 1.35rem",
          fontSize: "0.88rem",
          fontWeight: 600,
          fontFamily: "var(--font-body, inherit)",
          letterSpacing: "0.03em",
          cursor: "pointer",
          transition: "all 0.22s cubic-bezier(0.2, 0.7, 0.2, 1)",
          boxShadow: isOpen
            ? "0 4px 16px rgba(140, 40, 54, 0.25)"
            : "0 2px 10px rgba(140, 40, 54, 0.08)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "#8C2836";
            e.currentTarget.style.color = "#FFFFFF";
            e.currentTarget.style.borderColor = "#8C2836";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 18px rgba(140, 40, 54, 0.22)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = "linear-gradient(135deg, #FFFFFF 0%, #FAF7F5 100%)";
            e.currentTarget.style.color = "#8C2836";
            e.currentTarget.style.borderColor = "#CCA468";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(140, 40, 54, 0.08)";
          }
        }}
      >
        {/* Imperial Calendar SVG Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        <span>{texts.button}</span>

        {/* Dynamic Chevron Icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transition: "transform 0.22s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            opacity: 0.85,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            zIndex: 120,
            background: "#FFFFFF",
            border: "1px solid rgba(204, 164, 104, 0.4)",
            borderRadius: "14px",
            boxShadow: "0 14px 38px rgba(46, 36, 38, 0.16), 0 2px 8px rgba(204, 164, 104, 0.15)",
            padding: "0.65rem",
            minWidth: "275px",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            animation: "fadeIn 0.18s ease-out",
          }}
        >
          {/* Header label */}
          <div
            style={{
              padding: "0.4rem 0.75rem 0.5rem",
              borderBottom: "1px solid rgba(204, 164, 104, 0.2)",
              marginBottom: "0.3rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                fontWeight: 700,
                color: "#8C2836",
                textTransform: "uppercase",
              }}
            >
              {texts.headerDate}
            </p>
          </div>

          {/* Option 1: Google Calendar */}
          <a
            href={googleUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              color: "#2B2425",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(204, 164, 104, 0.1)";
              e.currentTarget.style.color = "#8C2836";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#2B2425";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(140, 40, 54, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#8C2836",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{texts.google}</span>
              <span style={{ fontSize: "0.72rem", color: "#7A6D70" }}>{texts.googleDesc}</span>
            </div>
          </a>

          {/* Option 2: Apple Calendar */}
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadIcs}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              color: "#2B2425",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(204, 164, 104, 0.1)";
              e.currentTarget.style.color = "#8C2836";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#2B2425";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(140, 40, 54, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#8C2836",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.92.04-2.02.62-2.67 1.37-.58.66-1.09 1.73-.95 2.76 1.03.08 2.07-.53 2.7-1.28z"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{texts.apple}</span>
              <span style={{ fontSize: "0.72rem", color: "#7A6D70" }}>{texts.appleDesc}</span>
            </div>
          </button>

          {/* Option 3: Outlook Calendar */}
          <a
            href={outlookUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              color: "#2B2425",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(204, 164, 104, 0.1)";
              e.currentTarget.style.color = "#8C2836";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#2B2425";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(140, 40, 54, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#8C2836",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <circle cx="12" cy="15" r="2"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{texts.outlook}</span>
              <span style={{ fontSize: "0.72rem", color: "#7A6D70" }}>{texts.outlookDesc}</span>
            </div>
          </a>

          {/* Option 4: Universal .ics Download */}
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadIcs}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              color: "#2B2425",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(204, 164, 104, 0.1)";
              e.currentTarget.style.color = "#8C2836";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#2B2425";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "rgba(140, 40, 54, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#8C2836",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{texts.downloadIcs}</span>
              <span style={{ fontSize: "0.72rem", color: "#7A6D70" }}>{texts.downloadIcsDesc}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
