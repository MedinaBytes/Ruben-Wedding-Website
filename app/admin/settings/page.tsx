import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateSiteSettings } from "@/app/actions/admin-settings";
import { SmtpTester } from "@/components/admin/smtp-tester";
import { ResendTester } from "@/components/admin/resend-tester";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings & System — Admin Portal",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const { resilientStore } = await import("@/lib/storage/resilient-store");
  const localSettings = resilientStore.getSettings();
  const { getDailyEmailBudget } = await import("@/lib/email/outbox");
  const emailBudget = getDailyEmailBudget();

  const client = createSupabaseAdminClient();
  let remoteRows: Array<{ key: string; value: unknown }> = [];
  try {
    const { data } = await client.from("site_settings").select("*");
    if (data) remoteRows = data as Array<{ key: string; value: unknown }>;
  } catch {}

  const s = new Map<string, unknown>();
  for (const [key, val] of Object.entries(localSettings)) {
    s.set(key, val);
  }
  for (const row of remoteRows) {
    s.set(row.key, row.value);
  }

  // Values from settings: Feature modules
  const enableDemoInvitation = typeof s.get("enableDemoInvitation") === "boolean"
    ? Boolean(s.get("enableDemoInvitation"))
    : resilientStore.isDemoEnabled();

  const enableCalendarSync = s.has("enableCalendarSync") ? Boolean(s.get("enableCalendarSync")) : true;
  const enableEnvelopeCalligraphy = s.has("enableEnvelopeCalligraphy") ? Boolean(s.get("enableEnvelopeCalligraphy")) : true;
  const enableMealSelection = s.has("enableMealSelection") ? Boolean(s.get("enableMealSelection")) : true;
  const enableTravelConcierge = s.has("enableTravelConcierge") ? Boolean(s.get("enableTravelConcierge")) : true;
  const enableDayOfTimeline = s.has("enableDayOfTimeline") ? Boolean(s.get("enableDayOfTimeline")) : false;
  const enableGuestbook = s.has("enableGuestbook") ? Boolean(s.get("enableGuestbook")) : false;
  const enableTablePlanner = s.has("enableTablePlanner") ? Boolean(s.get("enableTablePlanner")) : true;
  const enableQrCheckin = s.has("enableQrCheckin") ? Boolean(s.get("enableQrCheckin")) : false;
  const enableRsvpReminders = s.has("enableRsvpReminders") ? Boolean(s.get("enableRsvpReminders")) : true;

  // Gifts & Payment Methods
  const showGiftDetails = Boolean(s.get("showGiftDetails"));
  const enableBankTransfer = s.has("enableBankTransfer") ? Boolean(s.get("enableBankTransfer")) : true;
  const bankName = String(s.get("bankName") || "Erste Bank Österreich");
  const accountHolder = String(s.get("accountHolder") || "Ruben Quijada & Andrea Müllauer");
  const iban = String(s.get("iban") || "AT61 2011 1000 0000 0000");
  const bic = String(s.get("bic") || "GIBAATWWXXX");
  const giftNote = String(s.get("giftNote") || "Reference: Wedding Ruben & Andrea 2027");

  const enableRevolut = s.has("enableRevolut") ? Boolean(s.get("enableRevolut")) : true;
  const revolutTag = String(s.get("revolutTag") || "@ruben_andrea");
  const revolutNote = String(s.get("revolutNote") || "Instant fee-free transfer via Revolut or Revtag link");

  const enableWise = s.has("enableWise") ? Boolean(s.get("enableWise")) : true;
  const wiseTag = String(s.get("wiseTag") || "andrea.ruben@wise.com");
  const wiseNote = String(s.get("wiseNote") || "Ideal for international multi-currency transfers directly and securely");

  const enableCash = s.has("enableCash") ? Boolean(s.get("enableCash")) : true;
  const cashNote = String(s.get("cashNote") || "An imperial wishing well box will be placed at Schloss Hetzendorf during the welcome cocktail for guests who wish to hand-deliver their card.");

  // Private Address
  const showPrivateAddress = Boolean(s.get("showPrivateAddress"));
  const privateStreet = String(s.get("privateStreet") || "Schönbrunner Schloßstraße 47");
  const privateCity = String(s.get("privateCity") || "1120 Wien, Austria");
  const privateAccessNotes = String(s.get("privateAccessNotes") || "Timbre 'Ruben & Andrea' en el segundo piso");

  // Email API (Resend & SMTP)
  const resendApiKey = String(s.get("resendApiKey") || process.env.RESEND_API_KEY || "");
  const resendFromEmail = String(s.get("resendFromEmail") || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev");
  const resendFromName = String(s.get("resendFromName") || process.env.RESEND_FROM_NAME || "Ruben & Andrea");

  const smtpHost = String(s.get("smtpHost") || "");
  const smtpPort = String(s.get("smtpPort") || "587");
  const smtpSecure = Boolean(s.get("smtpSecure"));
  const smtpUser = String(s.get("smtpUser") || "");
  const smtpPass = String(s.get("smtpPass") || "");
  const smtpSenderEmail = String(s.get("smtpSenderEmail") || "");
  const smtpSenderName = String(s.get("smtpSenderName") || "Ruben & Andrea");

  // WhatsApp
  const whatsappTemplate = String(
    s.get("whatsappTemplate") ||
      "Dear {name}, Ruben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!\n\nPlease open your personalized digital invitation here: {url}",
  );
  const whatsappDelaySeconds = Number(s.get("whatsappDelaySeconds")) || 8;
  const whatsappCloudToken = String(s.get("whatsappCloudToken") || process.env.WHATSAPP_CLOUD_API_TOKEN || "");
  const whatsappPhoneNumberId = String(s.get("whatsappPhoneNumberId") || process.env.WHATSAPP_PHONE_NUMBER_ID || "");
  const whatsappGatewayUrl = String(s.get("whatsappGatewayUrl") || process.env.WHATSAPP_GATEWAY_URL || "");
  const whatsappGatewayKey = String(s.get("whatsappGatewayKey") || process.env.WHATSAPP_GATEWAY_KEY || "");

  // Spotify & General
  const spotifyPlaylistUrl = String(s.get("spotifyPlaylistUrl") || process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL || "");
  const contactPhone = String(s.get("contactPhone") || "+43 660 0000000");
  const contactEmail = String(s.get("contactEmail") || "wedding@theandyrubenwedding.website");

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
      {/* Header Intro */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "#8C2836" }}>
            Configuración del Sistema
          </span>
          <span style={{ color: "#C8BDC0" }}>·</span>
          <span style={{ fontSize: "0.76rem", color: "#7B6F71" }}>Schloss Hetzendorf 2027</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.1rem", margin: "0 0 0.5rem 0", color: "#2B2425", fontWeight: 600 }}>
          Ajustes Globales &amp; Medios de Pago
        </h1>
        <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.94rem", lineHeight: 1.5 }}>
          Gestiona los módulos interactivos de la invitación, las vías para entrega de regalos (Banco, Revolut, Wise y Efectivo), el servicio de correo con Resend y la privacidad de acceso.
        </p>
      </div>

      <form action={updateSiteSettings} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {/* Navigation Sticky Strip */}
        <div
          style={{
            position: "sticky",
            top: "68px",
            zIndex: 40,
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid #EAE2DB",
            borderRadius: "12px",
            padding: "0.6rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.6rem",
            boxShadow: "0 2px 10px rgba(45, 25, 30, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            {[
              { id: "modules", label: "Módulos" },
              { id: "gifts", label: "Regalos & Pagos" },
              { id: "email", label: "Resend & Correo" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "privacy", label: "Privacidad" },
              { id: "general", label: "Contacto & Spotify" },
              { id: "demo", label: "Modo Demo" },
            ].map((anchor) => (
              <a
                key={anchor.id}
                href={`#${anchor.id}`}
                style={{
                  fontSize: "0.78rem",
                  color: "#544648",
                  textDecoration: "none",
                  padding: "0.25rem 0.65rem",
                  background: "#FAF7F5",
                  border: "1px solid #ECE3DC",
                  borderRadius: "6px",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                {anchor.label}
              </a>
            ))}
          </div>

          <button
            type="submit"
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "7px",
              padding: "0.45rem 1.15rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(140, 40, 54, 0.22)",
            }}
          >
            Guardar Cambios
          </button>
        </div>

        {/* SECTION 1: Módulos Nupciales */}
        <section id="modules" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Módulos &amp; Experiencia de los Invitados</span>
              </h2>
              <p className="admin-card__desc">
                Habilita o deshabilita en vivo las características interactivas visibles para los invitados.
              </p>
            </div>
            <span style={{ fontSize: "0.74rem", background: "#F5F0EB", color: "#68585B", padding: "0.25rem 0.6rem", borderRadius: "999px", fontWeight: 600 }}>
              9 Controles
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "0.75rem" }}>
            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Sincronización de Calendario 1-Click</span>
                <span className="admin-switch-help">Apple Calendar, Google Calendar y descarga de archivo .ics</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableCalendarSync" defaultChecked={enableCalendarSync} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Caligrafía de Sobre 3D</span>
                <span className="admin-switch-help">Nombre de los invitados caligrafiado en el frontal del sobre</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableEnvelopeCalligraphy" defaultChecked={enableEnvelopeCalligraphy} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Selección de Menú &amp; Dietas</span>
                <span className="admin-switch-help">Opciones gastronómicas: carne, pescado, vegetariano, vegano e infantil</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableMealSelection" defaultChecked={enableMealSelection} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Concierge de Viaje &amp; Hoteles</span>
                <span className="admin-switch-help">Guía de transporte a Hetzendorf (Bim 62, S-Bahn) y hoteles recomendados</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableTravelConcierge" defaultChecked={enableTravelConcierge} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Modo Cronograma en Vivo</span>
                <span className="admin-switch-help">Rastreador en tiempo real del itinerario durante el día del evento</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableDayOfTimeline" defaultChecked={enableDayOfTimeline} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Libro de Firmas &amp; Deseos</span>
                <span className="admin-switch-help">Muro digital donde los invitados dedican mensajes y bendiciones</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableGuestbook" defaultChecked={enableGuestbook} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Asignación de Mesas Hetzendorf</span>
                <span className="admin-switch-help">Distribución de asientos en el salón imperial del palacio</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableTablePlanner" defaultChecked={enableTablePlanner} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row">
              <div className="admin-switch-info">
                <span className="admin-switch-label">Check-In con Escáner QR</span>
                <span className="admin-switch-help">Lectura con cámara móvil. Desmarcado opera con lista manual de invitados</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableQrCheckin" defaultChecked={enableQrCheckin} />
                <span className="admin-toggle-slider" />
              </div>
            </label>

            <label className="admin-switch-row" style={{ gridColumn: "1 / -1" }}>
              <div className="admin-switch-info">
                <span className="admin-switch-label">Recordatorios de RSVP en Lote</span>
                <span className="admin-switch-help">Disparo automatizado de recordatorios para invitados con confirmación pendiente</span>
              </div>
              <div className="admin-toggle">
                <input type="checkbox" name="enableRsvpReminders" defaultChecked={enableRsvpReminders} />
                <span className="admin-toggle-slider" />
              </div>
            </label>
          </div>
        </section>

        {/* SECTION 2: Mesa de Regalos & Multi-Método de Pago */}
        <section id="gifts" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect width="20" height="5" x="2" y="7" />
                  <line x1="12" x2="12" y1="22" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
                <span>Mesa de Regalos &amp; Opciones de Pago</span>
              </h2>
              <p className="admin-card__desc">
                Proporciona a tus invitados múltiples canales cómodos y sin fricción: Transferencia Bancaria, Revolut, Wise y Sobre en Mano.
              </p>
            </div>
            <span style={{ fontSize: "0.74rem", background: "#EBF5EA", color: "#245A22", border: "1px solid #CCE5C8", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: 700 }}>
              4 Formas de Pago
            </span>
          </div>

          {/* Master Switch */}
          <label className="admin-switch-row" style={{ marginBottom: "1.25rem", background: "#FBF7F5", border: "1px solid #E6DDD5" }}>
            <div className="admin-switch-info">
              <span className="admin-switch-label">Habilitar Pestañas de Pago de Regalos en la Web</span>
              <span className="admin-switch-help">Al desactivarlo, se muestra solo la nota de cortesía sin desplegar cuentas ni métodos</span>
            </div>
            <div className="admin-toggle">
              <input type="checkbox" name="showGiftDetails" defaultChecked={showGiftDetails} />
              <span className="admin-toggle-slider" />
            </div>
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* 1. Banco */}
            <div style={{ background: "#FAF8F6", border: "1px solid #EAE2DB", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.92rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableBankTransfer" defaultChecked={enableBankTransfer} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>Método 1: Transferencia Bancaria Europea (SEPA)</span>
                </label>
                <span style={{ fontSize: "0.72rem", color: "#7B6F71", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>IBAN / BIC</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem", marginBottom: "0.85rem" }}>
                <div className="admin-input-group">
                  <label className="admin-label">Banco</label>
                  <input name="bankName" defaultValue={bankName} placeholder="Erste Bank Österreich" className="admin-input" />
                </div>
                <div className="admin-input-group">
                  <label className="admin-label">Titular de la Cuenta</label>
                  <input name="accountHolder" defaultValue={accountHolder} placeholder="Ruben Quijada & Andrea Müllauer" className="admin-input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                <div className="admin-input-group">
                  <label className="admin-label">IBAN</label>
                  <input name="iban" defaultValue={iban} placeholder="AT61 2011 1000 0000 0000" className="admin-input" style={{ fontFamily: "monospace" }} />
                </div>
                <div className="admin-input-group">
                  <label className="admin-label">BIC / SWIFT</label>
                  <input name="bic" defaultValue={bic} placeholder="GIBAATWWXXX" className="admin-input" style={{ fontFamily: "monospace" }} />
                </div>
              </div>

              <div className="admin-input-group">
                <label className="admin-label">Concepto / Referencia Sugerida para el Invitado</label>
                <input name="giftNote" defaultValue={giftNote} placeholder="Referencia: Boda Ruben & Andrea 2027" className="admin-input" />
              </div>
            </div>

            {/* 2. Revolut */}
            <div style={{ background: "#FAF8F6", border: "1px solid #EAE2DB", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.92rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableRevolut" defaultChecked={enableRevolut} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>Método 2: Revolut (@Revtag &amp; Enlace Instantáneo)</span>
                </label>
                <span style={{ fontSize: "0.72rem", color: "#1E58A4", background: "#EBF3FC", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                  Instantáneo
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "0.85rem" }}>
                <div className="admin-input-group">
                  <label className="admin-label">Revtag o Enlace Revolut.me</label>
                  <input name="revolutTag" defaultValue={revolutTag} placeholder="@ruben_andrea o https://revolut.me/ruben_andrea" className="admin-input" style={{ fontFamily: "monospace" }} />
                  <span style={{ fontSize: "0.72rem", color: "#8A7E80", marginTop: "0.2rem" }}>Ejemplo: <code>@ruben_andrea</code> o enlace completo</span>
                </div>
                <div className="admin-input-group">
                  <label className="admin-label">Instrucciones / Nota Revolut</label>
                  <input name="revolutNote" defaultValue={revolutNote} placeholder="Transferencia instantánea sin comisiones mediante Revolut o enlace Revtag" className="admin-input" />
                </div>
              </div>
            </div>

            {/* 3. Wise */}
            <div style={{ background: "#FAF8F6", border: "1px solid #EAE2DB", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.92rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableWise" defaultChecked={enableWise} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>Método 3: Wise (Transferencias Multidivisa Internacionales)</span>
                </label>
                <span style={{ fontSize: "0.72rem", color: "#1F6A44", background: "#E8F7ED", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                  Internacional
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "0.85rem" }}>
                <div className="admin-input-group">
                  <label className="admin-label">Wise Email / Enlace de Pago</label>
                  <input name="wiseTag" defaultValue={wiseTag} placeholder="andrea.ruben@wise.com o https://wise.com/pay/me/..." className="admin-input" />
                  <span style={{ fontSize: "0.72rem", color: "#8A7E80", marginTop: "0.2rem" }}>Correo vinculado a tu cuenta Wise o URL de cobro</span>
                </div>
                <div className="admin-input-group">
                  <label className="admin-label">Instrucciones / Nota Wise</label>
                  <input name="wiseNote" defaultValue={wiseNote} placeholder="Ideal para transferencias internacionales multidivisa directas y seguras" className="admin-input" />
                </div>
              </div>
            </div>

            {/* 4. Cash / Sobre */}
            <div style={{ background: "#FAF8F6", border: "1px solid #EAE2DB", borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.92rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableCash" defaultChecked={enableCash} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>Método 4: Sobre en Mano / Efectivo (Palacio Hetzendorf)</span>
                </label>
                <span style={{ fontSize: "0.72rem", color: "#8C2836", background: "#FDF2F4", padding: "0.15rem 0.5rem", borderRadius: "4px", fontWeight: 700 }}>
                  En Persona
                </span>
              </div>

              <div className="admin-input-group">
                <label className="admin-label">Instrucciones del Buzón Nupcial en el Palacio</label>
                <textarea
                  name="cashNote"
                  rows={2}
                  defaultValue={cashNote}
                  placeholder="Dispondremos de un buzón imperial nupcial en el Palacio Hetzendorf durante el cóctel de bienvenida..."
                  className="admin-textarea"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Servicio de Correo Electrónico (Resend & SMTP) */}
        <section id="email" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Servicio de Correo Electrónico (Resend API &amp; SMTP)</span>
              </h2>
              <p className="admin-card__desc">
                Configuración del motor de email para despachar invitaciones oficiales con plantilla nupcial y sello en cera interactivo.
              </p>
            </div>
            {resendApiKey ? (
              <span style={{ fontSize: "0.75rem", background: "#E8F5E9", color: "#1B5E20", border: "1px solid #C8E6C9", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: 700 }}>
                ● Resend Configurado
              </span>
            ) : (
              <span style={{ fontSize: "0.75rem", background: "#FFF8E1", color: "#8D6E00", border: "1px solid #FFE082", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: 600 }}>
                ○ API Key Pendiente
              </span>
            )}
          </div>

          <div style={{ marginBottom: "1rem" }} className="admin-input-group">
            <label className="admin-label">
              Resend API Key (<code style={{ color: "#8C2836" }}>re_...</code>)
            </label>
            <input
              name="resendApiKey"
              type="password"
              defaultValue={resendApiKey}
              placeholder="re_123456789_abcdef..."
              className="admin-input"
              style={{ fontFamily: "monospace" }}
            />
            <span style={{ fontSize: "0.74rem", color: "#7B6F71", marginTop: "0.25rem" }}>
              Obtén tu API key gratuita en <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "#8C2836", textDecoration: "underline" }}>resend.com/api-keys</a>
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1.25rem" }}>
            <div className="admin-input-group">
              <label className="admin-label">Email de Envío (Remitente)</label>
              <input
                name="resendFromEmail"
                type="email"
                defaultValue={resendFromEmail}
                placeholder="onboarding@resend.dev o wedding@theandyrubenwedding.website"
                className="admin-input"
              />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Nombre del Remitente</label>
              <input
                name="resendFromName"
                defaultValue={resendFromName}
                placeholder="Ruben & Andrea"
                className="admin-input"
              />
            </div>
          </div>

          {/* Daily Email Budget Meter (Resend Free Tier Guardrail: 100/day UTC) */}
          <div style={{ background: "#FAF7F5", border: "1px solid #E6DDD5", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1rem" }}>📊</span>
                <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#2B2425" }}>
                  Presupuesto Diario de Correo (Resend Free Tier: 100/día UTC)
                </span>
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: emailBudget.sentToday > 90 ? "#B91C1C" : "#1B5E20" }}>
                {emailBudget.sentToday} / {emailBudget.dailyCap} enviados hoy
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: "7px", background: "#E8E0D9", borderRadius: "999px", overflow: "hidden", marginBottom: "0.6rem" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (emailBudget.sentToday / emailBudget.dailyCap) * 100)}%`,
                  background: emailBudget.sentToday > 90 ? "#DC2626" : "#8C2836",
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "#6A5D60" }}>
              <span>
                Cupo disponible para campañas / recordatorios: <strong>{emailBudget.remainingCampaign}</strong>
              </span>
              <span>
                Reserva transaccional protegida (RSVPs): <strong>{emailBudget.reserveTransactional}</strong>
              </span>
            </div>
          </div>

          {/* Interactive Tester */}
          <ResendTester
            defaultRecipient={contactEmail || "ruben.andrea.wedding@gmail.com"}
            initialConfigured={Boolean(resendApiKey)}
          />

          {/* Fallback SMTP */}
          <div style={{ borderTop: "1px solid #F0E9E3", paddingTop: "1.25rem", marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425" }}>
              Servidor SMTP de Respaldo (Opcional)
            </h3>
            <p style={{ color: "#726567", fontSize: "0.8rem", lineHeight: 1.4, marginBottom: "0.85rem" }}>
              Utiliza un servidor SMTP convencional (Gmail, Amazon SES, Brevo) como contingencia.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div className="admin-input-group">
                <label className="admin-label">Servidor Host</label>
                <input name="smtpHost" defaultValue={smtpHost} placeholder="smtp.resend.com o smtp.gmail.com" className="admin-input" />
              </div>
              <div className="admin-input-group">
                <label className="admin-label">Puerto</label>
                <input name="smtpPort" defaultValue={smtpPort} placeholder="587 o 465" className="admin-input" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div className="admin-input-group">
                <label className="admin-label">Usuario SMTP</label>
                <input name="smtpUser" defaultValue={smtpUser} placeholder="usuario@dominio.com" className="admin-input" />
              </div>
              <div className="admin-input-group">
                <label className="admin-label">Contraseña</label>
                <input name="smtpPass" type="password" defaultValue={smtpPass} placeholder="••••••••••••" className="admin-input" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.85rem" }}>
              <div className="admin-input-group">
                <label className="admin-label">Nombre</label>
                <input name="smtpSenderName" defaultValue={smtpSenderName} placeholder="Ruben & Andrea" className="admin-input" />
              </div>
              <div className="admin-input-group">
                <label className="admin-label">Email Remitente</label>
                <input name="smtpSenderEmail" type="email" defaultValue={smtpSenderEmail} placeholder="wedding@theandyrubenwedding.website" className="admin-input" />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.84rem", color: "#44383A", cursor: "pointer", marginBottom: "1rem" }}>
              <input type="checkbox" name="smtpSecure" defaultChecked={smtpSecure} style={{ width: "16px", height: "16px", accentColor: "#8C2836" }} />
              <span>Usar conexión segura SSL/TLS (activar para puerto 465)</span>
            </label>

            <SmtpTester defaultRecipient={contactEmail || "ruben.andrea.wedding@gmail.com"} />
          </div>
        </section>

        {/* SECTION 4: Comunicaciones WhatsApp */}
        <section id="whatsapp" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>Comunicaciones WhatsApp</span>
              </h2>
              <p className="admin-card__desc">
                Distribución de enlaces de invitación con personalización de nombres y enlaces únicos protegidos.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }} className="admin-input-group">
            <label className="admin-label">Intervalo de Espera Entre Envíos (Protección Anti-Bloqueo)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <input
                name="whatsappDelaySeconds"
                type="number"
                min={3}
                max={30}
                defaultValue={whatsappDelaySeconds}
                className="admin-input"
                style={{ width: "90px" }}
              />
              <span style={{ fontSize: "0.84rem", color: "#6A5D60" }}>segundos por mensaje (Recomendado: 6 a 10s)</span>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }} className="admin-input-group">
            <label className="admin-label">
              Plantilla de Mensaje (variables disponibles: <code>&#123;name&#125;</code> y <code>&#123;url&#125;</code>)
            </label>
            <textarea
              name="whatsappTemplate"
              rows={4}
              defaultValue={whatsappTemplate}
              className="admin-textarea"
            />
          </div>

          {/* Vercel Cloud Options */}
          <div style={{ borderTop: "1px solid #F0E9E3", paddingTop: "1.25rem", marginTop: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 0.35rem 0", color: "#2B2425" }}>
              Meta WhatsApp Cloud API (Oficial)
            </h3>
            <p style={{ color: "#726567", fontSize: "0.8rem", lineHeight: 1.4, marginBottom: "0.85rem" }}>
              Para envíos en background en Vercel Serverless sin mantener la ventana del navegador abierta.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
              <div className="admin-input-group">
                <label className="admin-label">Phone Number ID de Meta</label>
                <input name="whatsappPhoneNumberId" defaultValue={whatsappPhoneNumberId} placeholder="e.g. 109283746591023" className="admin-input" />
              </div>
              <div className="admin-input-group">
                <label className="admin-label">Permanent Access Token</label>
                <input name="whatsappCloudToken" type="password" defaultValue={whatsappCloudToken} placeholder="EAAGm..." className="admin-input" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.85rem" }}>
              <div className="admin-input-group">
                <label className="admin-label">Gateway URL Alternativa</label>
                <input name="whatsappGatewayUrl" type="url" defaultValue={whatsappGatewayUrl} placeholder="https://gateway.example.com/send" className="admin-input" />
              </div>
              <div className="admin-input-group">
                <label className="admin-label">Gateway API Key</label>
                <input name="whatsappGatewayKey" type="password" defaultValue={whatsappGatewayKey} placeholder="••••••••••••" className="admin-input" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Privacidad & Ubicación */}
        <section id="privacy" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Privacidad &amp; Dirección Privada</span>
              </h2>
              <p className="admin-card__desc">
                Control estricto de visibilidad del domicilio personal de los novios frente a los invitados.
              </p>
            </div>
          </div>

          <label className="admin-switch-row" style={{ marginBottom: "1rem" }}>
            <div className="admin-switch-info">
              <span className="admin-switch-label">Mostrar Dirección Privada en la Sección de Alojamiento</span>
              <span className="admin-switch-help">Si está desactivado, solo se mostrará la información de los hoteles y el palacio</span>
            </div>
            <div className="admin-toggle">
              <input type="checkbox" name="showPrivateAddress" defaultChecked={showPrivateAddress} />
              <span className="admin-toggle-slider" />
            </div>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
            <div className="admin-input-group">
              <label className="admin-label">Calle y Número</label>
              <input name="privateStreet" defaultValue={privateStreet} placeholder="Schönbrunner Schloßstraße 47" className="admin-input" />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Ciudad y Código Postal</label>
              <input name="privateCity" defaultValue={privateCity} placeholder="1120 Wien, Austria" className="admin-input" />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-label">Instrucciones de Acceso / Timbre</label>
            <input name="privateAccessNotes" defaultValue={privateAccessNotes} placeholder="Timbre 'Ruben & Andrea' en el segundo piso" className="admin-input" />
          </div>
        </section>

        {/* SECTION 6: Spotify & Contacto */}
        <section id="general" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                <span>Spotify Playlist &amp; Contacto Oficial</span>
              </h2>
              <p className="admin-card__desc">
                Enlace a la playlist compartida de la boda y canales de soporte directo para dudas de los invitados.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }} className="admin-input-group">
            <label className="admin-label">URL de la Playlist de Spotify de la Boda</label>
            <input
              name="spotifyPlaylistUrl"
              type="url"
              defaultValue={spotifyPlaylistUrl}
              placeholder="https://open.spotify.com/playlist/..."
              className="admin-input"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            <div className="admin-input-group">
              <label className="admin-label">Teléfono de Contacto Concierge</label>
              <input name="contactPhone" defaultValue={contactPhone} placeholder="+43 660 0000000" className="admin-input" />
            </div>
            <div className="admin-input-group">
              <label className="admin-label">Email de Contacto</label>
              <input name="contactEmail" type="email" defaultValue={contactEmail} placeholder="wedding@theandyrubenwedding.website" className="admin-input" />
            </div>
          </div>
        </section>

        {/* SECTION 7: Modo Demo & Seguridad */}
        <section id="demo" className="admin-card" style={{ scrollMarginTop: "135px" }}>
          <div className="admin-card__head">
            <div>
              <h2 className="admin-card__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C2836" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Modo Demo &amp; Entorno de Producción</span>
              </h2>
              <p className="admin-card__desc">
                Controla si la invitación pública de demostración <code>Sarah &amp; Guest (Demo)</code> en <code>/i/demo</code> está activa.
              </p>
            </div>
          </div>

          <label className="admin-switch-row">
            <div className="admin-switch-info">
              <span className="admin-switch-label">Habilitar Invitación Demo Pública (<code>/i/demo</code>)</span>
              <span className="admin-switch-help">Permite probar libremente sobre, música y formularios sin alterar datos de invitados reales. Desactivar antes de la boda.</span>
            </div>
            <div className="admin-toggle">
              <input
                type="checkbox"
                id="enableDemoInvitation"
                name="enableDemoInvitation"
                defaultChecked={enableDemoInvitation}
              />
              <span className="admin-toggle-slider" />
            </div>
          </label>
        </section>

        {/* Bottom Floating Sticky Save Bar */}
        <div className="admin-save-bar">
          <div>
            <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#2B2425", display: "block" }}>
              ¿Listo para publicar los cambios?
            </span>
            <span style={{ fontSize: "0.78rem", color: "#7B6F71" }}>
              Los cambios se sincronizan inmediatamente en la base de datos y la invitación web.
            </span>
          </div>

          <button
            type="submit"
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "8px",
              padding: "0.7rem 2rem",
              fontSize: "0.92rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(140, 40, 54, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            Guardar Todos los Ajustes
          </button>
        </div>
      </form>
    </div>
  );
}
