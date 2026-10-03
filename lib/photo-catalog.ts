import type { Locale } from "@/lib/wedding-config";

type PhotoLocale = Exclude<Locale, "de-AT"> | "de";

export type PhotoStoryItem = {
  id: string;
  category: "editorial" | "travel" | "celebration" | "adventures";
  title: Record<PhotoLocale, string>;
  caption: Record<PhotoLocale, string>;
};

export const photoCatalog: readonly PhotoStoryItem[] = [
  {
    id: "formal-staircase-hero",
    category: "editorial",
    title: {
      en: "The start of forever",
      es: "El comienzo de todo",
      de: "Der Beginn für immer",
      hu: "A kezdet mindörökké",
    },
    caption: {
      en: "Ruben and Andrea in formal attire on a grand staircase.",
      es: "Ruben y Andrea vestidos de gala en una gran escalinata.",
      de: "Ruben und Andrea festlich gekleidet auf einer großen Treppe.",
      hu: "Ruben és Andrea elegáns öltözékben a díszlépcsőn.",
    },
  },
  {
    id: "birthday-kiss",
    category: "celebration",
    title: {
      en: "One very good birthday",
      es: "Un cumpleaños muy especial",
      de: "Ein unvergesslicher Geburtstag",
      hu: "Egy felejthetetlen születésnap",
    },
    caption: {
      en: "A celebratory kiss to welcome another year together.",
      es: "Ruben y Andrea se dan un beso en una celebración de cumpleaños.",
      de: "Ein inniger Kuss, um das Leben gemeinsam zu feiern.",
      hu: "Egy szerelmes csók az együtt töltött évekért.",
    },
  },
  {
    id: "city-observatory",
    category: "travel",
    title: {
      en: "A little above the city",
      es: "Un poco por encima de la ciudad",
      de: "Ein Stück über den Dächern",
      hu: "Kicsit a város felett",
    },
    caption: {
      en: "Looking out over the skyline and everything ahead.",
      es: "Ruben y Andrea juntos sobre la ciudad contemplando el horizonte.",
      de: "Gemeinsam über die Stadt blicken und in die Zukunft schauen.",
      hu: "Együtt nézve a város látképét és a jövőt.",
    },
  },
  {
    id: "sunset-coast-portrait",
    category: "editorial",
    title: {
      en: "Our favorite kind of evening",
      es: "Nuestra clase de tarde favorita",
      de: "Unser liebster Abend",
      hu: "A kedvenc esténk",
    },
    caption: {
      en: "Ruben and Andrea together beside the coast at sunset.",
      es: "Ruben y Andrea junto a la costa al atardecer.",
      de: "Ruben und Andrea am Meer im goldenen Abendlicht.",
      hu: "Ruben és Andrea a tengerparton naplementekor.",
    },
  },
  {
    id: "garden-formal-portrait",
    category: "editorial",
    title: {
      en: "Quiet garden strolls",
      es: "Tardes de paseo y complicidad",
      de: "Spaziergang im Schlossgarten",
      hu: "Séta a palotakertben",
    },
    caption: {
      en: "Walking hand in hand through peaceful palace gardens.",
      es: "Caminando entre jardines mientras soñamos con el gran día.",
      de: "Hand in Hand durch die königlichen Gärten schlendern.",
      hu: "Kéz a kézben a békés kastélykertben.",
    },
  },
  {
    id: "coastal-full-length",
    category: "editorial",
    title: {
      en: "Beside the open sea",
      es: "Frente a la inmensidad del mar",
      de: "Am weiten Meer",
      hu: "A nyílt tenger partján",
    },
    caption: {
      en: "A coastal journey we will always hold dear.",
      es: "Un viaje costero que siempre guardamos en el corazón.",
      de: "Eine Reise an die Küste, die wir nie vergessen.",
      hu: "Egy tengerparti utazás emléke, amit mindig őrzünk.",
    },
  },
  {
    id: "lake-church-portrait",
    category: "travel",
    title: {
      en: "Serenity by the lake",
      es: "Reflejos en el lago",
      de: "Ruhe am See",
      hu: "Békesség a tóparton",
    },
    caption: {
      en: "A calm afternoon by the lakeside church.",
      es: "Una tarde serena frente a la iglesia junto al agua.",
      de: "Ein friedlicher Nachmittag an der Seepromenade.",
      hu: "Egy nyugodt délután a tóparti templom mellett.",
    },
  },
  {
    id: "palace-square",
    category: "travel",
    title: {
      en: "Historic grand squares",
      es: "Plazas históricas",
      de: "Historische Plätze",
      hu: "Történelmi terek",
    },
    caption: {
      en: "Wandering through majestic architectural wonders.",
      es: "Paseando entre la majestuosa arquitectura europea.",
      de: "Spaziergänge zwischen herrschaftlichen Schlossbauten.",
      hu: "Séta a fenséges történelmi épületek között.",
    },
  },
  {
    id: "wine-toast",
    category: "celebration",
    title: {
      en: "Toasting to love",
      es: "Un brindis por el amor",
      de: "Ein Toast auf die Liebe",
      hu: "Koccintás a szerelemre",
    },
    caption: {
      en: "Raising a glass to every milestone, big and small.",
      es: "Celebrando los momentos más bonitos de nuestro camino.",
      de: "Ein Glas auf all die schönen Momente des Lebens.",
      hu: "Pohárköszöntő az élet szép pillanataira.",
    },
  },
  {
    id: "garden-hug",
    category: "celebration",
    title: {
      en: "Warmth in bloom",
      es: "Un abrazo entre flores",
      de: "Wärme im Grünen",
      hu: "Ölelés a virágok között",
    },
    caption: {
      en: "The simple happiness of being right where we belong.",
      es: "La calidez de estar en el lugar correcto, juntos.",
      de: "Einfaches Glück, genau am richtigen Ort zu sein.",
      hu: "A boldogság, hogy pontosan ott vagyunk, ahol lennünk kell.",
    },
  },
  {
    id: "boat-deck-sunshine",
    category: "adventures",
    title: {
      en: "Sunny deck days",
      es: "Navegando hacia el sol",
      de: "Sonnige Stunden an Deck",
      hu: "Napsütés a hajófedélzeten",
    },
    caption: {
      en: "Fresh breeze, warm sun, and smiles on deck.",
      es: "Viento fresco y risas en cubierta bajo el sol.",
      de: "Frische Brise, Sonnenschein und gemeinsame Freude.",
      hu: "Friss szellő, napsütés és mosoly a fedélzeten.",
    },
  },
  {
    id: "turquoise-sea-smile",
    category: "adventures",
    title: {
      en: "Mediterranean smiles",
      es: "Sonrisas mediterráneas",
      de: "Mediterranes Lächeln",
      hu: "Mediterrán mosoly",
    },
    caption: {
      en: "Golden sun and the clearest waters of our travels.",
      es: "Esa luz dorada y el agua más pura de nuestras vacaciones.",
      de: "Goldenes Sonnenlicht und traumhaft klares Wasser.",
      hu: "Aranyló napfény és a legtisztább tengeri emlékek.",
    },
  },
] as const;
