/**
 * Every private source photo in `Resources/Photos/` is listed here exactly once.
 *
 * - `hero` and `editorial` photos are placed by hand in specific sections.
 * - `album` photos appear in the memory album, in the order they are listed.
 *
 * Alt text lives in each locale's `photos` namespace; `altTextKey` must resolve in all of them.
 * `focalPoint` is a percentage used for `object-position` whenever a frame crops the photo.
 */
export type ImageRole = "hero" | "editorial" | "album";

export type ImageCuration = {
  id: string;
  sourceFilename: string;
  role: ImageRole;
  focalPoint: { x: number; y: number };
  altTextKey: `photos.${string}`;
};

const source = (number?: number) =>
  !number
    ? "WhatsApp Image 2026-10-03 at 10.38.02.jpeg"
    : `WhatsApp Image 2026-10-03 at 10.38.02 (${number}).jpeg`;

export const imageCurations = [
  // Placed photos
  { id: "formal-staircase-hero", sourceFilename: source(14), role: "hero", focalPoint: { x: 50, y: 46 }, altTextKey: "photos.formalStaircasePortrait" },
  { id: "birthday-kiss", sourceFilename: source(17), role: "editorial", focalPoint: { x: 52, y: 48 }, altTextKey: "photos.birthdayKiss" },
  { id: "city-observatory", sourceFilename: source(24), role: "editorial", focalPoint: { x: 50, y: 66 }, altTextKey: "photos.cityObservatory" },
  { id: "sunset-coast-portrait", sourceFilename: source(1), role: "editorial", focalPoint: { x: 48, y: 55 }, altTextKey: "photos.sunsetCoastPortrait" },
  { id: "garden-formal-portrait", sourceFilename: source(6), role: "editorial", focalPoint: { x: 50, y: 52 }, altTextKey: "photos.gardenFormalPortrait" },
  { id: "coastal-full-length", sourceFilename: source(33), role: "editorial", focalPoint: { x: 50, y: 56 }, altTextKey: "photos.coastalFullLength" },

  // Memory album, in display order
  { id: "night-city-embrace", sourceFilename: source(0), role: "album", focalPoint: { x: 45, y: 50 }, altTextKey: "photos.nightCityEmbrace" },
  { id: "garden-hug", sourceFilename: source(19), role: "album", focalPoint: { x: 50, y: 42 }, altTextKey: "photos.gardenHug" },
  { id: "lake-church-portrait", sourceFilename: source(3), role: "album", focalPoint: { x: 51, y: 69 }, altTextKey: "photos.lakeChurchPortrait" },
  { id: "boat-deck-sunshine", sourceFilename: source(2), role: "album", focalPoint: { x: 55, y: 50 }, altTextKey: "photos.boatDeckSunshine" },
  { id: "kayak-adventure", sourceFilename: source(10), role: "album", focalPoint: { x: 45, y: 55 }, altTextKey: "photos.kayakAdventure" },
  { id: "kayak-sea-view", sourceFilename: source(11), role: "album", focalPoint: { x: 50, y: 50 }, altTextKey: "photos.kayakSeaView" },
  { id: "palace-square", sourceFilename: source(4), role: "album", focalPoint: { x: 40, y: 55 }, altTextKey: "photos.palaceSquare" },
  { id: "wine-toast", sourceFilename: source(5), role: "album", focalPoint: { x: 55, y: 45 }, altTextKey: "photos.wineToast" },
  { id: "modern-waterfront", sourceFilename: source(22), role: "album", focalPoint: { x: 45, y: 55 }, altTextKey: "photos.modernWaterfront" },
  { id: "river-city-view", sourceFilename: source(15), role: "album", focalPoint: { x: 50, y: 60 }, altTextKey: "photos.riverCityView" },
  { id: "birthday-balloon", sourceFilename: source(16), role: "album", focalPoint: { x: 50, y: 50 }, altTextKey: "photos.birthdayBalloon" },
  { id: "white-horse-meeting", sourceFilename: source(9), role: "album", focalPoint: { x: 50, y: 40 }, altTextKey: "photos.whiteHorseMeeting" },
  { id: "country-lane-ride", sourceFilename: source(13), role: "album", focalPoint: { x: 45, y: 55 }, altTextKey: "photos.countryLaneRide" },
  { id: "scooter-helmets", sourceFilename: source(29), role: "album", focalPoint: { x: 40, y: 45 }, altTextKey: "photos.scooterHelmets" },
  { id: "bay-lookout", sourceFilename: source(30), role: "album", focalPoint: { x: 55, y: 60 }, altTextKey: "photos.bayLookout" },
  { id: "historic-rooftop", sourceFilename: source(28), role: "album", focalPoint: { x: 50, y: 70 }, altTextKey: "photos.historicRooftop" },
  { id: "city-skyline-selfie", sourceFilename: source(23), role: "album", focalPoint: { x: 55, y: 45 }, altTextKey: "photos.citySkylineSelfie" },
  { id: "turquoise-sea-toast", sourceFilename: source(31), role: "album", focalPoint: { x: 50, y: 40 }, altTextKey: "photos.turquoiseSeaToast" },
  { id: "cinema-night", sourceFilename: source(25), role: "album", focalPoint: { x: 50, y: 45 }, altTextKey: "photos.cinemaNight" },
  { id: "party-glasses", sourceFilename: source(26), role: "album", focalPoint: { x: 55, y: 40 }, altTextKey: "photos.partyGlasses" },
  { id: "evening-swing", sourceFilename: source(20), role: "album", focalPoint: { x: 50, y: 45 }, altTextKey: "photos.eveningSwing" },
  { id: "waterfront-selfie", sourceFilename: source(8), role: "album", focalPoint: { x: 55, y: 50 }, altTextKey: "photos.waterfrontSelfie" },
  { id: "forest-hilltop", sourceFilename: source(18), role: "album", focalPoint: { x: 50, y: 55 }, altTextKey: "photos.forestHilltop" },
  { id: "flight-selfie", sourceFilename: source(21), role: "album", focalPoint: { x: 50, y: 50 }, altTextKey: "photos.flightSelfie" },
  { id: "rooftop-pool-swim", sourceFilename: source(12), role: "album", focalPoint: { x: 50, y: 45 }, altTextKey: "photos.rooftopPoolSwim" },
  { id: "cafe-lunch", sourceFilename: source(27), role: "album", focalPoint: { x: 60, y: 35 }, altTextKey: "photos.cafeLunch" },
  { id: "winter-elevator-selfie", sourceFilename: source(7), role: "album", focalPoint: { x: 55, y: 50 }, altTextKey: "photos.winterElevatorSelfie" },
  { id: "turquoise-sea-smile", sourceFilename: source(32), role: "album", focalPoint: { x: 50, y: 40 }, altTextKey: "photos.turquoiseSeaSmile" },
  { id: "silly-faces", sourceFilename: source(34), role: "album", focalPoint: { x: 50, y: 50 }, altTextKey: "photos.sillyFaces" },
] as const satisfies readonly ImageCuration[];