"use client";

import { useState } from "react";
import { weddingConfig, type Locale } from "@/lib/wedding-config";

interface AddToCalendarProps {
  locale?: Locale | string;
  variant?: "pill" | "button" | "card";
}

const calendarI18n: Record<string, {
  button: string;
  google: string;
  apple: string;
  outlook: string;
  downloadIcs: string;
  title: string;
  description: string;
}> = {
  en: {
    button: "Add to Calendar",
    google: "Google Calendar",
    apple: "Apple Calendar (.ics)",
    outlook: "Outlook Calendar",
    downloadIcs: "Download .ics Calendar Event",
    title: "Ruben & Andrea — Wedding Celebration",
    description: "Wedding Ceremony at Kath. Kirche St. Oswald (14:30) followed by Evening Banquet & Reception at Hetzendorf Palace (Schloss Hetzendorf), Vienna.",
  },
  es: {
    button: "Añadir al Calendario",
    google: "Google Calendar",
    apple: "Apple Calendar (.ics)",
    outlook: "Outlook Calendar",
    downloadIcs: "Descargar Evento .ics",
    title: "Boda de Ruben y Andrea",
    description: "Ceremonia en Kath. Kirche St. Oswald (14:30) seguida de Recepción y Banquete en el Palacio Hetzendorf (Schloss Hetzendorf), Viena.",
  },
  "de-AT": {
    button: "Zum Kalender hinzufügen",
    google: "Google Kalender",
    apple: "Apple Kalender (.ics)",
    outlook: "Outlook Kalender",
    downloadIcs: ".ics Kalenderdatei herunterladen",
    title: "Hochzeit von Ruben & Andrea",
    description: "Kirchliche Trauung in der Kath. Kirche St. Oswald (14:30) mit anschließendem Festempfang & Dinner im Schloss Hetzendorf, Wien.",
  },
  hu: {
    button: "Naptárhoz adás",
    google: "Google Naptár",
    apple: "Apple Naptár (.ics)",
    outlook: "Outlook Naptár",
    downloadIcs: ".ics naptári esemény letöltése",
    title: "Ruben és Andrea esküvője",
    description: "Esküvői szertartás a Kath. Kirche St. Oswald templomban (14:30), majd fogadás és vacsora a Hetzendorf-kastélyban, Bécsben.",
  },
};

export function AddToCalendar({ locale = "en", variant = "pill" }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const langKey = locale.startsWith("de") ? "de-AT" : locale.startsWith("es") ? "es" : locale.startsWith("hu") ? "hu" : "en";
  const texts = calendarI18n[langKey] || calendarI18n.en;

  // Wedding event times (Vienna Timezone: Europe/Vienna)
  // Saturday, Oct 2, 2027: 14:30 to 02:00 next morning (UTC: 20271002T123000Z to 20271003T000000Z - CEST is UTC+2)
  const startUtc = "20271002T123000Z";
  const endUtc = "20271003T010000Z";
  const location = `${weddingConfig.ceremony.name}, ${weddingConfig.ceremony.address} & ${weddingConfig.reception.name}, ${weddingConfig.reception.address}`;

  // Google Calendar URL
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", texts.title);
  googleUrl.searchParams.set("dates", `${startUtc}/${endUtc}`);
  googleUrl.searchParams.set("details", texts.description);
  googleUrl.searchParams.set("location", location);

  function handleDownloadIcs() {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Ruben and Andrea//Wedding Website//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:wedding-ruben-andrea-2027@rubenandrea.com`,
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
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: variant === "pill" ? "rgba(204, 164, 104, 0.12)" : "#FFFFFF",
          color: "#8C2836",
          border: "1px solid #CCA468",
          borderRadius: variant === "pill" ? "999px" : "8px",
          padding: "0.5rem 1.15rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "0.2px",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(140, 40, 54, 0.06)",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: "1rem" }}>📅</span>
        <span>{texts.button}</span>
        <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 100,
            background: "#FFFFFF",
            border: "1px solid #E4DBD3",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            padding: "0.5rem",
            minWidth: "220px",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <a
            href={googleUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 0.85rem",
              borderRadius: "6px",
              color: "#2B2425",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span style={{ fontSize: "1rem" }}>🌐</span>
            <span>{texts.google}</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadIcs}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 0.85rem",
              borderRadius: "6px",
              color: "#2B2425",
              background: "transparent",
              border: 0,
              fontSize: "0.85rem",
              fontWeight: 500,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.15s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span style={{ fontSize: "1rem" }}>🍎</span>
            <span>{texts.apple}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 0.85rem",
              borderRadius: "6px",
              color: "#2B2425",
              background: "transparent",
              border: 0,
              fontSize: "0.85rem",
              fontWeight: 500,
              textAlign: "left",
              cursor: "pointer",
              transition: "background 0.15s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF7F5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span style={{ fontSize: "1rem" }}>📥</span>
            <span>{texts.downloadIcs}</span>
          </button>
        </div>
      )}
    </div>
  );
}
