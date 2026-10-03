import { getTranslations } from "next-intl/server";

import { Countdown } from "@/components/invitation/countdown";
import { RsvpForm, SongRequestForm } from "@/components/invitation/guest-forms";
import { LazyMap } from "@/components/invitation/lazy-map";
import { SpotifyPlaylist } from "@/components/invitation/spotify-playlist";
import { TrackedMapLink } from "@/components/invitation/tracked-map-link";
import { weddingConfig, type Locale } from "@/lib/wedding-config";

type SectionNamespace = "event" | "venue" | "travel" | "stay" | "dress" | "music" | "gifts" | "closing";

function getSectionTranslations(locale: Locale | undefined, namespace: SectionNamespace) {
  return locale ? getTranslations({ locale, namespace }) : getTranslations(namespace);
}

function mapsLink(name: string, address: string, mode: "search" | "directions") {
  const url = new URL(
    mode === "search"
      ? "https://www.google.com/maps/search/"
      : "https://www.google.com/maps/dir/",
  );
  url.searchParams.set("api", "1");
  url.searchParams.set(mode === "search" ? "query" : "destination", `${name}, ${address}`);
  return url.toString();
}

export type GuestInvitationDetails = {
  id: string;
  token: string;
  displayName: string;
  maxGuests: number;
  plusOneAllowed: boolean;
  locale: Locale;
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
    },
    {
      id: "reception",
      name: weddingConfig.reception.name,
      localName: weddingConfig.reception.localName,
      address: weddingConfig.reception.address,
      time: `~${weddingConfig.reception.approximateStart}`,
      arrival: null,
    },
  ] as const;

  return (
    <>
      <Countdown />

      <section className="day-story" aria-labelledby="day-title">
        <div className="section-heading">
          <p className="section-label">{day("dayLabel")}</p>
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
                <LazyMap
                  name={place.name}
                  address={place.address}
                  title={venue("mapTitle", { name: place.name })}
                />
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
                  href={mapsLink(place.name, place.address, "search")}
                  invitation={invitation ? { id: invitation.id, token: invitation.token } : undefined}
                  label={venue("openMap")}
                />
                <TrackedMapLink
                  href={mapsLink(place.name, place.address, "directions")}
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
          <p className="section-label">{travel("label")}</p>
          <h2 id="travel-title">{travel("title")}</h2>
        </div>
        <div className="travel-note__copy">
          <p>{travel("publicTransport")}</p>
          <p>{travel("car")}</p>
          <p>{travel("betweenVenues")}</p>
          <p>{travel("liveDirections")}</p>
        </div>
      </section>

      <section className="stay-note" aria-labelledby="stay-title">
        <div className="section-heading">
          <p className="section-label">{stay("label")}</p>
          <h2 id="stay-title">{stay("title")}</h2>
        </div>
        <div className="stay-note__copy">
          <p>{stay("quietArea")}</p>
          <p>{stay("cityCenter")}</p>
          <p>{stay("recommendations")}</p>
        </div>
      </section>

      <section className="dress-note" aria-labelledby="dress-title">
        <div className="dress-note__heading">
          <p className="section-label">{dress("label")}</p>
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
          <p className="section-label">{gifts("label")}</p>
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

      <section className="closing-note" aria-labelledby="closing-title">
        <p className="section-label">{closing("label")}</p>
        <h2 id="closing-title">{closing("title")}</h2>
        <p>{closing("message")}</p>
      </section>
    </>
  );
}