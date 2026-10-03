import { getTranslations } from "next-intl/server";

import { Countdown } from "@/components/invitation/countdown";
import { RsvpForm, SongRequestForm } from "@/components/invitation/guest-forms";
import { PhotoStory } from "@/components/invitation/photo-story";
import { SpotifyPlaylist } from "@/components/invitation/spotify-playlist";
import { TrackedMapLink } from "@/components/invitation/tracked-map-link";
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

  if (locale === "de") {
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

export async function WeddingSections({
  invitation,
  locale,
}: {
  invitation?: GuestInvitationDetails;
  locale?: Locale;
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

  const storyParagraphs = (invitation?.personalMessage ?? closing("story")).split(/\n\s*\n|\r\n\s*\r\n/).filter(Boolean);
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
    ...(locale === "de" ? [{ label: travel("trainOebb"), href: "https://www.oebb.at/de/" }] : []),
    ...(!locale || locale === "en" ? [{ label: travel("trainOebb"), href: "https://www.oebb.at/en/" }] : []),
    { label: travel("cityTickets"), href: "https://www.wienerlinien.at/web/wl-en/24-hours-vienna" },
    { label: travel("airportConnections"), href: "https://www.viennaairport.com/en/passengers/arrival__parking/public_transport" },
    ...(locale === "en" ? [{ label: travel("catTickets"), href: "https://www.cityairporttrain.com/en/" }] : []),
  ];
  const stayLinks = getStayLinks(locale);
  const spotifyConfigured = Boolean(process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL);

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

      <section className="closing-note" aria-labelledby="closing-title">
        <div className="closing-note__layout">
          <h2 id="closing-title">{closing("title")}</h2>
          <div className="closing-note__letter">
            {storyParagraphs.map((paragraph) => (
              <p className="closing-note__story" key={paragraph}>{paragraph}</p>
            ))}
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
          <p className="music-note__status">{spotifyConfigured ? music("spotifyReady") : music("spotifyPending")}</p>
          <SpotifyPlaylist
            title={music("embedTitle")}
            playLabel={music("playPlaylist")}
            fallback={music("playlistUnavailable")}
            invitation={invitation ? { id: invitation.id, token: invitation.token } : undefined}
          />
          <h3>{music("requestsTitle")}</h3>
          <p>{music("requestsIntro")}</p>
          {invitation && <SongRequestForm token={invitation.token} />}
        </div>
      </section>

      <section className="gift-note" aria-labelledby="gifts-title">
        <div className="section-heading">
          <h2 id="gifts-title">{gifts("title")}</h2>
        </div>
        <div className="gift-note__copy">
          <p>{gifts("presence")}</p>
          <p>{gifts("contribution")}</p>
          <details className="gift-details">
            <summary>{gifts("detailsLabel")}</summary>
            <p>{gifts("detailsPending")}</p>
          </details>
        </div>
      </section>

      {invitation && <RsvpForm invitation={invitation} />}
    </>
  );
}
