import type { Locale } from "@/lib/wedding-config";

export type PhotoStoryItem = {
  id: string;
  category: "editorial" | "travel" | "celebration" | "adventures" | "candid";
  title: Record<Locale, string>;
  caption: Record<Locale, string>;
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
    id: "night-city-embrace",
    category: "travel",
    title: {
      en: "Under the city lights",
      es: "La ciudad que nunca duerme",
      de: "Im Glanz der Großstadt",
      hu: "A város fényei alatt",
    },
    caption: {
      en: "Embracing as the city sparkles around us.",
      es: "Abrazados bajo las luces nocturnas de la metrópoli.",
      de: "Umarmt unter den funkelnden Lichtern der Stadt.",
      hu: "Ölelésben a kivilágított nagyvárosban.",
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
    id: "boat-deck-sunshine",
    category: "travel",
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
    id: "kayak-adventure",
    category: "adventures",
    title: {
      en: "Paddling into the blue",
      es: "Remando juntos",
      de: "Gemeinsam auf dem Wasser",
      hu: "Kajakkaland kettesben",
    },
    caption: {
      en: "Exploring hidden coves and clear coastal waters.",
      es: "Descubriendo calas secretas y aguas cristalinas.",
      de: "Versteckte Buchten und kristallklares Meer entdecken.",
      hu: "Rejtett öblök és kristálytiszta vizek felfedezése.",
    },
  },
  {
    id: "kayak-sea-view",
    category: "adventures",
    title: {
      en: "Turquoise horizons",
      es: "Aguas turquesas",
      de: "Türkise Weite",
      hu: "Türkizkék horizont",
    },
    caption: {
      en: "The thrill of adventure across the open sea.",
      es: "La emoción de la aventura en mar abierto.",
      de: "Das Gefühl von Freiheit auf offenem Meer.",
      hu: "A szabadság élménye a nyílt tengeren.",
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
    id: "modern-waterfront",
    category: "travel",
    title: {
      en: "Waterfront discoveries",
      es: "Caminos junto al agua",
      de: "Promenade am Wasser",
      hu: "Felfedezések a vízparton",
    },
    caption: {
      en: "Exploring contemporary promenades and waterfront views.",
      es: "Descubriendo rincones vanguardistas frente a la bahía.",
      de: "Entdeckungen entlang moderner Uferpromenaden.",
      hu: "Séta a modern tengerparti sétányokon.",
    },
  },
  {
    id: "river-city-view",
    category: "travel",
    title: {
      en: "River city panorama",
      es: "El fluir del río",
      de: "Blick auf den Fluss",
      hu: "Folyóparti panoráma",
    },
    caption: {
      en: "Watching the river flow through historic cityscapes.",
      es: "Contemplando el paso del tiempo y la calma del río.",
      de: "Den Fluss und die Stadtkulisse im Sonnenlicht genießen.",
      hu: "A folyó és a város látványa a napfényben.",
    },
  },
  {
    id: "birthday-balloon",
    category: "celebration",
    title: {
      en: "Birthday festivities",
      es: "Días de celebración",
      de: "Festliche Geburtstage",
      hu: "Ünnepi pillanatok",
    },
    caption: {
      en: "Balloons, surprises, and shared happiness.",
      es: "Globos, sorpresas y alegría compartida.",
      de: "Luftballons, Überraschungen und gemeinsame Freude.",
      hu: "Lufik, meglepetések és közös vidámság.",
    },
  },
  {
    id: "white-horse-meeting",
    category: "adventures",
    title: {
      en: "Gentle encounters",
      es: "Encuentros en el camino",
      de: "Begegnungen in der Natur",
      hu: "Természetközeli találkozások",
    },
    caption: {
      en: "Magical moments surrounded by gentle nature.",
      es: "Momentos mágicos en contacto con la naturaleza.",
      de: "Wunderschöne Momente inmitten der Natur.",
      hu: "Varázslatos pillanatok a természet lágy ölén.",
    },
  },
  {
    id: "country-lane-ride",
    category: "adventures",
    title: {
      en: "Country lane getaways",
      es: "Rutas campestres",
      de: "Ausflug ins Grüne",
      hu: "Vidám vidéki utak",
    },
    caption: {
      en: "Getting lost along scenic and sunlit country roads.",
      es: "Perdiéndonos por caminos verdes y soleados.",
      de: "Unterwegs auf malerischen Landstraßen.",
      hu: "Kirándulás a napsütötte tájakon.",
    },
  },
  {
    id: "scooter-helmets",
    category: "adventures",
    title: {
      en: "Two wheels, endless laughs",
      es: "A dos ruedas",
      de: "Auf zwei Rädern",
      hu: "Két keréken, mosolyogva",
    },
    caption: {
      en: "The joyful thrill of exploring new roads on a scooter.",
      es: "La diversión de recorrer nuevas calles juntos.",
      de: "Mit dem Roller neue Straßen und Wege entdecken.",
      hu: "Közös robogózás új utcákon és utakon.",
    },
  },
  {
    id: "bay-lookout",
    category: "travel",
    title: {
      en: "Bay lookout",
      es: "Mirador de la bahía",
      de: "Blick über die Bucht",
      hu: "Kilátás az öbölre",
    },
    caption: {
      en: "A natural balcony looking out over the endless sea.",
      es: "Un balcón natural hacia el mar infinito.",
      de: "Ein atemberaubender Aussichtspunkt über das Meer.",
      hu: "Lenyűgöző panoráma a tengerre a hegytetőről.",
    },
  },
  {
    id: "historic-rooftop",
    category: "travel",
    title: {
      en: "Rooftop vantage",
      es: "Tejados y cúpulas",
      de: "Über den Dächern der Altstadt",
      hu: "Az óváros háztetői",
    },
    caption: {
      en: "The romantic charm of old-world domes and rooftops.",
      es: "La magia de las alturas y la arquitectura clásica.",
      de: "Kuppeln, Geschichte und ein weiter Ausblick.",
      hu: "Történelmi kupolák és romantikus kilátás a magasból.",
    },
  },
  {
    id: "city-skyline-selfie",
    category: "candid",
    title: {
      en: "Skyline selfies",
      es: "Risas con vistas",
      de: "Selfie mit Aussicht",
      hu: "Szelfi panorámával",
    },
    caption: {
      en: "Spontaneous smiles with the city panorama behind us.",
      es: "Nuestra sonrisa espontánea frente al skyline.",
      de: "Spontane Lacher mit der Skyline im Hintergrund.",
      hu: "Őszinte mosolyok a város látképével a háttérben.",
    },
  },
  {
    id: "turquoise-sea-toast",
    category: "celebration",
    title: {
      en: "Turquoise sea toast",
      es: "Brindis bajo el sol",
      de: "Anstoßen am Meer",
      hu: "Koccintás a türkizkék tengeren",
    },
    caption: {
      en: "Raising a toast against the most crystal-clear blue waters.",
      es: "Copas arriba con el azul más transparente de fondo.",
      de: "Ein Glas erheben vor kristallklarem Wasser.",
      hu: "Pohárköszöntő a csillogó tenger felett.",
    },
  },
  {
    id: "cinema-night",
    category: "candid",
    title: {
      en: "Cinema date nights",
      es: "Noche de cine y palomitas",
      de: "Kinoabend zu zweit",
      hu: "Mozieste kettesben",
    },
    caption: {
      en: "Simple date nights that turn into our favorite memories.",
      es: "Planes sencillos que se convierten en los mejores recuerdos.",
      de: "Einfache Abende, die zu den schönsten Erinnerungen werden.",
      hu: "Egyszerű esték, amelyek a legszebb emlékekké válnak.",
    },
  },
  {
    id: "party-glasses",
    category: "candid",
    title: {
      en: "Party mode on",
      es: "Modo fiesta activado",
      de: "Party-Stimmung",
      hu: "Buli hangulatban",
    },
    caption: {
      en: "Fun party glasses, great beats, and unforgettable celebrations.",
      es: "Gafas divertidas, buena música y ganas de bailar.",
      de: "Lustige Brillen, Musik und pure Feierlaune.",
      hu: "Vicces szemüvegek, jó zene és felejthetetlen buli.",
    },
  },
  {
    id: "evening-swing",
    category: "candid",
    title: {
      en: "Twilight swings",
      es: "Columpio al anochecer",
      de: "Schaukeln in der Dämmerung",
      hu: "Hintázás alkonyatkor",
    },
    caption: {
      en: "Laughing like kids as the evening colors set in.",
      es: "Jugando y riendo como niños al caer la tarde.",
      de: "Lachen und träumen, wenn der Abend hereinbricht.",
      hu: "Nevetés és felszabadult pillanatok naplementekor.",
    },
  },
  {
    id: "waterfront-selfie",
    category: "candid",
    title: {
      en: "Harbor walks",
      es: "Paseos al puerto",
      de: "Am Hafenbecken",
      hu: "Séta a kikötőben",
    },
    caption: {
      en: "Salty air, peaceful waves, and walking hand in hand.",
      es: "El olor a salitre y tu mano entrelazada con la mía.",
      de: "Meeresluft, sanfte Wellen und gemeinsame Schritte.",
      hu: "Sós tengeri levegő és kéz a kézben tett séták.",
    },
  },
  {
    id: "forest-hilltop",
    category: "adventures",
    title: {
      en: "Verdant summits",
      es: "Cimas verdes",
      de: "Auf den grünen Höhen",
      hu: "Zöldellő hegycsúcsok",
    },
    caption: {
      en: "Breathing in the mountain air surrounded by lush forest.",
      es: "Respirando aire puro en lo alto de la montaña.",
      de: "Frische Bergluft und weite Ausblicke über die Wälder.",
      hu: "Friss hegyi levegő és végtelen erdők látványa.",
    },
  },
  {
    id: "flight-selfie",
    category: "travel",
    title: {
      en: "Next destination",
      es: "Próximo destino",
      de: "Abflug ins Abenteuer",
      hu: "Következő úti cél",
    },
    caption: {
      en: "The excitement before touching down in another adventure.",
      es: "La emoción en el avión antes de aterrizar en una nueva aventura.",
      de: "Die Vorfreude im Flugzeug auf ein neues Ziel.",
      hu: "Az utazás izgalma a repülőgépen az új kaland előtt.",
    },
  },
  {
    id: "rooftop-pool-swim",
    category: "adventures",
    title: {
      en: "Rooftop poolside",
      es: "Un chapuzón en las alturas",
      de: "Pool mit Weitblick",
      hu: "Csobbanás a tetőteraszon",
    },
    caption: {
      en: "Cooling off with city views on hot summer days.",
      es: "Piscina en la azotea y tardes de relax frente a la ciudad.",
      de: "Erfrischung auf dem Dach über der Stadt.",
      hu: "Hűsölés és pihenés a tetőtéri medencénél.",
    },
  },
  {
    id: "cafe-lunch",
    category: "candid",
    title: {
      en: "Café conversations",
      es: "Café, charlas y sobremesa",
      de: "Kaffeepause & Gespräche",
      hu: "Kávéházi beszélgetések",
    },
    caption: {
      en: "Our favorite lunches where hours pass like minutes.",
      es: "Nuestras comidas favoritas donde el tiempo vuela.",
      de: "Gemütliche Stunden, in denen die Zeit verfliegt.",
      hu: "Kedvenc ebédjeink, ahol repül az idő.",
    },
  },
  {
    id: "winter-elevator-selfie",
    category: "candid",
    title: {
      en: "Winter warmers",
      es: "Días de invierno",
      de: "Wintertage zu zweit",
      hu: "Téli melegség",
    },
    caption: {
      en: "Coats, scarves, and warm smiles on chilly days.",
      es: "Abrigos, bufandas y sonrisas para combatir el frío.",
      de: "Warme Mäntel, Schals und strahlende Gesichter.",
      hu: "Kabátok, sálak és meleg mosolyok a hideg napokon.",
    },
  },
  {
    id: "turquoise-sea-smile",
    category: "celebration",
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
  {
    id: "silly-faces",
    category: "candid",
    title: {
      en: "Pure fun & silliness",
      es: "Nuestra complicidad y risas",
      de: "Gemeinsam albern sein",
      hu: "Nevetés és bolondozás",
    },
    caption: {
      en: "Being completely goofy and perfectly ourselves together.",
      es: "Haciendo tonterías juntos, siendo siempre nosotros mismos.",
      de: "Lachen, Grimassen schneiden und einfach wir selbst sein.",
      hu: "Közös bolondozás és a legőszintébb pillanatok.",
    },
  },
] as const;
