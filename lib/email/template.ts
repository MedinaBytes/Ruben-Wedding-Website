/**
 * Luxury HTML Email Template: The Royal Viennese Closed Envelope
 * Features an authentic closed envelope flap sealed with the olive botanical wax monogram seal.
 * The wax seal itself is a direct clickable link to open the personalized invitation.
 */

export interface InvitationEmailTemplateParams {
  guestName: string;
  invitationUrl: string;
  language?: string;
  maxGuests?: number;
  plusOneAllowed?: boolean;
  siteUrl?: string;
  personalMessage?: string | null;
}

export function getInvitationEmailSubject(lang?: string | null, displayName?: string): string {
  const normLang = (lang || "es").toLowerCase();
  const name = displayName?.trim() || "Invitado";

  if (normLang.startsWith("de")) {
    return `Hochzeitseinladung Ruben & Andrea — ${name}`;
  }
  if (normLang.startsWith("hu")) {
    return `Esküvői Meghívó: Ruben & Andrea — ${name}`;
  }
  if (normLang.startsWith("es")) {
    return `Invitación Imperial a la Boda de Ruben & Andrea — ${name}`;
  }
  return `Ruben & Andrea Wedding Invitation — ${name}`;
}

export function buildEnvelopeInvitationHtml({
  guestName,
  invitationUrl,
  language = "es",
  maxGuests = 1,
  plusOneAllowed = false,
  siteUrl = "https://theandyrubenwedding.website",
  personalMessage,
}: InvitationEmailTemplateParams): string {
  const normLang = (language || "es").toLowerCase();
  const isEs = normLang === "es" || normLang.startsWith("es");
  const isDe = normLang === "de" || normLang.startsWith("de");
  const isHu = normLang === "hu" || normLang.startsWith("hu");

  const cleanSiteUrl = siteUrl.replace(/\/$/, "");
  const sealImageUrl = `${cleanSiteUrl}/orchids/seal-monogram.png`;
  const flowerSprayUrl = `${cleanSiteUrl}/orchids/orchid-spray-horizontal.png`;
  const flowerBloomUrl = `${cleanSiteUrl}/orchids/orchid-single-bloom.png`;

  // Localized texts
  const t = {
    title: isEs
      ? "Ruben & Andrea — Boda Real en Viena"
      : isDe
        ? "Ruben & Andrea — Kaiserliche Hochzeit in Wien"
        : isHu
          ? "Ruben & Andrea — Császári Esküvő Bécsben"
          : "Ruben & Andrea — Imperial Wedding in Vienna",
    eyebrow: isEs
      ? "ENLACE IMPERIAL · VIENA 2027"
      : isDe
        ? "KAISERLICHE HOCHZEIT · WIEN 2027"
        : isHu
          ? "CSÁSZÁRI ESKÜVŐ · BÉCS 2027"
          : "IMPERIAL WEDDING · VIENNA 2027",
    salutation: isEs
      ? `Estimado/a ${guestName},`
      : isDe
        ? `Liebe/r ${guestName},`
        : isHu
          ? `Kedves ${guestName}!`
          : `Dear ${guestName},`,
    invitationFor: isEs
      ? "Invitación Exclusiva para"
      : isDe
        ? "Exklusive Einladung für"
        : isHu
          ? "Exkluzív meghívó"
          : "Exclusively Prepared for",
    headline: isEs
      ? "Tenemos el inmenso honor y la alegría de invitarte a celebrar nuestro matrimonio en Viena."
      : isDe
        ? "Wir haben die große Ehre und Freude, Dich zu unserer Hochzeit in Wien einzuladen."
        : isHu
          ? "Nagy örömmel és szeretettel hívunk meg benneteket bécsi esküvőnk megünneplésére."
          : "We have the distinct honour and joy of inviting you to celebrate our wedding in Vienna.",
    bodyDescription: isEs
      ? "Hemos preparado una experiencia digital interactiva con todos los detalles de la ceremonia en la Iglesia Parroquial de St. Oswald, la recepción en el Palacio Hetzendorf, el código de vestimenta de gala, guía de viaje y confirmación de asistencia."
      : isDe
        ? "Wir haben eine interaktive digitale Einladung mit allen Details zur Trauung in der Pfarre St. Oswald, dem festlichen Empfang im Schloss Hetzendorf, Dresscode, Reiseinformationen und RSVP vorbereitet."
        : isHu
          ? "Készítettünk egy interaktív digitális élményt a St. Oswald-plébániatemplomban tartandó szertartás, a Hetzendorf-kastélyban zajló fogadás, az öltözködési kód és az utazási információk minden részletével."
          : "We have created an interactive digital invitation with all details regarding our Holy Matrimony at St. Oswald, the evening celebration at Hetzendorf Palace, imperial dress code, travel guidance, and RSVP.",
    sealInstruction: isEs
      ? "✦ TOCA EL SELLO LACRADO PARA ABRIR TU INVITACIÓN ✦"
      : isDe
        ? "✦ SIEGEL ANKLICKEN, UM DIE EINLADUNG ZU ÖFFNEN ✦"
        : isHu
          ? "✦ KATTINTS A PECSÉTRE A MEGHÍVÓ MEGNYITÁSÁHOZ ✦"
          : "✦ CLICK THE WAX SEAL TO OPEN YOUR INVITATION ✦",
    seatsLabel: isEs
      ? `${maxGuests} ${maxGuests === 1 ? "plaza reservada" : "plazas reservadas"}${plusOneAllowed ? " (+1)" : ""}`
      : isDe
        ? `${maxGuests} ${maxGuests === 1 ? "Platz reserviert" : "Plätze reserviert"}${plusOneAllowed ? " (+1)" : ""}`
        : isHu
          ? `${maxGuests} hely fenntartva${plusOneAllowed ? " (+1)" : ""}`
          : `${maxGuests} ${maxGuests === 1 ? "seat reserved" : "seats reserved"}${plusOneAllowed ? " (+1)" : ""}`,
    openButtonText: isEs
      ? "Abrir Invitación Real →"
      : isDe
        ? "Zur königlichen Einladung →"
        : isHu
          ? "Meghívó megtekintése →"
          : "Open Royal Invitation →",
    churchName: isEs ? "Santa Misa y Matrimonio" : isDe ? "Kirchliche Trauung" : isHu ? "Templomi szertartás" : "Holy Matrimony",
    churchLocation: "Kath. Kirche St. Oswald · Wien 12",
    palaceName: isEs ? "Recepción Imperial y Banquete" : isDe ? "Kaiserlicher Empfang & Bankett" : isHu ? "Kastélyi fogadás és vacsora" : "Palace Reception & Banquet",
    palaceLocation: "Schloss Hetzendorf · Hetzendorfer Str. 79, 1120 Wien",
    dateText: isEs
      ? "Sábado, 2 de Octubre de 2027 · Viena, Austria"
      : isDe
        ? "Samstag, 2. Oktober 2027 · Wien, Österreich"
        : isHu
          ? "2027. október 2., szombat · Bécs, Ausztria"
          : "Saturday, October 2, 2027 · Vienna, Austria",
    privateNotice: isEs
      ? "Este enlace digital es personal e intransferible, reservado exclusivamente para tu fiesta."
      : isDe
        ? "Dieser persönliche Link ist vertraulich und exklusiv für Deine Begleitung bestimmt."
        : isHu
          ? "Ez a személyes link kizárólag a Te részedre készült."
          : "This personalized link is private and exclusively created for your party.",
    troubleLink: isEs ? "¿Problemas con el botón? Copia este enlace:" : isDe ? "Link manuell öffnen:" : isHu ? "Közvetlen link:" : "Having trouble with the button? Copy this link:",
    loveFromVienna: isEs
      ? "Enviado con amor desde Viena · theandyrubenwedding.website"
      : isDe
        ? "Mit Liebe gesendet aus Wien · theandyrubenwedding.website"
        : isHu
          ? "Szeretettel küldve Bécsből · theandyrubenwedding.website"
          : "Sent with love from Vienna · theandyrubenwedding.website",
    altFlowerSpray: isEs
      ? "Orquídeas Vienesas"
      : isDe
        ? "Wiener Orchideen"
        : isHu
          ? "Bécsi orchideák"
          : "Viennese Orchids",
    altMonogram: isEs
      ? "Sello de Cera de Ruben & Andrea"
      : isDe
        ? "Wachssiegel von Ruben & Andrea"
        : isHu
          ? "Ruben & Andrea Viaszpecsét"
          : "Ruben & Andrea Wax Seal",
    altBloom: isEs
      ? "Orquídea Imperial"
      : isDe
        ? "Kaiserliche Orchidee"
        : isHu
          ? "Császári orchidea"
          : "Imperial Orchid",
  };

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${normLang}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no" />
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5EFE7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Georgia, 'Times New Roman', serif; color: #2B2425; -webkit-font-smoothing: antialiased;">
  <!-- Main Outer Container -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F5EFE7; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Wrapper 600px Max -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto;">
          
          <!-- Top Royal Botanical Crest -->
          <tr>
            <td align="center" style="padding-bottom: 12px;">
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center">
                    <img src="${flowerSprayUrl}" width="138" height="105" alt="${t.altFlowerSpray}" style="display: block; border: 0; outline: none; margin: 0 auto; max-width: 138px; height: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top Royal Crown / Monogram Bar -->
          <tr>
            <td align="center" style="padding-bottom: 18px;">
              <div style="font-family: Georgia, 'Bodoni MT', serif; font-size: 11px; letter-spacing: 4px; color: #8C2836; text-transform: uppercase; font-weight: 600;">
                ✦ &nbsp; ${t.eyebrow} &nbsp; ✦
              </div>
            </td>
          </tr>

          <!-- THE ROYAL ENVELOPE CARD (Closed Flap with Clickable Wax Seal) -->
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF7F2; border-radius: 16px; overflow: hidden; border: 1px solid #DFD5C8; box-shadow: 0 12px 36px rgba(43, 36, 37, 0.09);">
                
                <!-- ENVELOPE TOP FLAP (Geometric closed triangular fold) -->
                <tr>
                  <td align="center" style="background: linear-gradient(180deg, #EDE3D5 0%, #E3D6C4 100%); padding: 32px 20px 0 20px; border-bottom: 1px solid #D5C7B2; position: relative;">
                    <!-- Flap Crease Lines -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center">
                          <div style="font-family: Georgia, serif; font-size: 13px; letter-spacing: 3px; color: #735D40; text-transform: uppercase; margin-bottom: 6px;">
                            Ruben &amp; Andrea
                          </div>
                          <div style="width: 60px; height: 1px; background: #C5B085; margin: 0 auto 18px auto;"></div>
                        </td>
                      </tr>
                    </table>

                    <!-- THE WAX SEAL BUTTON (Clickable Link) -->
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto; transform: translateY(32px); position: relative; z-index: 10;">
                      <tr>
                        <td align="center">
                          <a href="${invitationUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-decoration: none; outline: none;" title="${t.sealInstruction}">
                            <!-- Wax Seal Round Visual -->
                            <table border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate;">
                              <tr>
                                <td align="center" valign="middle" style="width: 104px; height: 104px; border-radius: 52px; background: radial-gradient(circle, #55664C 0%, #3F4D38 65%, #2D3728 100%); border: 3px solid #CCA468; box-shadow: 0 8px 24px rgba(45, 55, 40, 0.45); padding: 4px;">
                                  <img src="${sealImageUrl}" width="88" height="88" alt="${t.altMonogram}" style="display: block; border-radius: 44px; max-width: 88px; height: auto; border: 0;" />
                                </td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                      <!-- Seal Instruction Badge -->
                      <tr>
                        <td align="center" style="padding-top: 10px;">
                          <a href="${invitationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #8C2836; color: #FFFFFF; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-decoration: none; padding: 5px 14px; border-radius: 999px; box-shadow: 0 2px 8px rgba(140, 40, 54, 0.3); border: 1px solid #A83848;">
                            ${t.sealInstruction}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ENVELOPE FACE / INSCRIPTION SECTION -->
                <tr>
                  <td align="center" style="padding: 56px 36px 28px 36px; background-color: #FAF7F2;">
                    
                    <!-- Guest Allocation Badge -->
                    <div style="display: inline-block; background-color: #F0E9DF; border: 1px solid #D8CABE; color: #5B4E40; font-size: 11px; font-weight: 600; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 14px;">
                      ✦ &nbsp; ${t.seatsLabel} &nbsp; ✦
                    </div>

                    <div style="font-family: Georgia, serif; font-size: 13px; font-style: italic; color: #8A7A6D; margin-bottom: 4px;">
                      ${t.invitationFor}
                    </div>

                    <h1 style="font-family: Georgia, 'Bodoni MT', 'Didot', serif; font-size: 30px; font-weight: normal; color: #2B2425; margin: 0 0 16px 0; letter-spacing: 0.5px; line-height: 1.2;">
                      ${guestName}
                    </h1>

                    <!-- Bespoke Botanical Divider with Single Orchid Bloom -->
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 22px auto; width: 230px; max-width: 85%;">
                      <tr>
                        <td valign="middle" style="width: 85px;">
                          <div style="height: 1px; background: linear-gradient(90deg, transparent, #CCA468);"></div>
                        </td>
                        <td align="center" valign="middle" style="padding: 0 10px; width: 44px;">
                          <img src="${flowerBloomUrl}" width="36" height="40" alt="${t.altBloom}" style="display: block; border: 0; outline: none; margin: 0 auto; max-width: 36px; height: auto;" />
                        </td>
                        <td valign="middle" style="width: 85px;">
                          <div style="height: 1px; background: linear-gradient(90deg, #CCA468, transparent);"></div>
                        </td>
                      </tr>
                    </table>

                    <!-- Personal Invitation Lead -->
                    <p style="font-family: Georgia, serif; font-size: 16px; line-height: 1.65; color: #43393B; margin: 0 0 16px 0; max-width: 480px;">
                      ${personalMessage ? personalMessage : t.headline}
                    </p>

                    <p style="font-size: 13.5px; line-height: 1.6; color: #6E6062; margin: 0 0 28px 0; max-width: 490px;">
                      ${t.bodyDescription}
                    </p>

                    <!-- CEREMONY & RECEPTION HIGHLIGHT BOX -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E6DCD2; border-radius: 12px; padding: 22px 20px 20px 20px; margin-bottom: 28px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
                      <tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <!-- Dainty Orchid Flourish crowning the date -->
                          <div style="margin-bottom: 6px;">
                            <img src="${flowerSprayUrl}" width="68" height="52" alt="${t.altFlowerSpray}" style="display: block; border: 0; outline: none; margin: 0 auto; max-width: 68px; height: auto; opacity: 0.9;" />
                          </div>
                          <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 700; color: #8C2836; letter-spacing: 1px;">
                            ${t.dateText}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                              <td width="50%" valign="top" style="padding: 0 10px 0 0; border-right: 1px solid #EFE6DC;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #8C2836; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">
                                  15:00 CEST
                                </div>
                                <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 600; color: #2B2425; margin-bottom: 2px;">
                                  ${t.churchName}
                                </div>
                                <div style="font-size: 11.5px; color: #776A6C; line-height: 1.4;">
                                  ${t.churchLocation}
                                </div>
                              </td>
                              <td width="50%" valign="top" style="padding: 0 0 0 12px;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #8C2836; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">
                                  16:30 CEST
                                </div>
                                <div style="font-family: Georgia, serif; font-size: 14px; font-weight: 600; color: #2B2425; margin-bottom: 2px;">
                                  ${t.palaceName}
                                </div>
                                <div style="font-size: 11.5px; color: #776A6C; line-height: 1.4;">
                                  ${t.palaceLocation}
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- MAIN CTA BUTTON -->
                    <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 20px auto;">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, #8C2836 0%, #681C26 100%); border-radius: 999px; box-shadow: 0 6px 20px rgba(140, 40, 54, 0.35); border: 1px solid #A03342;">
                          <a href="${invitationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; text-decoration: none; padding: 15px 36px; border-radius: 999px;">
                            ${t.openButtonText}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Direct Link fallback -->
                    <p style="font-size: 11px; color: #8E8284; margin: 18px 0 0 0; word-break: break-all; line-height: 1.5;">
                      ${t.troubleLink}<br />
                      <a href="${invitationUrl}" style="color: #8C2836; text-decoration: underline;">${invitationUrl}</a>
                    </p>

                  </td>
                </tr>

                <!-- ENVELOPE FOOTER -->
                <tr>
                  <td align="center" style="background-color: #F2EBE1; padding: 22px 24px; text-align: center; border-top: 1px solid #DFD5C8; font-size: 11px; color: #7F736E; line-height: 1.5;">
                    <div style="margin-bottom: 10px;">
                      <img src="${flowerBloomUrl}" width="28" height="31" alt="${t.altBloom}" style="display: block; border: 0; outline: none; margin: 0 auto; max-width: 28px; height: auto; opacity: 0.85;" />
                    </div>
                    <strong style="color: #4C413D;">Ruben &amp; Andrea Wedding</strong> · Schloss Hetzendorf, Wien<br />
                    ${t.privateNotice}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Subtle Copyright / Unsubscribe Info -->
          <tr>
            <td align="center" style="padding-top: 18px; font-size: 11px; color: #9A8E90;">
              ${t.loveFromVienna}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
