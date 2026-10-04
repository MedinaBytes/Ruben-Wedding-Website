import { getTranslations } from "next-intl/server";

import { Countdown } from "@/components/invitation/countdown";
import { RsvpForm } from "@/components/invitation/guest-forms";
import { InteractiveMap } from "@/components/invitation/interactive-map";
import { PhotoStory } from "@/components/invitation/photo-story";
import { SpotifyPlaylist } from "@/components/invitation/spotify-playlist";
import { SpotifySongRequests } from "@/components/invitation/spotify-song-requests";
import { TrackedMapLink } from "@/components/invitation/tracked-map-link";
import { getSpotifyPlaylistConfig } from "@/lib/spotify/api";
import { weddingConfig, type Locale } from "@/lib/wedding-config";

type SectionNamespace = "event" | "venue" | "travel" | "stay" | "dress" | "music" | "gifts" | "closing";

function getSectionTranslations(locale: Locale | undefined, namespace: SectionNamespace) {
  return locale ? getTranslations({ locale, namespace }) : getTranslations(namespace);
}

function googleMapsLink(name: string, address: string) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${name}, ${address}`);
  return url.toString();
}

function appleMapsLink(name: string, address: string, coordinates: { latitude: number; longitude: number }) {
  const url = new URL("https://maps.apple.com/");
  url.searchParams.set("q", `${name}, ${address}`);
  url.searchParams.set("ll", `${coordinates.latitude},${coordinates.longitude}`);
  url.searchParams.set("z", "15");
  return url.toString();
}

function getStayLinks(locale: Locale | undefined) {
  const areaQuery = "Vienna%20Meidling%20hotel%20or%20apartment";
  const baseLinks = [
    { label: "Booking.com", href: `https://www.booking.com/searchresults.html?ss=Meidling%2C+Vienna&nflt=class%3D1%3B2%3B3` },
    { label: "Expedia", href: `https://www.expedia.com/Hotel-Search?destination=${areaQuery}` },
    { label: "Hotels.com", href: `https://www.hotels.com/search.do?destination=${areaQuery}` },
  ];

  if (locale === "es") {
    return [
      { label: "Buscar hoteles en Meidling", href: "https://www.booking.com/searchresults.html?ss=Meidling%2C+Vienna" },
      { label: "Opciones económicas y hostels", href: "https://www.hostelworld.com/search?search_keywords=Vienna%20Meidling" },
      { label: "Apartamento o casa cerca del evento", href: "https://www.airbnb.com/s/Vienna--Austria/homes?query=Vienna%20Meidling" },
    ];
  }

  if (locale === "de-AT") {
    return [
      { label: "Hotels in Meidling suchen", href: "https://www.booking.com/searchresults.html?ss=Meidling%2C+Vienna" },
      { label: "Budget-Optionen", href: "https://www.booking.com/searchresults.html?ss=Vienna%20Meidling&nflt=class%3D1%3B2%3B3" },
      { label: "Apartment & Ferienwohnung", href: "https://www.airbnb.com/s/Vienna--Austria/homes?query=Vienna%20Meidling" },
    ];
  }

  if (locale === "hu") {
    return [
      { label: "Szállások Meidlingben", href: "https://www.booking.com/searchresults.html?ss=Meidling%2C+Vienna" },
      { label: "Költséghatékony lehetőségek", href: "https://www.booking.com/searchresults.html?ss=Vienna%20Meidling&nflt=class%3D1%3B2%3B3" },
      { label: "Lakás vagy apartman", href: "https://www.airbnb.com/s/Vienna--Austria/homes?query=Vienna%20Meidling" },
    ];
  }

  return baseLinks;
}

export type GuestInvitationDetails = {
  id: string;
  token: string;
  displayName: string;
  maxGuests: number;
  plusOneAllowed: boolean;
  locale: Locale;
  personalMessage?: string | null;
};

export type SiteSettingsData = {
  showGiftDetails?: boolean;
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  bic?: string;
  giftNote?: string;
  showPrivateAddress?: boolean;
  privateStreet?: string;
  privateCity?: string;
  privateAccessNotes?: string;
  contactPhone?: string;
  contactEmail?: string;
};

export async function WeddingSections({
  invitation,
  locale,
  siteSettings,
}: {
  invitation?: GuestInvitationDetails;
  locale?: Locale;
  siteSettings?: SiteSettingsData;
} = {}) {
  const [day, venue, travel, stay, dress, music, gifts, closing] = await Promise.all([
    getSectionTranslations(locale, "event"),
    getSectionTranslations(locale, "venue"),
    getSectionTranslations(locale, "travel"),
    getSectionTranslations(locale, "stay"),
    getSectionTranslations(locale, "dress"),
    getSectionTranslations(locale, "music"),
    getSectionTranslations(locale, "gifts"),
    getSectionTranslations(locale, "closing"),
  ]);

  const venues = [
    {
      id: "ceremony",
      name: weddingConfig.ceremony.name,
      localName: weddingConfig.ceremony.localName,
      address: weddingConfig.ceremony.address,
      time: weddingConfig.ceremony.time,
      arrival: weddingConfig.ceremony.guestArrival,
      coordinates: weddingConfig.ceremony.coordinates,
    },
    {
      id: "reception",
      name: weddingConfig.reception.name,
      localName: weddingConfig.reception.localName,
      address: weddingConfig.reception.address,
      time: `~${weddingConfig.reception.approximateStart}`,
      arrival: null,
      coordinates: weddingConfig.reception.coordinates,
    },
  ] as const;

  const rawStoryParagraphs = closing("story").split(/\n\s*\n|\r\n\s*\r\n/).filter(Boolean);
  const signature = rawStoryParagraphs.length > 0 && rawStoryParagraphs[rawStoryParagraphs.length - 1].includes("Ruben & Andrea")
    ? rawStoryParagraphs[rawStoryParagraphs.length - 1]
    : null;
  const coupleStoryParagraphs = signature ? rawStoryParagraphs.slice(0, -1) : rawStoryParagraphs;
  const travelLinks = [
    ...(locale === "es" ? [
      { label: travel("flightMadrid"), href: "https://www.ryanair.com/flights/es/es/vuelos-desde-madrid-a-viena" },
      { label: travel("flightBarcelona"), href: "https://www.vueling.com/en/flights-from-vienna-to-barcelona" },
      { label: travel("flightCaracas"), href: "https://www.iberia.com/es/vuelos-baratos/Caracas-Madrid/" },
    ] : []),
    ...(locale === "hu" ? [
      { label: travel("trainMav"), href: "https://www.mavcsoport.hu/en/mav-szemelyszallitas/international-travels/start-europa-tickets" },
      { label: travel("trainOebb"), href: "https://www.oebb.at/en/" },
    ] : []),
    ...(locale === "de-AT" ? [{ label: travel("trainOebb"), href: "https://www.oebb.at/de/" }] : []),
    ...(!locale || locale === "en" ? [{ label: travel("trainOebb"), href: "https://www.oebb.at/en/" }] : []),
    { label: travel("cityTickets"), href: "https://www.wienerlinien.at/web/wl-en/24-hours-vienna" },
    { label: travel("airportConnections"), href: "https://www.viennaairport.com/en/passengers/arrival__parking/public_transport" },
    ...(locale === "en" ? [{ label: travel("catTickets"), href: "https://www.cityairporttrain.com/en/" }] : []),
  ];
  const stayLinks = getStayLinks(locale);
  const spotifyPlaylist = getSpotifyPlaylistConfig();

  return (
    <>
      <Countdown />

      <section className="day-story" id="event-note" aria-labelledby="day-title">
        <div className="section-heading">
          <h2 id="day-title">{day("timelineTitle")}</h2>
        </div>
        <ol className="day-timeline">
          <li className="day-timeline__arrival">
            <time dateTime={`${weddingConfig.event.date}T${weddingConfig.ceremony.guestArrival}:00`}>
              {weddingConfig.ceremony.guestArrival}
            </time>
            <div>
              <h3>{day("pleaseArrive")}</h3>
              <p>{day("arrivalReminder")}</p>
            </div>
          </li>
          <li>
            <time dateTime={`${weddingConfig.event.date}T${weddingConfig.ceremony.time}:00`}>
              {weddingConfig.ceremony.time}
            </time>
            <div>
              <h3>{day("ceremony")}</h3>
              <p>{day("ceremonyDescription")}</p>
            </div>
          </li>
          <li>
            <time dateTime={`${weddingConfig.event.date}T${weddingConfig.reception.approximateStart}:00`}>
              ~{weddingConfig.reception.approximateStart}
            </time>
            <div>
              <h3>{day("reception")}</h3>
              <p>{day("receptionDescription")}</p>
            </div>
          </li>
        </ol>
      </section>

      <PhotoStory locale={locale} />

      <section className="closing-note" id="story" aria-labelledby="closing-title">
        <div className="closing-note__layout">
          <div>
            <p className="section-label">{closing("label")}</p>
            <h2 id="closing-title">{closing("title")}</h2>
            {invitation?.personalMessage && (
              <div
                style={{
                  marginTop: "1.75rem",
                  padding: "1.25rem 1.5rem",
                  background: "rgba(255, 255, 255, 0.85)",
                  border: "1px solid var(--color-gold-cream)",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(46, 36, 38, 0.04)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.78rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "var(--color-plum-light)",
                    margin: "0 0 0.5rem",
                    fontWeight: 600,
                  }}
                >
                  {invitation.displayName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontStyle: "italic",
                    fontSize: "0.95rem",
                    lineHeight: 1.65,
                    color: "var(--color-ink)",
                  }}
                >
                  &ldquo;{invitation.personalMessage}&rdquo;
                </p>
              </div>
            )}
          </div>
          <div className="closing-note__letter">
            {coupleStoryParagraphs.map((paragraph, idx) => (
              <p className="closing-note__story" key={idx}>{paragraph}</p>
            ))}
            {signature && (
              <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ height: "1px", width: "40px", background: "var(--color-gold-cream)" }} />
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.35rem",
                    fontStyle: "italic",
                    color: "var(--color-plum-deep)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {signature}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="venues" id="locations" aria-labelledby="venues-title">
        <div className="section-heading">
          <p className="section-label">{venue("label")}</p>
          <h2 id="venues-title">{venue("title")}</h2>
        </div>
        <div className="venue-list">
          {venues.map((place) => (
            <article className="venue" key={place.id}>
              <div className="venue__details">
                <p className="venue__type">{venue(place.id)}</p>
                <h3>{place.name}</h3>
                <p className="venue__local-name">{place.localName}</p>
                <address>{place.address}</address>
                <p className="venue__time">
                  <span>{place.id === "ceremony" ? venue("ceremonyTime") : venue("receptionTime")}</span>
                  <strong>{place.time}</strong>
                </p>
                {place.arrival && (
                  <p className="venue__arrival">
                    {venue("pleaseArriveBy")} <strong>{place.arrival}</strong>
                  </p>
                )}
                {place.id === "reception" && <p className="venue__personality">{venue("receptionEnd")}</p>}
              </div>
              <div className="venue__links">
                <TrackedMapLink
                  href={appleMapsLink(place.name, place.address, place.coordinates)}
                  invitation={invitation ? { id: invitation.id, token: invitation.token } : undefined}
                  label={venue("appleMaps")}
                />
                <TrackedMapLink
                  href={googleMapsLink(place.name, place.address)}
                  invitation={invitation ? { id: invitation.id, token: invitation.token } : undefined}
                  label={venue("googleMaps")}
                />
                <TrackedMapLink
                  href={googleMapsLink(place.name, place.address)}
                  invitation={invitation ? { id: invitation.id, token: invitation.token } : undefined}
                  label={venue("directions")}
                />
              </div>
            </article>
          ))}
        </div>
        <InteractiveMap
          ceremonyLabel={`${venue("ceremony")}: ${weddingConfig.ceremony.name}`}
          receptionLabel={`${venue("reception")}: ${weddingConfig.reception.name}`}
          overviewLabel={venue("mapOverview")}
          regionLabel={venue("mapRegion")}
          loadingLabel={venue("mapLoading")}
          readyLabel={venue("mapReady")}
          unavailableLabel={venue("mapUnavailable")}
          tileErrorLabel={venue("mapTileError")}
          arrivalLabel={venue("mapArrival")}
          beginsLabel={venue("mapBegins")}
          receptionFromLabel={venue("mapReceptionFrom")}
        />
      </section>

      <section className="travel-note" aria-labelledby="travel-title">
        <div className="section-heading">
          <h2 id="travel-title">{travel("title")}</h2>
        </div>
        <div className="travel-note__copy">
          <p>{travel("originInfo")}</p>
          <p>{travel("airportInfo")}</p>
          <p>{travel("cityTicketInfo")}</p>
          <p className="travel-note__price-note">{travel("priceNote")}</p>
          <ul className="travel-note__links">
            {travelLinks.map((link) => (
              <li key={link.label}><a href={link.href} rel="noreferrer" target="_blank">{link.label}</a></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="stay-note" aria-labelledby="stay-title">
        <div className="section-heading">
          <h2 id="stay-title">{stay("title")}</h2>
        </div>
        <div className="stay-note__copy">
          <p>{stay("quietArea")}</p>
          <p>{stay("cityCenter")}</p>
          <p>{stay("recommendations")}</p>
          <ul className="stay-note__links">
            {stayLinks.map((link) => (
              <li key={link.label}><a href={link.href} rel="noreferrer" target="_blank">{link.label}</a></li>
            ))}
          </ul>

          {siteSettings?.showPrivateAddress ? (
            <div
              className="private-address-card"
              style={{
                marginTop: "1.75rem",
                padding: "1.25rem 1.5rem",
                background: "rgba(140, 40, 54, 0.04)",
                border: "1px solid rgba(140, 40, 54, 0.18)",
                borderRadius: "8px",
              }}
            >
              <p style={{ fontWeight: 600, color: "#8C2836", margin: "0 0 0.4rem 0", fontSize: "0.95rem" }}>
                📍 Couple&apos;s Private Address in Vienna
              </p>
              <p style={{ margin: "0 0 0.25rem 0", color: "#2B2425", fontSize: "0.95rem" }}>
                {siteSettings.privateStreet || "Private Residence, Meidling"}
              </p>
              <p style={{ margin: "0 0 0.5rem 0", color: "#6E6264", fontSize: "0.9rem" }}>
                {siteSettings.privateCity || "1120 Vienna, Austria"}
              </p>
              {siteSettings.privateAccessNotes && (
                <p style={{ margin: 0, color: "#544648", fontSize: "0.85rem", fontStyle: "italic" }}>
                  Notes: {siteSettings.privateAccessNotes}
                </p>
              )}
            </div>
          ) : (
            <div
              className="stay-contact-cta"
              style={{
                marginTop: "1.75rem",
                padding: "1.1rem 1.35rem",
                background: "rgba(85, 100, 78, 0.05)",
                border: "1px dashed rgba(85, 100, 78, 0.28)",
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, color: "#45533E", fontSize: "0.9rem", lineHeight: 1.55 }}>
                ✨ <strong>Private accommodation recommendation:</strong> If you are planning an extended stay or want personalized lodging recommendations close to us, please reach out directly to Ruben &amp; Andrea!
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="dress-note" aria-labelledby="dress-title">
        <div className="dress-note__heading">
          <h2 id="dress-title">{dress("title")}</h2>
        </div>
        <p className="dress-note__code">{weddingConfig.dressCode}</p>
        <p className="dress-note__copy">{dress("formality")}</p>
      </section>

      <section className="music-note" id="music" aria-labelledby="music-title">
        <div className="section-heading">
          <p className="section-label">{music("label")}</p>
          <h2 id="music-title">{music("title")}</h2>
        </div>
        <div className="music-note__copy">
          <p>{music("intro")}</p>
          <SpotifyPlaylist
            title={music("embedTitle")}
            loadingLabel={music("spotifyLoading")}
            fallback={music("playlistUnavailable")}
            openSpotifyLabel={music("openSpotify")}
            embedUrl={spotifyPlaylist?.embedUrl ?? null}
            openUrl={spotifyPlaylist?.openUrl ?? null}
            invitation={invitation ? { id: invitation.id, token: invitation.token } : undefined}
          />
          <h3>{music("requestsTitle")}</h3>
          <p>{music("requestsIntro")}</p>
          {invitation && <SpotifySongRequests token={invitation.token} playlistUrl={spotifyPlaylist?.openUrl ?? null} />}
        </div>
      </section>

      <section className="gift-note" aria-labelledby="gifts-title">
        <div className="section-heading">
          <h2 id="gifts-title">{gifts("title")}</h2>
        </div>
        <div className="gift-note__copy">
          <p>{gifts("presence")}</p>
          <p>{gifts("contribution")}</p>
          {siteSettings?.showGiftDetails && (
            <details className="gift-details" style={{ marginTop: "1.25rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: 500, color: "#8C2836" }}>
                {gifts("detailsLabel")}
              </summary>
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1.25rem",
                  background: "rgba(247, 245, 242, 0.9)",
                  border: "1px solid #E8DFD8",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                {siteSettings.accountHolder && (
                  <p style={{ margin: "0 0 0.4rem 0", color: "#2B2425" }}>
                    <strong style={{ color: "#6E6264" }}>Account Holder:</strong> {siteSettings.accountHolder}
                  </p>
                )}
                {siteSettings.bankName && (
                  <p style={{ margin: "0 0 0.4rem 0", color: "#2B2425" }}>
                    <strong style={{ color: "#6E6264" }}>Bank:</strong> {siteSettings.bankName}
                  </p>
                )}
                {siteSettings.iban && (
                  <p style={{ margin: "0 0 0.4rem 0", color: "#2B2425", fontFamily: "monospace" }}>
                    <strong style={{ color: "#6E6264", fontFamily: "var(--font-body, sans-serif)" }}>IBAN:</strong> {siteSettings.iban}
                  </p>
                )}
                {siteSettings.bic && (
                  <p style={{ margin: "0 0 0.4rem 0", color: "#2B2425", fontFamily: "monospace" }}>
                    <strong style={{ color: "#6E6264", fontFamily: "var(--font-body, sans-serif)" }}>BIC/SWIFT:</strong> {siteSettings.bic}
                  </p>
                )}
                {siteSettings.giftNote && (
                  <p style={{ margin: "0.5rem 0 0 0", color: "#6E6264", fontStyle: "italic", fontSize: "0.85rem" }}>
                    {siteSettings.giftNote}
                  </p>
                )}
                {!siteSettings.iban && (
                  <p style={{ margin: 0, color: "#6E6264" }}>{gifts("detailsPending")}</p>
                )}
              </div>
            </details>
          )}
        </div>
      </section>

      {invitation && <RsvpForm invitation={invitation} />}
    </>
  );
}
