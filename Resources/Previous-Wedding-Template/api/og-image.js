export default function handler(req, res) {
  // Generate a 1200x630 OG image as SVG served with PNG-compatible headers
  // Major social platforms (WhatsApp, Facebook, Twitter) prefer PNG but accept SVG
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FAF5F0"/>
      <stop offset="100%" stop-color="#F5EDE8"/>
    </linearGradient>
    <linearGradient id="stripe" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F5E4E4"/>
      <stop offset="30%" stop-color="#C48A8A"/>
      <stop offset="50%" stop-color="#C4A882"/>
      <stop offset="70%" stop-color="#C8D9C4"/>
      <stop offset="100%" stop-color="#F5E4E4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="5" fill="url(#stripe)"/>
  <rect y="625" width="1200" height="5" fill="url(#stripe)"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="rgba(196,138,138,0.2)" stroke-width="1.5"/>
  <rect x="30" y="30" width="1140" height="570" fill="none" stroke="rgba(196,138,138,0.08)" stroke-width="1"/>
  <circle cx="578" cy="130" r="18" fill="none" stroke="#C4A882" stroke-width="2"/>
  <circle cx="622" cy="130" r="18" fill="none" stroke="#C4A882" stroke-width="2"/>
  <line x1="500" y1="168" x2="586" y2="168" stroke="#E2D0B4" stroke-width="1"/>
  <g transform="translate(600,168) rotate(45)"><rect x="-5" y="-5" width="10" height="10" fill="#C48A8A"/></g>
  <line x1="614" y1="168" x2="700" y2="168" stroke="#E2D0B4" stroke-width="1"/>
  <text x="600" y="258" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="90" font-style="italic" fill="#A06464">Natalia</text>
  <text x="600" y="318" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="46" font-style="italic" fill="#C4A882">&amp; András</text>
  <line x1="440" y1="348" x2="576" y2="348" stroke="#E2D0B4" stroke-width="1"/>
  <g transform="translate(600,348) rotate(45)"><rect x="-4" y="-4" width="8" height="8" fill="#C48A8A"/></g>
  <line x1="624" y1="348" x2="760" y2="348" stroke="#E2D0B4" stroke-width="1"/>
  <text x="600" y="420" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="56" font-style="italic" fill="#A06464">July 18, 2026</text>
  <text x="600" y="468" text-anchor="middle" font-family="Arial,sans-serif" font-weight="200" font-size="16" fill="#9C8878" letter-spacing="5">BUDAPEST</text>
  <line x1="460" y1="500" x2="576" y2="500" stroke="#E2D0B4" stroke-width="1"/>
  <g transform="translate(600,500) rotate(45)"><rect x="-4" y="-4" width="8" height="8" fill="#C48A8A"/></g>
  <line x1="624" y1="500" x2="740" y2="500" stroke="#E2D0B4" stroke-width="1"/>
  <text x="600" y="555" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="22" fill="#5C4840">You're invited to celebrate with us</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg);
}
