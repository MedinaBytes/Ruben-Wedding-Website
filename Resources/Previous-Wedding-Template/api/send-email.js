export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { to, lang } = req.body || {};

  if (!to || typeof to !== 'string') {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const language = ['en', 'es', 'hu'].includes(lang) ? lang : 'en';

  const subjects = {
    en: "You're invited! Natalia & András Wedding — July 18, 2026",
    es: "¡Estás invitado! Boda de Natalia & András — 18 julio 2026",
    hu: "Meghívó — Natalia & András esküvője, 2026. július 18."
  };

  const htmlBody = buildEmailHTML(language);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Natalia & András Wedding <onboarding@resend.dev>',
        to: [to],
        subject: subjects[language],
        html: htmlBody
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

function buildEmailHTML(lang) {
  const content = {
    en: {
      greeting: "You're Invited!",
      names: "Natalia & András",
      subtitle: "request the pleasure of your company at their wedding celebration",
      date: "July 18, 2026",
      time: "6:00 PM",
      dateLabel: "Date",
      timeLabel: "Time",
      venue: "ROM BUSZ Beer Garden & BBQ",
      address: "Budapest, Római part 43, 1031",
      details: "The official ceremony will take place in a small family circle. In the evening, please join us for a warm get-together with grilling by the Danube.",
      note1: "No gifts please",
      note2: "No dress code",
      note3: "Feel free to bring something to grill",
      mapBtn: "View on Map",
      webBtn: "View Full Invitation Online",
      footer: "With love, Natalia & András"
    },
    es: {
      greeting: "¡Están Invitados!",
      names: "Natalia & András",
      subtitle: "solicitan el placer de su compañía en la celebración de su boda",
      date: "18 de julio de 2026",
      time: "18:00",
      dateLabel: "Fecha",
      timeLabel: "Hora",
      venue: "ROM BUSZ Jardín de Cerveza & BBQ",
      address: "Budapest, Római part 43, 1031",
      details: "La ceremonia oficial se realizará en un círculo familiar pequeño. En la noche, los invitamos a una reunión cálida con parrillada junto al Danubio.",
      note1: "Sin regalos",
      note2: "Sin código de vestimenta",
      note3: "Bienvenidos a traer algo para la parrilla",
      mapBtn: "Ver en Mapa",
      webBtn: "Ver Invitación Completa Online",
      footer: "Con amor, Natalia & András"
    },
    hu: {
      greeting: "Meghívó",
      names: "Natalia & András",
      subtitle: "szeretettel meghívnak esküvői ünnepségükre",
      date: "2026. július 18.",
      time: "18:00",
      dateLabel: "Dátum",
      timeLabel: "Időpont",
      venue: "ROM BUSZ Sörkert & BBQ",
      address: "Budapest, Római part 43, 1031",
      details: "A hivatalos szertartás szűk családi körben zajlik. Este pedig szeretettel várunk egy kellemes dunai grillezésre.",
      note1: "Ajándékot ne hozzatok",
      note2: "Nincs dress code",
      note3: "Hozhattok sütögetni valót",
      mapBtn: "Térkép megtekintése",
      webBtn: "Teljes meghívó online megtekintése",
      footer: "Szeretettel, Natalia & András"
    }
  };

  const c = content[lang] || content.en;
  const siteUrl = "https://natalia-and-andras.vercel.app";
  const mapUrl = "https://maps.app.goo.gl/mJVoNXXScyFNgnwD7";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#E4DDD4;font-family:Georgia,'Times New Roman',serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E4DDD4;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FDFAF6;box-shadow:0 4px 24px rgba(44,32,24,0.12);">

  <!-- Top decorative border -->
  <tr><td style="height:4px;background:linear-gradient(135deg,#C48A8A,#E8C4C4,#8FA888);"></td></tr>

  <!-- Header -->
  <tr><td style="padding:48px 40px 10px;text-align:center;">
    <p style="font-size:12px;letter-spacing:6px;text-transform:uppercase;color:#9C8878;margin:0 0 8px;">✦</p>
    <p style="font-size:14px;letter-spacing:4px;text-transform:uppercase;color:#9C8878;margin:0 0 20px;">${c.greeting}</p>
    <h1 style="font-family:Georgia,'Times New Roman',cursive;font-size:48px;color:#A06464;margin:0;line-height:1.1;font-weight:normal;font-style:italic;">${c.names}</h1>
    <p style="font-size:15px;color:#5C4840;margin:16px 0 0;line-height:1.6;font-style:italic;">${c.subtitle}</p>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:24px 60px;"><hr style="border:none;border-top:1px solid rgba(164,128,100,0.18);margin:0;"></td></tr>

  <!-- Date & Time -->
  <tr><td style="padding:0 40px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="padding:0 24px;text-align:center;vertical-align:top;">
        <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9C8878;margin:0 0 6px;">${c.dateLabel}</p>
        <p style="font-size:22px;color:#2C2018;margin:0;font-style:italic;">${c.date}</p>
      </td>
      <td style="width:1px;background-color:rgba(164,128,100,0.18);"></td>
      <td style="padding:0 24px;text-align:center;vertical-align:top;">
        <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9C8878;margin:0 0 6px;">${c.timeLabel}</p>
        <p style="font-size:22px;color:#2C2018;margin:0;font-style:italic;">${c.time}</p>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- Divider -->
  <tr><td style="padding:24px 60px;"><hr style="border:none;border-top:1px solid rgba(164,128,100,0.18);margin:0;"></td></tr>

  <!-- Venue -->
  <tr><td style="padding:0 40px 8px;text-align:center;">
    <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#C48A8A;margin:0 0 8px;">📍</p>
    <p style="font-size:18px;color:#2C2018;margin:0 0 4px;font-weight:bold;">${c.venue}</p>
    <p style="font-size:14px;color:#5C4840;margin:0;font-style:italic;">${c.address}</p>
  </td></tr>

  <!-- Description -->
  <tr><td style="padding:20px 48px 12px;text-align:center;">
    <p style="font-size:14px;color:#5C4840;line-height:1.7;margin:0;">${c.details}</p>
  </td></tr>

  <!-- Notes -->
  <tr><td style="padding:16px 40px 0;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background-color:#F5F0E8;padding:16px 28px;border-radius:2px;">
    <tr><td style="font-size:13px;color:#5C4840;line-height:2;text-align:left;">
      • ${c.note1}<br>• ${c.note2}<br>• ${c.note3}
    </td></tr>
    </table>
  </td></tr>

  <!-- Buttons -->
  <tr><td style="padding:28px 40px 12px;text-align:center;">
    <a href="${mapUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:#8FA888;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">${c.mapBtn}</a>
  </td></tr>
  <tr><td style="padding:0 40px 10px;text-align:center;">
    <a href="${siteUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:#C48A8A;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:Arial,sans-serif;">${c.webBtn}</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 40px 8px;text-align:center;">
    <hr style="border:none;border-top:1px solid rgba(164,128,100,0.18);margin:0 0 20px;">
    <p style="font-family:Georgia,'Times New Roman',cursive;font-size:20px;color:#A06464;margin:0;font-style:italic;">${c.footer}</p>
  </td></tr>
  <tr><td style="padding:8px 40px 32px;text-align:center;">
    <p style="font-size:11px;color:#9C8878;margin:0;">18 · 07 · 2026 &nbsp;·&nbsp; Budapest</p>
  </td></tr>

  <!-- Bottom decorative border -->
  <tr><td style="height:4px;background:linear-gradient(135deg,#8FA888,#E8C4C4,#C48A8A);"></td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
