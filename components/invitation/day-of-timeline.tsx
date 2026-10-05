"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/wedding-config";

interface DayOfTimelineProps {
  locale?: Locale | string;
  forceActive?: boolean;
}

interface TimelineEvent {
  id: string;
  timeStr: string;
  startMinutes: number; // minutes from midnight Vienna time
  endMinutes: number;
  titleKey: string;
  locationKey: string;
}

const events: TimelineEvent[] = [
  {
    id: "arrival",
    timeStr: "14:30",
    startMinutes: 14 * 60 + 30, // 14:30
    endMinutes: 15 * 60,
    titleKey: "arrival",
    locationKey: "church",
  },
  {
    id: "ceremony",
    timeStr: "15:00",
    startMinutes: 15 * 60,
    endMinutes: 16 * 60 + 15,
    titleKey: "ceremony",
    locationKey: "church",
  },
  {
    id: "cocktails",
    timeStr: "16:30",
    startMinutes: 16 * 60 + 30,
    endMinutes: 18 * 60 + 30,
    titleKey: "cocktails",
    locationKey: "palace",
  },
  {
    id: "dinner",
    timeStr: "18:30",
    startMinutes: 18 * 60 + 30,
    endMinutes: 21 * 60,
    titleKey: "dinner",
    locationKey: "palace",
  },
  {
    id: "party",
    timeStr: "21:00",
    startMinutes: 21 * 60,
    endMinutes: 26 * 60, // 02:00 next day
    titleKey: "party",
    locationKey: "palace",
  },
];

const dayI18n: Record<string, {
  liveBadge: string;
  happeningNow: string;
  upNext: string;
  churchName: string;
  palaceName: string;
  titles: Record<string, string>;
  subtitle: string;
}> = {
  en: {
    liveBadge: "LIVE WEDDING DAY TIMELINE",
    happeningNow: "HAPPENING NOW",
    upNext: "UP NEXT",
    churchName: "Kath. Kirche St. Oswald (Vienna 12)",
    palaceName: "Hetzendorf Palace Gardens & Banquet Hall",
    subtitle: "Follow along in real-time on October 2, 2027 in Vienna.",
    titles: {
      arrival: "Guest Arrival & Welcome Music",
      ceremony: "Holy Matrimony & Nuptial Mass",
      cocktails: "Champagne Reception & Palace Garden Cocktails",
      dinner: "Festive Wedding Banquet & Speeches",
      party: "Wedding Cake, First Dance & Royal Party",
    },
  },
  es: {
    liveBadge: "CRONOGRAMA EN VIVO DEL DÍA DE LA BODA",
    happeningNow: "EN ESTE MOMENTO",
    upNext: "A CONTINUACIÓN",
    churchName: "Kath. Kirche St. Oswald (Viena 12)",
    palaceName: "Jardines y Salones del Palacio Hetzendorf",
    subtitle: "Sigue el itinerario en tiempo real el 2 de octubre de 2027 en Viena.",
    titles: {
      arrival: "Llegada de Invitados y Música de Bienvenida",
      ceremony: "Misa Solemne y Matrimonio Religioso",
      cocktails: "Cóctel de Bienvenida en los Jardines del Palacio",
      dinner: "Banquete Nupcial y Brindis",
      party: "Corte de Tarta, Primer Baile y Fiesta Real",
    },
  },
  "de-AT": {
    liveBadge: "LIVE HOCHZEITS-ZEITPLAN",
    happeningNow: "JETZT GERADE",
    upNext: "NÄCHSTER PROGRAMMPUNKT",
    churchName: "Kath. Kirche St. Oswald (Wien 12)",
    palaceName: "Schlossgarten & Prunksäle Schloss Hetzendorf",
    subtitle: "Das tagesaktuelle Hochzeitsprogramm in Echtzeit am 2. Oktober 2027 in Wien.",
    titles: {
      arrival: "Eintreffen der Hochzeitsgäste & Orgelklänge",
      ceremony: "Feierliche Kirchliche Trauung",
      cocktails: "Sektempfang & Cocktails im Schlossgarten",
      dinner: "Festliches Hochzeitsdinner & Reden",
      party: "Hochzeitstorte, Eröffnungstanz & Palast-Party",
    },
  },
  hu: {
    liveBadge: "ÉLŐ ESKÜVŐI PROGRAMTERV",
    happeningNow: "ÉPPEN MOST",
    upNext: "KÖVETKEZŐ PROGRAM",
    churchName: "Kath. Kirche St. Oswald (Bécs 12)",
    palaceName: "Hetzendorf Kastélykert és Dísztermek",
    subtitle: "Kövesd az esküvő menetét valós időben 2027. október 2-án Bécsben.",
    titles: {
      arrival: "Vendégek érkezése és fogadása",
      ceremony: "Ünnepélyes templomi esküvő",
      cocktails: "Pezsgős fogadás a kastélykertben",
      dinner: "Ünnepi esküvői vacsora és köszöntők",
      party: "Esküvői torta, nyitótánc és hajnalig tartó mulatság",
    },
  },
};

export function DayOfTimeline({ locale = "en", forceActive = false }: DayOfTimelineProps) {
  const [currentStatus, setCurrentStatus] = useState<{
    activeId: string | null;
    nextId: string | null;
  }>({ activeId: null, nextId: null });

  const langKey = locale.startsWith("de") ? "de-AT" : locale.startsWith("es") ? "es" : locale.startsWith("hu") ? "hu" : "en";
  const texts = dayI18n[langKey] || dayI18n.en;

  useEffect(() => {
    function computeStatus() {
      if (forceActive) {
        // In preview/simulation mode, simulate church ceremony in progress
        setCurrentStatus({ activeId: "ceremony", nextId: "cocktails" });
        return;
      }

      const now = new Date();
      // Check if current date is Oct 2, 2027
      const isWeddingDay =
        now.getFullYear() === 2027 &&
        now.getMonth() === 9 && // October is 9 (0-indexed)
        now.getDate() === 2;

      if (!isWeddingDay) {
        setCurrentStatus({ activeId: null, nextId: "arrival" });
        return;
      }

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      let active: string | null = null;
      let next: string | null = null;

      for (const ev of events) {
        if (currentMinutes >= ev.startMinutes && currentMinutes < ev.endMinutes) {
          active = ev.id;
        } else if (currentMinutes < ev.startMinutes && !next) {
          next = ev.id;
        }
      }

      setCurrentStatus({ activeId: active, nextId: next });
    }

    computeStatus();
    const interval = setInterval(computeStatus, 60_000);
    return () => clearInterval(interval);
  }, [forceActive]);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FAF7F5 0%, #F5EFEB 100%)",
        border: "1px solid #E6DED8",
        borderRadius: "14px",
        padding: "1.75rem",
        margin: "2.5rem 0",
        boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: "#8C2836", boxShadow: "0 0 0 3px rgba(140, 40, 54, 0.2)" }} />
          <span style={{ fontSize: "0.75rem", letterSpacing: "2px", fontWeight: 700, color: "#8C2836", textTransform: "uppercase" }}>
            {texts.liveBadge}
          </span>
        </div>
        <span style={{ fontSize: "0.8rem", color: "#776A6C", fontStyle: "italic" }}>
          Vienna Time (CEST)
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {events.map((ev) => {
          const isActive = currentStatus.activeId === ev.id;
          const isNext = currentStatus.nextId === ev.id && !currentStatus.activeId;

          return (
            <div
              key={ev.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.25rem",
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                background: isActive ? "#FFFFFF" : isNext ? "rgba(255, 255, 255, 0.7)" : "transparent",
                border: isActive ? "2px solid #8C2836" : isNext ? "1px solid #CCA468" : "1px solid transparent",
                boxShadow: isActive ? "0 4px 15px rgba(140, 40, 54, 0.08)" : "none",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{ minWidth: "65px", textAlign: "center" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "1.15rem", fontWeight: 700, color: isActive ? "#8C2836" : "#44383A" }}>
                  {ev.timeStr}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <h4 style={{ margin: 0, fontSize: "0.98rem", color: "#2B2425", fontWeight: 600 }}>
                    {texts.titles[ev.id]}
                  </h4>

                  {isActive && (
                    <span
                      style={{
                        background: "#8C2836",
                        color: "#FFFFFF",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                      }}
                    >
                      ● {texts.happeningNow}
                    </span>
                  )}

                  {isNext && (
                    <span
                      style={{
                        background: "#CCA468",
                        color: "#FFFFFF",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "1px",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                      }}
                    >
                      {texts.upNext}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "0.82rem", color: "#6A5D60" }}>
                  📍 {ev.locationKey === "church" ? texts.churchName : texts.palaceName}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
