import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateSiteSettings } from "@/app/actions/admin-settings";
import { SmtpTester } from "@/components/admin/smtp-tester";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site Settings — Admin",
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

  // Values from settings
  const showGiftDetails = Boolean(s.get("showGiftDetails"));
  const bankName = String(s.get("bankName") || "");
  const accountHolder = String(s.get("accountHolder") || "");
  const iban = String(s.get("iban") || "");
  const bic = String(s.get("bic") || "");
  const giftNote = String(s.get("giftNote") || "");

  const showPrivateAddress = Boolean(s.get("showPrivateAddress"));
  const privateStreet = String(s.get("privateStreet") || "");
  const privateCity = String(s.get("privateCity") || "");
  const privateAccessNotes = String(s.get("privateAccessNotes") || "");

  const smtpHost = String(s.get("smtpHost") || "");
  const smtpPort = String(s.get("smtpPort") || "587");
  const smtpSecure = Boolean(s.get("smtpSecure"));
  const smtpUser = String(s.get("smtpUser") || "");
  const smtpPass = String(s.get("smtpPass") || "");
  const smtpSenderEmail = String(s.get("smtpSenderEmail") || "");
  const smtpSenderName = String(s.get("smtpSenderName") || "Ruben & Andrea");

  const whatsappTemplate = String(
    s.get("whatsappTemplate") ||
      "Dear {name}, Ruben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!\n\nPlease open your personalized digital invitation here: {url}",
  );
  const whatsappDelaySeconds = Number(s.get("whatsappDelaySeconds")) || 8;

  const spotifyPlaylistUrl = String(s.get("spotifyPlaylistUrl") || process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_URL || "");
  const contactPhone = String(s.get("contactPhone") || "");
  const contactEmail = String(s.get("contactEmail") || "");

  const enableDemoInvitation = typeof s.get("enableDemoInvitation") === "boolean"
    ? Boolean(s.get("enableDemoInvitation"))
    : resilientStore.isDemoEnabled();

  const enableCalendarSync = s.has("enableCalendarSync") ? Boolean(s.get("enableCalendarSync")) : true;
  const enableEnvelopeCalligraphy = s.has("enableEnvelopeCalligraphy") ? Boolean(s.get("enableEnvelopeCalligraphy")) : true;
  const enableMealSelection = s.has("enableMealSelection") ? Boolean(s.get("enableMealSelection")) : true;
  const enableTravelConcierge = s.has("enableTravelConcierge") ? Boolean(s.get("enableTravelConcierge")) : true;
  const enableDayOfTimeline = s.has("enableDayOfTimeline") ? Boolean(s.get("enableDayOfTimeline")) : true;
  const enableGuestbook = s.has("enableGuestbook") ? Boolean(s.get("enableGuestbook")) : true;
  const enableTablePlanner = s.has("enableTablePlanner") ? Boolean(s.get("enableTablePlanner")) : true;
  const enableQrCheckin = s.has("enableQrCheckin") ? Boolean(s.get("enableQrCheckin")) : true;
  const enableRsvpReminders = s.has("enableRsvpReminders") ? Boolean(s.get("enableRsvpReminders")) : true;

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2.2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
          Wedding Settings &amp; Integrations
        </h1>
        <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.95rem" }}>
          Configure wedding experience modules, feature switches, bank disclosures, private home addresses, SMTP, and WhatsApp.
        </p>
      </div>

      <form action={updateSiteSettings} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Section 0: Feature Controls & Experience Modules */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.4rem" }}>⚡</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Feature Controls &amp; Experience Modules
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Turn individual website features and wedding tools on or off in real-time according to your ceremony needs.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableCalendarSync" defaultChecked={enableCalendarSync} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>📅 1-Click Calendar Sync</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Apple Calendar, Google Calendar &amp; .ics file download</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableEnvelopeCalligraphy" defaultChecked={enableEnvelopeCalligraphy} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🖋️ Envelope Calligraphy</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Guest name calligraphed on front flap of 3D envelope</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableMealSelection" defaultChecked={enableMealSelection} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🍽️ Per-Seat Meal &amp; Allergies</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Beef, fish, vegetarian, vegan &amp; children courses with dietary input</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableTravelConcierge" defaultChecked={enableTravelConcierge} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🏰 Vienna Travel &amp; Hotel Concierge</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Hetzendorf transit (Bim 62, S-Bahn) and Schönbrunn hotel guide</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableDayOfTimeline" defaultChecked={enableDayOfTimeline} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>⏱️ Live Day-of Timeline Mode</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Dynamic live status tracker during wedding day in Vienna</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableGuestbook" defaultChecked={enableGuestbook} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>💌 Digital Guestbook &amp; Wishes Wall</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Allows guests to leave blessings and heartfelt wishes</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableTablePlanner" defaultChecked={enableTablePlanner} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🪑 Table Seating Planner</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Organize Hetzendorf ballroom tables and assign confirmed guests</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer" }}>
              <input type="checkbox" name="enableQrCheckin" defaultChecked={enableQrCheckin} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>📲 QR Door Check-In Mode</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>Fast guest arrival check-in scanning at church &amp; palace</div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.85rem", background: "#FAF7F5", borderRadius: "8px", border: "1px solid #ECE4DD", cursor: "pointer", gridColumn: "span 2" }}>
              <input type="checkbox" name="enableRsvpReminders" defaultChecked={enableRsvpReminders} style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8C2836" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#2B2425" }}>🔔 Batch Pending RSVP Reminders</div>
                <div style={{ fontSize: "0.78rem", color: "#6E6264", marginTop: "2px" }}>One-click automated follow-up dispatch via WhatsApp &amp; Email for pending invitations</div>
              </div>
            </label>
          </div>
        </div>

        {/* Section 1: Gifts & Bank Information */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🎁</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Gifts &amp; Bank Information
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Control whether guests can expand the bank transfer accordion on the website, and configure the account details.
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 600, color: "#2B2425", cursor: "pointer", marginBottom: "1.25rem" }}>
            <input type="checkbox" name="showGiftDetails" defaultChecked={showGiftDetails} style={{ width: "18px", height: "18px" }} />
            <span>Enable Gift Details / Bank Info Accordion on Invitation Website</span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Bank Name</label>
              <input name="bankName" defaultValue={bankName} placeholder="e.g. Erste Bank / Revolut" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Account Holder</label>
              <input name="accountHolder" defaultValue={accountHolder} placeholder="Ruben Quijada & Andrea Müllauer" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>IBAN</label>
              <input name="iban" defaultValue={iban} placeholder="AT00 0000 0000 0000 0000" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "monospace" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>BIC / SWIFT</label>
              <input name="bic" defaultValue={bic} placeholder="GIBAATWWXXX" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem", fontFamily: "monospace" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Registry Note / Instructions</label>
            <textarea name="giftNote" rows={2} defaultValue={giftNote} placeholder="Optional instructions for gifts or contributions..." style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem" }} />
          </div>
        </div>

        {/* Section 2: Private Home Address (Where to Stay) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🏠</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Private Home Address (Where to Stay)
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Strict Privacy: Leave unchecked to conceal the couple&apos;s home address publicly and show the contact recommendation CTA. Check to display the configured address.
          </p>

          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem", fontWeight: 600, color: "#2B2425", cursor: "pointer", marginBottom: "1.25rem" }}>
            <input type="checkbox" name="showPrivateAddress" defaultChecked={showPrivateAddress} style={{ width: "18px", height: "18px" }} />
            <span>Show Private Home Address in &ldquo;Where to Stay&rdquo; Section</span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Street Address</label>
              <input name="privateStreet" defaultValue={privateStreet} placeholder="e.g. Mustergasse 12/4" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>City &amp; Postal Code</label>
              <input name="privateCity" defaultValue={privateCity} placeholder="1120 Wien, Austria" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Access Instructions for Guests</label>
            <input name="privateAccessNotes" defaultValue={privateAccessNotes} placeholder="e.g. Ring top bell, subway U6 station Philadelphiabrücke" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
          </div>
        </div>

        {/* Section 3: SMTP Email Server (Invitation Email Dispatch) */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.4rem" }}>✉</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              SMTP Server Configuration (Email Dispatch)
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Connect your custom SMTP mailer (e.g. Resend, Gmail, Brevo, SendGrid) to send invitations directly from the wedding website.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>SMTP Server Host</label>
              <input name="smtpHost" defaultValue={smtpHost} placeholder="smtp.resend.com or smtp.gmail.com" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Port</label>
              <input name="smtpPort" defaultValue={smtpPort} placeholder="587 or 465" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Username / API Key</label>
              <input name="smtpUser" defaultValue={smtpUser} placeholder="resend or user@domain.com" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Password</label>
              <input name="smtpPass" type="password" defaultValue={smtpPass} placeholder="••••••••••••" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Sender Name</label>
              <input name="smtpSenderName" defaultValue={smtpSenderName} placeholder="Ruben & Andrea" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Sender Email Address</label>
              <input name="smtpSenderEmail" type="email" defaultValue={smtpSenderEmail} placeholder="wedding@rubenandrea.com" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem", color: "#44383A", cursor: "pointer" }}>
            <input type="checkbox" name="smtpSecure" defaultChecked={smtpSecure} style={{ width: "16px", height: "16px" }} />
            <span>Use SSL/TLS (Enable for port 465)</span>
          </label>

          <SmtpTester defaultRecipient={contactEmail || "ruben.andrea.wedding@gmail.com"} />
        </div>

        {/* Section 4: WhatsApp Automated Distribution Integration */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.4rem" }}>💬</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              WhatsApp Automated Distribution
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Safe automated dispatch: Generates personalized invitations with guest names and individual secure links.
            Enforces a staggered interval delay to prevent WhatsApp anti-spam bans, with automatic session unlinking immediately after sending.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
              Stagger Interval Delay Between Messages (Anti-Ban Protection)
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
              <span style={{ fontSize: "0.85rem", color: "#6A5D60" }}>seconds (Recommended: 6–10s to avoid spam flags)</span>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>
              Message Template (use <code>&#123;name&#125;</code> and <code>&#123;url&#125;</code> tags)
            </label>
            <textarea
              name="whatsappTemplate"
              rows={4}
              defaultValue={whatsappTemplate}
              style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.85rem", fontFamily: "inherit", lineHeight: 1.4 }}
            />
          </div>
        </div>

        {/* Section 5: Spotify & General */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🎵</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Spotify Playlist &amp; Organizer Contact
            </h2>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Spotify Playlist URL</label>
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
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Organizer Phone</label>
              <input name="contactPhone" defaultValue={contactPhone} placeholder="+43 660 0000000" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#44383A", marginBottom: "0.3rem" }}>Organizer Email</label>
              <input name="contactEmail" type="email" defaultValue={contactEmail} placeholder="wedding@rubenandrea.com" style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #D5CBC4", fontSize: "0.88rem" }} />
            </div>
          </div>
        </div>

        {/* Section 6: Demo Invitation & Production Controls */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🛡️</span>
            <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.35rem", margin: 0, color: "#2B2425" }}>
              Demo Invitation &amp; Production Deployment
            </h2>
          </div>
          <p style={{ color: "#6A5D60", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
            Controls accessibility for sample reviewer data (<code>Sarah &amp; Guest (Demo)</code>) and the public <code>/i/demo</code> routes.
            <strong> For production deployment:</strong> Uncheck this option so demo data is not accessible and <code>/i/demo</code> returns not found.
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
                Enable Demo User Invitation (<code>/i/demo</code>)
              </div>
              <div style={{ fontSize: "0.82rem", color: "#776A6C", marginTop: "0.25rem", lineHeight: 1.4 }}>
                When checked, <code>/i/demo</code> envelope and invitation pages are accessible for previewing and test runs. When unchecked, visitors to <code>/i/demo</code> see &ldquo;Invitation Not Found&rdquo; and the demo reviewer is hidden from the guest list.
              </div>
            </div>
          </label>
        </div>

        <div>
          <button
            type="submit"
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.85rem 2rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(140, 40, 54, 0.25)",
            }}
          >
            Save All Wedding Settings
          </button>
        </div>
      </form>
    </div>
  );
}
