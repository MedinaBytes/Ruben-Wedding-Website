/**
 * WhatsApp Link Utilities (ToS-safe, serverless-ready)
 * Generates direct wa.me click-to-chat links with pre-filled, localized messages.
 * Does not require persistent WebSocket connections, eliminating Vercel runtime crashes and ban risks.
 */

export interface WhatsAppMessageParams {
  phoneNumber?: string | null;
  guestName: string;
  invitationUrl: string;
  language?: string;
}

export interface WhatsAppReminderParams extends WhatsAppMessageParams {
  daysLeft?: number;
}

/**
 * Normalizes phone numbers to standard E.164 without '+' or special symbols for wa.me links.
 * Example: "+43 660 123 4567" -> "436601234567"
 */
export function normalizePhoneForWaMe(rawPhone?: string | null): string {
  if (!rawPhone) return "";
  return rawPhone.replace(/\D/g, "");
}

/**
 * Builds localized invitation message for WhatsApp.
 */
export function getWhatsAppInvitationText({
  guestName,
  invitationUrl,
  language = "es",
}: Omit<WhatsAppMessageParams, "phoneNumber">): string {
  const isEs = language === "es" || language.startsWith("es");
  const isDe = language === "de" || language.startsWith("de");
  const isHu = language === "hu" || language.startsWith("hu");

  if (isEs) {
    return `¡Hola ${guestName}! 🕊️

Tenemos el inmenso honor y la alegría de invitarte a celebrar nuestro matrimonio en Viena el sábado 2 de octubre de 2027.

Hemos preparado una invitación interactiva exclusiva para ti con todos los detalles de la ceremonia en St. Oswald, la recepción en el Palacio Hetzendorf y la confirmación de asistencia:

👉 Abre tu invitación aquí:
${invitationUrl}

¡Esperamos con ilusión celebrar contigo!
Ruben & Andrea`;
  }

  if (isDe) {
    return `Liebe/r ${guestName}! 🕊️

Wir haben die große Freude, Dich zu unserer Hochzeit in Wien am Samstag, den 2. Oktober 2027 einzuladen!

Wir haben eine persönliche interaktive Einladung für Dich vorbereitet mit allen Details zur Trauung in St. Oswald, dem festlichen Empfang im Schloss Hetzendorf und RSVP:

👉 Deine Einladung öffnen:
${invitationUrl}

Wir freuen uns riesig auf das gemeinsame Feiern!
Ruben & Andrea`;
  }

  if (isHu) {
    return `Kedves ${guestName}! 🕊️

Nagy szeretettel hívunk meg benneteket bécsi esküvőnkre, amelyet 2027. október 2-án, szombaton ünneplünk!

Készítettünk egy személyes interaktív meghívót a szertartás, a Hetzendorf-kastélyban tartandó fogadás és a visszajelzés minden részletével:

👉 Nyisd meg a meghívódat itt:
${invitationUrl}

Szeretettel várunk benneteket!
Ruben & Andrea`;
  }

  // English fallback
  return `Dear ${guestName}, 🕊️

We have the distinct joy of inviting you to celebrate our imperial wedding in Vienna on Saturday, October 2, 2027.

We have created an interactive invitation exclusively for you with all details regarding Holy Matrimony at St. Oswald, the royal reception at Hetzendorf Palace, and RSVP:

👉 Open your invitation here:
${invitationUrl}

We look forward to celebrating with you!
Ruben & Andrea`;
}

/**
 * Builds localized reminder message for RSVP.
 */
export function getWhatsAppReminderText({
  guestName,
  invitationUrl,
  daysLeft,
  language = "es",
}: Omit<WhatsAppReminderParams, "phoneNumber">): string {
  const isEs = language === "es" || language.startsWith("es");
  const isDe = language === "de" || language.startsWith("de");
  const isHu = language === "hu" || language.startsWith("hu");

  const countdownText = daysLeft ? ` (quedan ${daysLeft} días)` : "";
  const countdownTextDe = daysLeft ? ` (noch ${daysLeft} Tage)` : "";
  const countdownTextHu = daysLeft ? ` (még ${daysLeft} nap maradt)` : "";
  const countdownTextEn = daysLeft ? ` (${daysLeft} days remaining)` : "";

  if (isEs) {
    return `Estimado/a ${guestName}, 💌

Te recordamos cordialmente confirmar tu asistencia para nuestra boda en Viena el 2 de octubre de 2027${countdownText}.

Puedes revisar todos los detalles de gala, menú y confirmar en tu enlace personal:
${invitationUrl}

¡Un fuerte abrazo!
Ruben & Andrea`;
  }

  if (isDe) {
    return `Liebe/r ${guestName}, 💌

Wir möchten Dich freundlich an die Rückmeldung zu unserer Hochzeit in Wien am 2. Oktober 2027 erinnern${countdownTextDe}.

Alle Details zu Menü und Festfolge sowie das RSVP findest Du hier:
${invitationUrl}

Herzliche Grüße,
Ruben & Andrea`;
  }

  if (isHu) {
    return `Kedves ${guestName}, 💌

Szeretnénk emlékeztetni bécsi esküvőnk részvételi visszajelzésére${countdownTextHu}.

A részleteket és az RSVP-t az alábbi linken éred el:
${invitationUrl}

Szeretettel,
Ruben & Andrea`;
  }

  return `Dear ${guestName}, 💌

This is a gentle reminder to confirm your attendance for our wedding in Vienna on October 2, 2027${countdownTextEn}.

You can view all schedule, menu, and RSVP details here:
${invitationUrl}

Warm regards,
Ruben & Andrea`;
}

/**
 * Creates a click-to-chat https://wa.me/ link for the invitation.
 */
export function buildWhatsAppInvitationLink(params: WhatsAppMessageParams): {
  url: string;
  hasPhone: boolean;
  text: string;
} {
  const cleanPhone = normalizePhoneForWaMe(params.phoneNumber);
  const text = getWhatsAppInvitationText(params);
  const encodedText = encodeURIComponent(text);

  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  return {
    url,
    hasPhone: Boolean(cleanPhone),
    text,
  };
}

/**
 * Creates a click-to-chat https://wa.me/ reminder link.
 */
export function buildWhatsAppReminderLink(params: WhatsAppReminderParams): {
  url: string;
  hasPhone: boolean;
  text: string;
} {
  const cleanPhone = normalizePhoneForWaMe(params.phoneNumber);
  const text = getWhatsAppReminderText(params);
  const encodedText = encodeURIComponent(text);

  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  return {
    url,
    hasPhone: Boolean(cleanPhone),
    text,
  };
}
