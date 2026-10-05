import type { Locale } from "@/lib/wedding-config";

interface TravelConciergeProps {
  locale?: Locale | string;
}

const conciergeI18n: Record<string, {
  eyebrow: string;
  title: string;
  subtitle: string;
  hotelTitle: string;
  hotelDesc: string;
  transitTitle: string;
  transitDesc: string;
  taxiTitle: string;
  bookNow: string;
  hotels: Array<{
    name: string;
    distance: string;
    stars: string;
    description: string;
    url: string;
  }>;
  transitTips: Array<{
    icon: string;
    line: string;
    details: string;
  }>;
}> = {
  en: {
    eyebrow: "VIENNA HOSPITALITY & TRAVEL",
    title: "Travel & Hotel Concierge",
    subtitle: "Curated accommodations and seamless transit options for your stay in Vienna near Schloss Hetzendorf and Schönbrunn.",
    hotelTitle: "Recommended Accommodations",
    hotelDesc: "Selected hotels within quick reach of both the ceremony and the evening palace reception.",
    transitTitle: "Getting Around Vienna",
    transitDesc: "Vienna has one of the world's most punctual public transit systems. Single tickets or 24h/48h passes are available at all stations.",
    taxiTitle: "Recommended Taxi Hotlines",
    bookNow: "Check Availability →",
    hotels: [
      {
        name: "Austria Trend Parkhotel Schönbrunn",
        distance: "2.4 km from Hetzendorf (10 min by car / 15 min by Tram)",
        stars: "★★★★",
        description: "Former emperor's guest house adjacent to Schönbrunn Palace gardens. Historic Viennese luxury and exquisite breakfast.",
        url: "https://www.austria-trend.at/en/hotels/parkhotel-schoenbrunn",
      },
      {
        name: "HB1 Hotel Wien Schönbrunn",
        distance: "3.1 km from Hetzendorf (Direct access to Meidling)",
        stars: "★★★",
        description: "Modern, boutique hotel with rooftop terrace views of Schönbrunn, affordable rates, and direct transit access.",
        url: "https://www.booking.com/hotel/at/hb1-wien-schonbrunn.html",
      },
      {
        name: "Hotel Altmannsdorf & Hetzendorf Boutique Stays",
        distance: "Walking distance (400m - 1.2 km from Church & Palace)",
        stars: "★★★",
        description: "Charming traditional Austrian inns and boutique apartments situated directly in the quiet residential 12th district.",
        url: "https://www.booking.com/searchresults.html?ss=Hetzendorf%2C+Vienna",
      },
    ],
    transitTips: [
      {
        icon: "🚋",
        line: "Bim 62 (Vienna Tramway)",
        details: "Stops directly at 'Schloss Hetzendorf' (station in front of the palace gates) connecting to Meidling and the city center.",
      },
      {
        icon: "🚆",
        line: "S-Bahn Trains S1, S2, S3, S4",
        details: "Station 'Wien Hetzendorf' is just a 5-minute walk (450m) from both the church and palace entrance.",
      },
      {
        icon: "✈️",
        line: "Vienna Airport (VIE) & CAT",
        details: "Take the S7 or City Airport Train (CAT) to Wien Mitte, then transfer to S-Bahn directly to Wien Hetzendorf (35 min total).",
      },
    ],
  },
  es: {
    eyebrow: "HOSPITALIDAD Y VIAJE A VIENA",
    title: "Guía de Viaje y Hoteles Recomendados",
    subtitle: "Alojamientos seleccionados y opciones de transporte para que disfrutes de tu estadía en Viena cerca del Palacio Hetzendorf.",
    hotelTitle: "Hoteles Recomendados",
    hotelDesc: "Opciones cómodas y cercanas tanto a la ceremonia como a la recepción de la noche.",
    transitTitle: "Cómo Moverte en Viena",
    transitDesc: "El transporte público de Viena es moderno, seguro y puntual. Puedes comprar pases de 24h o 48h en cualquier estación o en la app WienMobil.",
    taxiTitle: "Líneas de Taxi Oficiales",
    bookNow: "Ver Disponibilidad →",
    hotels: [
      {
        name: "Austria Trend Parkhotel Schönbrunn",
        distance: "A 2.4 km de Hetzendorf (10 min en coche / 15 min en tranvía)",
        stars: "★★★★",
        description: "Antigua casa de huéspedes del emperador junto a los jardines de Schönbrunn. Estilo clásico vienés y máxima comodidad.",
        url: "https://www.austria-trend.at/en/hotels/parkhotel-schoenbrunn",
      },
      {
        name: "HB1 Hotel Wien Schönbrunn",
        distance: "A 3.1 km de Hetzendorf (Conexión rápida con Meidling)",
        stars: "★★★",
        description: "Hotel moderno con terraza panorámica, tarifas accesibles y excelente conectividad de tranvía y metro.",
        url: "https://www.booking.com/hotel/at/hb1-wien-schonbrunn.html",
      },
      {
        name: "Apartamentos y Boutiques en Meidling / Hetzendorf",
        distance: "Distancia a pie (400m - 1.2 km de la iglesia y el palacio)",
        stars: "★★★",
        description: "Apartamentos acogedores y residenciales en el distrito 12, ideales para familias y grupos de invitados.",
        url: "https://www.booking.com/searchresults.html?ss=Hetzendorf%2C+Vienna",
      },
    ],
    transitTips: [
      {
        icon: "🚋",
        line: "Tranvía Bim 62",
        details: "Parada directa en 'Schloss Hetzendorf' (frente a las puertas del palacio) conectando con la estación Meidling y el centro.",
      },
      {
        icon: "🚆",
        line: "Trenes S-Bahn S1, S2, S3, S4",
        details: "La estación 'Wien Hetzendorf' está a solo 5 minutos a pie de la iglesia y del palacio.",
      },
      {
        icon: "✈️",
        line: "Aeropuerto de Viena (VIE)",
        details: "Tren S7 o City Airport Train (CAT) hasta Wien Mitte, luego transbordo directo a la S-Bahn hasta Hetzendorf (35 min total).",
      },
    ],
  },
  "de-AT": {
    eyebrow: "WIENER GASTFREUNDSCHAFT & REISE",
    title: "Reise & Hotel-Concierge",
    subtitle: "Ausgewählte Unterkünfte und bequeme Anreisemöglichkeiten rund um Schloss Hetzendorf und Schönbrunn in Wien.",
    hotelTitle: "Empfohlene Hotels",
    hotelDesc: "Ausgewählte Hotels in unmittelbarer Nähe von Kirche und festlichem Hochzeitsempfang.",
    transitTitle: "Öffentlicher Nahverkehr in Wien",
    transitDesc: "Wien verfügt über ein weltberühmtes, pünktliches Nahverkehrsnetz. 24h- oder 48h-Tickets sind an allen Automaten oder in der WienMobil App erhältlich.",
    taxiTitle: "Offizielle Taxi-Hotlines",
    bookNow: "Verfügbarkeit prüfen →",
    hotels: [
      {
        name: "Austria Trend Parkhotel Schönbrunn",
        distance: "2,4 km von Hetzendorf (10 min mit dem Auto / 15 min mit der Bim)",
        stars: "★★★★",
        description: "Ehemaliges Gästehaus des Kaisers direkt beim Schlossgarten Schönbrunn. Historischer Wiener Charme und erstklassiger Komfort.",
        url: "https://www.austria-trend.at/de/hotels/parkhotel-schoenbrunn",
      },
      {
        name: "HB1 Hotel Wien Schönbrunn",
        distance: "3,1 km von Hetzendorf (Schnelle Anbindung nach Meidling)",
        stars: "★★★",
        description: "Modernes Hotel mit Dachterrasse, tollem Blick auf Schönbrunn und sehr gutem Preis-Leistungs-Verhältnis.",
        url: "https://www.booking.com/hotel/at/hb1-wien-schonbrunn.de.html",
      },
      {
        name: "Traditionelle Hotels & Apartments in Hetzendorf",
        distance: "Gehabstand (400 m – 1,2 km von Kirche und Schloss)",
        stars: "★★★",
        description: "Gemütliche Wiener Pensionen und moderne Ferienwohnungen im ruhigen 12. Wiener Gemeindebezirk.",
        url: "https://www.booking.com/searchresults.html?ss=Hetzendorf%2C+Vienna",
      },
    ],
    transitTips: [
      {
        icon: "🚋",
        line: "Straßenbahn Bim 62",
        details: "Hält direkt vor den Schlosstoren an der Station 'Schloss Hetzendorf' (Direktverbindung vom Bahnhof Meidling und Karlsplatz).",
      },
      {
        icon: "🚆",
        line: "S-Bahn Linien S1, S2, S3, S4",
        details: "Der Bahnhof 'Wien Hetzendorf' ist nur 5 Gehminuten von der Pfarrkirche und dem Schloss entfernt.",
      },
      {
        icon: "✈️",
        line: "Flughafen Wien-Schwechat (VIE)",
        details: "S-Bahn S7 oder City Airport Train (CAT) bis Wien Mitte, dann mit der S-Bahn direkt nach Hetzendorf (ca. 35 Minuten).",
      },
    ],
  },
  hu: {
    eyebrow: "BÉCSI VENDÉGLÁTÁS ÉS UTAZÁS",
    title: "Utazási és Szállás Kalauz",
    subtitle: "Válogatott szálláshelyek és kényelmes utazási lehetőségek a Hetzendorf-kastély és Schönbrunn közelében.",
    hotelTitle: "Ajánlott Szállodák",
    hotelDesc: "Kényelmes szálláslehetőségek a szertartás és a kastélyi vacsora közelében.",
    transitTitle: "Közlekedés Bécsben",
    transitDesc: "Bécs tömegközlekedése híresen pontos és kényelmes. 24 vagy 48 órás jegyek minden állomáson és a WienMobil applikációban megvásárolhatók.",
    taxiTitle: "Hivatalos Taxi Vonalak",
    bookNow: "Szabad helyek megtekintése →",
    hotels: [
      {
        name: "Austria Trend Parkhotel Schönbrunn",
        distance: "2,4 km Hetzendorftól (10 perc autóval / 15 perc villamossal)",
        stars: "★★★★",
        description: "Egykori császári vendégház a Schönbrunni kastélykert mellett. Történelmi bécsi elegancia és pazar kényelem.",
        url: "https://www.austria-trend.at/en/hotels/parkhotel-schoenbrunn",
      },
      {
        name: "HB1 Hotel Wien Schönbrunn",
        distance: "3,1 km Hetzendorftól (Gyors kapcsolat Meidling felé)",
        stars: "★★★",
        description: "Modern szálloda tetőterasszal, gyönyörű kilátással és kiváló ár-érték aránnyal.",
        url: "https://www.booking.com/hotel/at/hb1-wien-schonbrunn.html",
      },
      {
        name: "Apartmanok és Panziók Hetzendorfban",
        distance: "Sétatávolság (400 m – 1,2 km a templomtól és a kastélytól)",
        stars: "★★★",
        description: "Családias apartmanok a 12. kerület zöldövezetében, közel minden eseményhez.",
        url: "https://www.booking.com/searchresults.html?ss=Hetzendorf%2C+Vienna",
      },
    ],
    transitTips: [
      {
        icon: "🚋",
        line: "62-es Villamos (Bim)",
        details: "Közvetlenül a kastély bejárata előtt áll meg a 'Schloss Hetzendorf' megállóban.",
      },
      {
        icon: "🚆",
        line: "S-Bahn vonatok (S1, S2, S3, S4)",
        details: "A 'Wien Hetzendorf' vasútállomás mindössze 5 perc kényelmes séta a templomtól és a kastélytól.",
      },
      {
        icon: "✈️",
        line: "Bécsi Nemzetközi Repülőtér (VIE)",
        details: "S7 vonat vagy CAT Wien Mitte állomásig, majd átszállás a Hetzendorfi S-Bahnra (kb. 35 perc).",
      },
    ],
  },
};

export function TravelConcierge({ locale = "en" }: TravelConciergeProps) {
  const langKey = locale.startsWith("de") ? "de-AT" : locale.startsWith("es") ? "es" : locale.startsWith("hu") ? "hu" : "en";
  const texts = conciergeI18n[langKey] || conciergeI18n.en;

  return (
    <section className="travel-concierge" style={{ margin: "4rem auto", maxWidth: "1000px", padding: "0 1.25rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "2.5px", color: "#8C2836", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          {texts.eyebrow}
        </div>
        <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.2rem", color: "#2B2425", margin: "0 0 0.75rem 0", fontWeight: "normal" }}>
          {texts.title}
        </h2>
        <p style={{ color: "#6A5D60", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
          {texts.subtitle}
        </p>
      </div>

      {/* Hotel Recommendations Grid */}
      <div style={{ marginBottom: "3rem" }}>
        <h3 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", color: "#8C2836", marginBottom: "0.4rem" }}>
          🏨 {texts.hotelTitle}
        </h3>
        <p style={{ color: "#6A5D60", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
          {texts.hotelDesc}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {texts.hotels.map((hotel) => (
            <div
              key={hotel.name}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E6DED8",
                borderRadius: "12px",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#CCA468", fontSize: "0.9rem", letterSpacing: "2px" }}>{hotel.stars}</span>
                  <span style={{ fontSize: "0.75rem", color: "#8C2836", background: "rgba(140, 40, 54, 0.08)", padding: "0.2rem 0.5rem", borderRadius: "999px", fontWeight: 600 }}>
                    Hetzendorf Area
                  </span>
                </div>
                <h4 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.15rem", margin: "0 0 0.5rem 0", color: "#2B2425" }}>
                  {hotel.name}
                </h4>
                <div style={{ fontSize: "0.8rem", color: "#8C2836", fontWeight: 600, marginBottom: "0.75rem" }}>
                  📍 {hotel.distance}
                </div>
                <p style={{ fontSize: "0.85rem", color: "#5F5254", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
                  {hotel.description}
                </p>
              </div>

              <a
                href={hotel.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  textAlign: "center",
                  background: "#FAF7F5",
                  border: "1px solid #CCA468",
                  color: "#8C2836",
                  borderRadius: "6px",
                  padding: "0.6rem 1rem",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                {texts.bookNow}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Transit & Airport Guide */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E6DED8", borderRadius: "12px", padding: "1.75rem", marginBottom: "2rem" }}>
        <h3 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", color: "#8C2836", margin: "0 0 0.4rem 0" }}>
          🚆 {texts.transitTitle}
        </h3>
        <p style={{ color: "#6A5D60", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
          {texts.transitDesc}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          {texts.transitTips.map((tip) => (
            <div
              key={tip.line}
              style={{
                background: "#FAF7F5",
                borderRadius: "8px",
                border: "1px solid #EFE8E2",
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.25rem" }}>{tip.icon}</span>
                <strong style={{ fontSize: "0.9rem", color: "#2B2425" }}>{tip.line}</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#5A4E50", lineHeight: 1.45 }}>
                {tip.details}
              </p>
            </div>
          ))}
        </div>

        {/* Taxi hotlines */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px dashed #E2D8CF", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#5A4E50" }}>
            🚖 <strong>{texts.taxiTitle}:</strong> Taxi 40100 (<a href="tel:+43140100" style={{ color: "#8C2836", textDecoration: "none", fontWeight: 600 }}>+43 1 40100</a>) · Taxi 31300 (<a href="tel:+43131300" style={{ color: "#8C2836", textDecoration: "none", fontWeight: 600 }}>+43 1 31300</a>) · Uber &amp; Bolt active throughout Vienna.
          </div>
        </div>
      </div>
    </section>
  );
}
