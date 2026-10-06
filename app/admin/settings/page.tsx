import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateSiteSettings } from "@/app/actions/admin-settings";
import { SmtpTester } from "@/components/admin/smtp-tester";
import { ResendTester } from "@/components/admin/resend-tester";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site Settings & Integrations — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  const { resilientStore } = await import("@/lib/storage/resilient-store");
  const localSettings = resilientStore.getSettings();

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
  const giftNote = String(s.get("giftNote") || "Referencia: Boda Ruben & Andrea 2027");

  const enableRevolut = s.has("enableRevolut") ? Boolean(s.get("enableRevolut")) : true;
  const revolutTag = String(s.get("revolutTag") || "@ruben_andrea");
  const revolutNote = String(s.get("revolutNote") || "Transferencia instantánea sin comisiones mediante Revolut o enlace Revtag");

  const enableWise = s.has("enableWise") ? Boolean(s.get("enableWise")) : true;
  const wiseTag = String(s.get("wiseTag") || "andrea.ruben@wise.com");
  const wiseNote = String(s.get("wiseNote") || "Ideal para transferencias internacionales multidivisa directas y seguras");

  const enableCash = s.has("enableCash") ? Boolean(s.get("enableCash")) : true;
  const cashNote = String(s.get("cashNote") || "Dispondremos de un buzón imperial nupcial en el Palacio Hetzendorf durante el cóctel de bienvenida para quienes deseen entregar su sobre en mano con sus mejores deseos.");

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
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "2.2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Ajustes del Sistema &amp; Integraciones
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.95rem" }}>
            Organización central de módulos nupciales, mesa de regalos con múltiples opciones de pago (Banco, Revolut, Wise, Efectivo), correo Resend, WhatsApp y privacidad.
          </p>
        </div>
      </div>

      <form action={updateSiteSettings} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Quick Jump Bar & Sticky Top Save */}
        <div
          style={{
            position: "sticky",
            top: "60px",
            zIndex: 40,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid #E8DFD8",
            borderRadius: "10px",
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
          }}
        >
          {/* Section Anchor Shortcuts */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8A7D80", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "0.25rem" }}>
              Saltar a:
            </span>
            {[
              { id: "modules", label: "⚡ Módulos" },
              { id: "gifts", label: "🎁 Regalos & Pagos" },
              { id: "email", label: "✉️ Resend & SMTP" },
              { id: "whatsapp", label: "💬 WhatsApp" },
              { id: "stay", label: "🏠 Privacidad" },
              { id: "general", label: "🎵 Contacto" },
              { id: "demo", label: "🛡️ Demo" },
            ].map((anchor) => (
              <a
                key={anchor.id}
                href={`#${anchor.id}`}
                style={{
                  fontSize: "0.8rem",
                  color: "#544648",
                  textDecoration: "none",
                  padding: "0.25rem 0.55rem",
                  background: "#FAF7F5",
                  border: "1px solid #ECE3DC",
                  borderRadius: "5px",
                  fontWeight: 500,
                  transition: "all 0.15s ease",
                }}
              >
                {anchor.label}
              </a>
            ))}
          </div>

          {/* Quick Save Button */}
          <button
            type="submit"
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.45rem 1.15rem",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(140, 40, 54, 0.2)",
            }}
          >
            Guardar Cambios
          </button>
        </div>

        {/* =========================================================================
            SECTION 1: Módulos & Experiencia Nupcial
            ========================================================================= */}
        <div id="modules" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>⚡</span>
            <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Módulos &amp; Experiencia Nupcial
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Activa o desactiva en tiempo real las herramientas interactivas del sitio web según la etapa de la boda.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableCalendarSync" defaultChecked={enableCalendarSync} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>📅 Sincronización de Calendario 1-Click</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Apple Calendar, Google Calendar y descarga .ics</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableEnvelopeCalligraphy" defaultChecked={enableEnvelopeCalligraphy} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🖋️ Caligrafía de Sobre 3D</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Nombre del invitado caligrafiado en el frontal del sobre interactivo</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableMealSelection" defaultChecked={enableMealSelection} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🍽️ Selección de Menú &amp; Alergias</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Opciones gourmet: ternera vienesa, pescado alpino, vegetariano, vegano e infantil</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableTravelConcierge" defaultChecked={enableTravelConcierge} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🏰 Concierge de Viaje &amp; Hoteles en Viena</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Guía de transporte a Hetzendorf (Bim 62, S-Bahn) y hoteles en Meidling</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableDayOfTimeline" defaultChecked={enableDayOfTimeline} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>⏱️ Modo Cronograma en Vivo</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Rastreador dinámico paso a paso durante el día del evento en Viena</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableGuestbook" defaultChecked={enableGuestbook} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>💌 Libro de Firmas &amp; Deseos</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Muro interactivo donde los invitados dejan bendiciones y mensajes</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableTablePlanner" defaultChecked={enableTablePlanner} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🪑 Asignación de Mesas Hetzendorf</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Gestor de mesas del salón del palacio para ubicar a confirmados</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableQrCheckin" defaultChecked={enableQrCheckin} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>
                  📲 Check-In con Escáner QR <span style={{ fontSize: "0.72rem", background: "#F3E8FF", color: "#6B21A8", padding: "0.1rem 0.4rem", borderRadius: "4px", marginLeft: "0.3rem", fontWeight: 700 }}>Roadmap</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>
                  Lectura con cámara móvil o webcam. Dejar desmarcado para operar con lista de puerta manual.
                </div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer", gridColumn: "1 / -1" }}>
              <input type="checkbox" name="enableRsvpReminders" defaultChecked={enableRsvpReminders} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🔔 Recordatorios de RSVP en Lote</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Envío masivo con 1 clic para invitados con respuesta pendiente vía WhatsApp o Correo</div>
              </div>
            </label>
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: Mesa de Regalos & Opciones de Pago (Bank, Revolut, Wise, Cash)
            ========================================================================= */}
        <div id="gifts" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>🎁</span>
              <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
                Mesa de Regalos &amp; Opciones de Pago
              </h2>
            </div>
            <span style={{ fontSize: "0.78rem", background: "#FFF8E1", color: "#8D6E00", border: "1px solid #FFE082", padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: 600 }}>
              Multi-Método: Banco · Revolut · Wise · Efectivo
            </span>
          </div>

          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Configura las distintas vías para que los invitados puedan entregar sus regalos: transferencia SEPA tradicional, enlaces instantáneos de Revolut, transferencias internacionales Wise, o sobre nupcial en mano en el Palacio de Hetzendorf.
          </p>

          {/* Master Toggle */}
          <div style={{ background: "#FAF7F5", border: "1px solid #E4DBD3", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.92rem", fontWeight: 600, color: "#2B2425", cursor: "pointer" }}>
              <input type="checkbox" name="showGiftDetails" defaultChecked={showGiftDetails} style={{ width: "19px", height: "19px", accentColor: "#8C2836" }} />
              <span>Habilitar sección interactiva de detalles de regalo y medios de pago en la web</span>
            </label>
            <div style={{ fontSize: "0.78rem", color: "#776A6C", marginTop: "0.35rem", marginLeft: "1.8rem" }}>
              Si está desmarcado, se mantiene la nota de cortesía general sin desplegar las pestañas de pago.
            </div>
          </div>

          {/* Payment Method Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Card A: Transferencia Bancaria SEPA */}
            <div style={{ border: "1px solid #ECE4DD", borderRadius: "8px", padding: "1.25rem", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableBankTransfer" defaultChecked={enableBankTransfer} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>🏦 Método 1: Transferencia Bancaria (IBAN / SEPA)</span>
                </label>
                <span style={{ fontSize: "0.75rem", color: "#6A5D60" }}>Transferencia europea tradicional</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Entidad Bancaria</label>
                  <input name="bankName" defaultValue={bankName} placeholder="e.g. Erste Bank Österreich" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Titular de la Cuenta</label>
                  <input name="accountHolder" defaultValue={accountHolder} placeholder="Ruben Quijada & Andrea Müllauer" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>IBAN</label>
                  <input name="iban" defaultValue={iban} placeholder="AT61 2011 1000 0000 0000" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "monospace" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>BIC / SWIFT</label>
                  <input name="bic" defaultValue={bic} placeholder="GIBAATWWXXX" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "monospace" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Concepto / Referencia para el Invitado</label>
                <input name="giftNote" defaultValue={giftNote} placeholder="Referencia: Boda Ruben & Andrea 2027" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
            </div>

            {/* Card B: Revolut Pay */}
            <div style={{ border: "1px solid #ECE4DD", borderRadius: "8px", padding: "1.25rem", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableRevolut" defaultChecked={enableRevolut} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>⚡ Método 2: Revolut Pay (Instantáneo &amp; Revtag)</span>
                </label>
                <span style={{ fontSize: "0.75rem", color: "#6A5D60" }}>Sin comisiones / Pago instantáneo</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                    Revtag o Enlace Revolut.me
                  </label>
                  <input
                    name="revolutTag"
                    defaultValue={revolutTag}
                    placeholder="@ruben_andrea o https://revolut.me/ruben_andrea"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "monospace" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#8A7E80", marginTop: "0.25rem", display: "block" }}>
                    Ejemplo: <code>@ruben_andrea</code> o tu link <code>revolut.me/...</code>
                  </span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                    Instrucciones / Nota Revolut para Invitados
                  </label>
                  <input
                    name="revolutNote"
                    defaultValue={revolutNote}
                    placeholder="Transferencia instantánea sin comisiones mediante Revolut o enlace Revtag"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Card C: Wise (Transferencias Internacionales) */}
            <div style={{ border: "1px solid #ECE4DD", borderRadius: "8px", padding: "1.25rem", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableWise" defaultChecked={enableWise} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>🌐 Método 3: Wise (TransferWise / Internacional)</span>
                </label>
                <span style={{ fontSize: "0.75rem", color: "#6A5D60" }}>Ideal para invitados internacionales (USD, GBP, etc.)</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                    Wise Email / Wise Tag / Enlace
                  </label>
                  <input
                    name="wiseTag"
                    defaultValue={wiseTag}
                    placeholder="andrea.ruben@wise.com o https://wise.com/pay/me/..."
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#8A7E80", marginTop: "0.25rem", display: "block" }}>
                    Email registrado en Wise o enlace directo de pago.
                  </span>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                    Instrucciones / Nota Wise
                  </label>
                  <input
                    name="wiseNote"
                    defaultValue={wiseNote}
                    placeholder="Ideal para transferencias internacionales multidivisa directas y seguras"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Card D: Sobre en Mano / Efectivo (Palacio Hetzendorf) */}
            <div style={{ border: "1px solid #ECE4DD", borderRadius: "8px", padding: "1.25rem", background: "#FFFFFF" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.95rem", color: "#2B2425" }}>
                  <input type="checkbox" name="enableCash" defaultChecked={enableCash} style={{ width: "17px", height: "17px", accentColor: "#8C2836" }} />
                  <span>✉️ Método 4: Sobre en Mano / Efectivo (Palacio Hetzendorf)</span>
                </label>
                <span style={{ fontSize: "0.75rem", color: "#6A5D60" }}>Tradición nupcial imperial</span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                  Instrucciones del Buzón de Sobres en el Palacio
                </label>
                <textarea
                  name="cashNote"
                  rows={2}
                  defaultValue={cashNote}
                  placeholder="Dispondremos de un buzón imperial nupcial en el Palacio Hetzendorf durante el cóctel de bienvenida para quienes deseen entregar su sobre en mano con sus mejores deseos."
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem", lineHeight: 1.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: Servicio de Correo (Resend API & SMTP)
            ========================================================================= */}
        <div id="email" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>✉</span>
              <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
                Servicio de Correo (Resend API &amp; SMTP)
              </h2>
            </div>
            {resendApiKey ? (
              <span style={{ fontSize: "0.75rem", background: "#E8F5E9", color: "#1B5E20", border: "1px solid #C8E6C9", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: 700 }}>
                ● Resend API Configurado
              </span>
            ) : (
              <span style={{ fontSize: "0.75rem", background: "#FFF8E1", color: "#8D6E00", border: "1px solid #FFE082", padding: "0.25rem 0.65rem", borderRadius: "999px", fontWeight: 600 }}>
                ○ API Key Requerida
              </span>
            )}
          </div>

          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Envío oficial de invitaciones digitales nupciales con plantilla de sobre cerrado y sello interactivo de cera botánica en oliva.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
              Resend API Key (<code style={{ fontSize: "0.8rem", color: "#8C2836" }}>re_...</code>)
            </label>
            <input
              name="resendApiKey"
              type="password"
              defaultValue={resendApiKey}
              placeholder="re_123456789_abcdef..."
              style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "monospace" }}
            />
            <span style={{ display: "block", fontSize: "0.74rem", color: "#8A7E80", marginTop: "0.3rem" }}>
              Obtén tu clave gratuita en <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{ color: "#8C2836", textDecoration: "underline" }}>resend.com/api-keys</a>.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                Email de Envío (Remitente)
              </label>
              <input
                name="resendFromEmail"
                type="email"
                defaultValue={resendFromEmail}
                placeholder="onboarding@resend.dev o wedding@theandyrubenwedding.website"
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
                Nombre del Remitente
              </label>
              <input
                name="resendFromName"
                defaultValue={resendFromName}
                placeholder="Ruben & Andrea"
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }}
              />
            </div>
          </div>

          <ResendTester
            defaultRecipient={contactEmail || "ruben.andrea.wedding@gmail.com"}
            initialConfigured={Boolean(resendApiKey)}
          />

          {/* Secondary SMTP Section */}
          <div style={{ borderTop: "1px solid #EFEAE6", paddingTop: "1.25rem", marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.5rem 0", color: "#2B2425" }}>
              Configuración Alternativa de Servidor SMTP (Opcional)
            </h3>
            <p style={{ color: "#6A5D60", fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "1rem" }}>
              Servidor SMTP de respaldo si no deseas usar la API de Resend (Gmail, SendGrid, Amazon SES, Brevo).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Servidor SMTP (Host)</label>
                <input name="smtpHost" defaultValue={smtpHost} placeholder="smtp.resend.com o smtp.gmail.com" style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Puerto</label>
                <input name="smtpPort" defaultValue={smtpPort} placeholder="587 o 465" style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Usuario SMTP</label>
                <input name="smtpUser" defaultValue={smtpUser} placeholder="resend o usuario@tudominio.com" style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Contraseña / App Password</label>
                <input name="smtpPass" type="password" defaultValue={smtpPass} placeholder="••••••••••••" style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Nombre del Remitente</label>
                <input name="smtpSenderName" defaultValue={smtpSenderName} placeholder="Ruben & Andrea" style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Email del Remitente</label>
                <input name="smtpSenderEmail" type="email" defaultValue={smtpSenderEmail} placeholder="wedding@theandyrubenwedding.website" style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "#44383A", cursor: "pointer", marginBottom: "1rem" }}>
              <input type="checkbox" name="smtpSecure" defaultChecked={smtpSecure} style={{ width: "16px", height: "16px" }} />
              <span>Usar conexión segura SSL/TLS (habilitar para puerto 465)</span>
            </label>

            <SmtpTester defaultRecipient={contactEmail || "ruben.andrea.wedding@gmail.com"} />
          </div>
        </div>

        {/* =========================================================================
            SECTION 4: WhatsApp Automated Distribution
            ========================================================================= */}
        <div id="whatsapp" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>💬</span>
            <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              WhatsApp Automated Distribution
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Envío seguro de invitaciones: genera mensajes con nombres personalizados y enlaces de acceso directos.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
              Intervalo de Espera Entre Envíos (Protección Anti-Spam)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                name="whatsappDelaySeconds"
                type="number"
                min={3}
                max={30}
                defaultValue={whatsappDelaySeconds}
                style={{ width: "90px", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }}
              />
              <span style={{ fontSize: "0.85rem", color: "#6A5D60" }}>segundos (Recomendado: 6–10s)</span>
            </div>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
              Plantilla de Mensaje (usa <code>&#123;name&#125;</code> y <code>&#123;url&#125;</code>)
            </label>
            <textarea
              name="whatsappTemplate"
              rows={4}
              defaultValue={whatsappTemplate}
              style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem", fontFamily: "inherit", lineHeight: 1.4 }}
            />
          </div>

          {/* Vercel Cloud Serverless Options */}
          <div style={{ borderTop: "1px solid #EFEAE6", paddingTop: "1.25rem", marginTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1rem" }}>⚡</span>
              <h3 style={{ fontSize: "0.98rem", fontWeight: 700, margin: 0, color: "#2B2425" }}>
                Envío Automático en Vercel (Opciones Cloud / Gateway)
              </h3>
            </div>
            <p style={{ color: "#6A5D60", fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "1rem" }}>
              En Vercel Serverless, para envíos masivos sin mantener la pestaña abierta, puedes vincular la API Oficial de Meta WhatsApp Cloud (1.000 conversaciones gratis/mes) o un microservicio Gateway.
            </p>

            <div style={{ background: "#FAF7F5", border: "1px solid #EAE2DB", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "0.86rem", color: "#8C2836", display: "block", marginBottom: "0.75rem" }}>
                Opción A: Meta WhatsApp Cloud API Oficial
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#44383A", marginBottom: "0.25rem" }}>
                    Meta Phone Number ID
                  </label>
                  <input
                    name="whatsappPhoneNumberId"
                    defaultValue={whatsappPhoneNumberId}
                    placeholder="e.g. 109283746591023"
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.84rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#44383A", marginBottom: "0.25rem" }}>
                    Permanent Access Token
                  </label>
                  <input
                    name="whatsappCloudToken"
                    type="password"
                    defaultValue={whatsappCloudToken}
                    placeholder="EAAGm..."
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.84rem" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: "#FAF7F5", border: "1px solid #EAE2DB", borderRadius: "8px", padding: "1rem" }}>
              <strong style={{ fontSize: "0.86rem", color: "#4A3E3D", display: "block", marginBottom: "0.75rem" }}>
                Opción B: Gateway Microservice URL
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#44383A", marginBottom: "0.25rem" }}>
                    Gateway URL
                  </label>
                  <input
                    name="whatsappGatewayUrl"
                    type="url"
                    defaultValue={whatsappGatewayUrl}
                    placeholder="https://tu-gateway.railway.app/send"
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.84rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#44383A", marginBottom: "0.25rem" }}>
                    Gateway API Key
                  </label>
                  <input
                    name="whatsappGatewayKey"
                    type="password"
                    defaultValue={whatsappGatewayKey}
                    placeholder="••••••••••••"
                    style={{ width: "100%", padding: "0.55rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.84rem" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 5: Dirección Privada & Alojamiento
            ========================================================================= */}
        <div id="stay" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🏠</span>
            <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Dirección Privada &amp; Alojamiento
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Control de privacidad estricto: desmarca la casilla para ocultar la dirección privada del domicilio de los novios en la sección de alojamiento.
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 600, color: "#2B2425", cursor: "pointer", marginBottom: "1.25rem" }}>
            <input type="checkbox" name="showPrivateAddress" defaultChecked={showPrivateAddress} style={{ width: "18px", height: "18px", accentColor: "#8C2836" }} />
            <span>Mostrar dirección privada en la sección de alojamiento</span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Calle y Número</label>
              <input name="privateStreet" defaultValue={privateStreet} placeholder="Schönbrunner Schloßstraße 47" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Ciudad y Código Postal</label>
              <input name="privateCity" defaultValue={privateCity} placeholder="1120 Wien, Austria" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Instrucciones de Acceso para Invitados</label>
            <input name="privateAccessNotes" defaultValue={privateAccessNotes} placeholder="Timbre 'Ruben & Andrea' en el segundo piso" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
          </div>
        </div>

        {/* =========================================================================
            SECTION 6: Spotify & Contacto General
            ========================================================================= */}
        <div id="general" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🎵</span>
            <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Spotify &amp; Contacto General
            </h2>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>URL de la Playlist de Spotify Oficial</label>
            <input
              name="spotifyPlaylistUrl"
              type="url"
              defaultValue={spotifyPlaylistUrl}
              placeholder="https://open.spotify.com/playlist/..."
              style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Teléfono de Contacto</label>
              <input name="contactPhone" defaultValue={contactPhone} placeholder="+43 660 0000000" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Email de Contacto</label>
              <input name="contactEmail" type="email" defaultValue={contactEmail} placeholder="wedding@theandyrubenwedding.website" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 7: Modo Demo & Seguridad
            ========================================================================= */}
        <div id="demo" style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem", scrollMarginTop: "130px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🛡️</span>
            <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Modo Demo &amp; Despliegue en Producción
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Controla la visibilidad del usuario de pruebas <code>Sarah &amp; Guest (Demo)</code> y la ruta pública <code>/i/demo</code>.
            <strong> Para el lanzamiento final a producción:</strong> desmarca esta casilla para desactivar el acceso demo.
          </p>

          <label style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", fontSize: "0.9rem", color: "#2B2425", cursor: "pointer", background: "#FAF7F5", border: "1px solid #EBE4DE", borderRadius: "8px", padding: "1rem" }}>
            <input
              type="checkbox"
              id="enableDemoInvitation"
              name="enableDemoInvitation"
              defaultChecked={enableDemoInvitation}
              style={{ width: "1.25rem", height: "1.25rem", accentColor: "#8C2836", marginTop: "2px", cursor: "pointer" }}
            />
            <div>
              <div style={{ fontWeight: 600, color: "#2B2425" }}>
                Habilitar Invitación Demo (<code>/i/demo</code>)
              </div>
              <div style={{ fontSize: "0.82rem", color: "#776A6C", marginTop: "0.25rem", lineHeight: 1.4 }}>
                Permite a los administradores y revisores probar la experiencia completa de sobre, música, RSVP y mesa de regalos sin alterar los datos reales de los invitados.
              </div>
            </div>
          </label>
        </div>

        {/* Bottom Save Action */}
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "1rem", marginTop: "0.5rem", marginBottom: "2rem" }}>
          <button
            type="submit"
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.9rem 2.2rem",
              fontSize: "1rem",
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
