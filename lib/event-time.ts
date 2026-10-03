import { weddingConfig } from "./wedding-config";

const localDateTimeParts = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: weddingConfig.event.timeZone,
  year: "numeric",
});

function readDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) throw new Error(`Could not format event date part: ${type}.`);
  return Number(value);
}

export function getWeddingInstant() {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(
    weddingConfig.event.localStart,
  );
  if (!match) throw new Error("Wedding start must be an ISO local date-time.");

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const expectedUtc = Date.UTC(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
    Number(hourText),
    Number(minuteText),
    Number(secondText),
  );
  let candidate = expectedUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = localDateTimeParts.formatToParts(new Date(candidate));
    const observedUtc = Date.UTC(
      readDatePart(parts, "year"),
      readDatePart(parts, "month") - 1,
      readDatePart(parts, "day"),
      readDatePart(parts, "hour"),
      readDatePart(parts, "minute"),
      readDatePart(parts, "second"),
    );
    const adjustment = expectedUtc - observedUtc;
    candidate += adjustment;
    if (adjustment === 0) break;
  }

  return new Date(candidate);
}

export function getWeddingDateLabel(locale: string, includeWeekday = false) {
  const localDate = new Date(`${weddingConfig.event.date}T12:00:00.000Z`);

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    timeZone: weddingConfig.event.timeZone,
    weekday: includeWeekday ? "long" : undefined,
    year: "numeric",
  }).format(localDate);
}