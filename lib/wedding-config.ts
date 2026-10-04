export const supportedLocales = ["en", "es", "de-AT", "hu"] as const;

export const weddingConfig = {
  couple: {
    fullNames: ["Ruben David Quijada Sanchez", "Andrea Müllauer"],
    displayNames: "Ruben & Andrea",
  },
  event: {
    date: "2027-10-02",
    localStart: "2027-10-02T15:00:00",
    timeZone: "Europe/Vienna",
    city: "Vienna, Austria",
  },
  ceremony: {
    name: "Catholic Church of Altmannsdorf (St. Oswald)",
    localName: "Kath. Kirche St. Oswald",
    address: "Khleslpl. 10, 1120 Wien, Austria",
    time: "15:00",
    guestArrival: "14:30",
    coordinates: { latitude: 48.164607, longitude: 16.313496 },
  },
  reception: {
    name: "Hetzendorf Palace",
    localName: "Schloss Hetzendorf",
    address: "Hetzendorfer Str. 79, 1120 Wien, Austria",
    approximateStart: "17:00",
    coordinates: { latitude: 48.161243, longitude: 16.319662 },
  },
  dressCode: "Formal",
  locales: supportedLocales,
} as const;

export type Locale = (typeof supportedLocales)[number];
