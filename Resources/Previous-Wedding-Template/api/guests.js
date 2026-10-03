import { createClient } from 'redis';

let client = null;

async function getRedis() {
  if (client && client.isOpen) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = createClient({ url });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = process.env.GUEST_LIST_PASSWORD || 'natalia2026';
  const providedPass = req.query.p || req.query.password || '';

  if (providedPass !== password) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guest List - Login</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F0E8;font-family:'Segoe UI',system-ui,sans-serif;}
  .card{background:#fff;padding:48px 40px;box-shadow:0 8px 40px rgba(44,32,24,.12);max-width:400px;width:100%;text-align:center;}
  h1{font-size:24px;color:#A06464;margin-bottom:8px;font-weight:400;}
  p{font-size:13px;color:#9C8878;margin-bottom:24px;}
  input{width:100%;padding:12px 16px;border:1px solid #DDD4C4;background:#FDFAF6;font-size:14px;outline:none;margin-bottom:16px;text-align:center;}
  input:focus{border-color:#C48A8A;}
  button{width:100%;padding:13px;background:linear-gradient(135deg,#C48A8A,#A06464);color:#fff;border:none;font-size:12px;letter-spacing:3px;text-transform:uppercase;cursor:pointer;}
  button:hover{opacity:.9;}
</style></head><body>
<div class="card">
  <h1>\uD83D\uDC8D Guest List</h1>
  <p>Enter the password to view the guest list</p>
  <form method="GET">
    <input type="password" name="p" placeholder="Password" autofocus required>
    <button type="submit">View Guest List</button>
  </form>
</div>
</body></html>`);
  }

  // Authenticated — fetch guest data
  let guests = [];

  try {
    const redis = await getRedis();
    if (redis) {
      const raw = await redis.lRange('guests', 0, -1);
      if (Array.isArray(raw)) {
        guests = raw.map(item => {
          try { return JSON.parse(item); } catch (e) { return null; }
        }).filter(Boolean);
      }
    }
  } catch (e) {
    console.error('Redis read error:', e.message);
  }

  // Calculate totals
  const totalEntries = guests.length;
  const totalGuests = guests.reduce((sum, g) => sum + (g.guestCount || 1), 0);

  // Build table rows
  const rows = guests.map((g, i) => {
    const companions = (g.companions || []).join(', ') || '—';
    const date = g.timestamp ? new Date(g.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const langFlag = { en: '🇬🇧', es: '🇪🇸', hu: '🇭🇺' }[g.lang] || '🌐';
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(g.name || '')}</strong></td>
      <td>${escapeHtml(companions)}</td>
      <td>${g.guestCount || 1}</td>
      <td>${langFlag} ${(g.lang || '').toUpperCase()}</td>
      <td>${date}</td>
    </tr>`;
  }).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guest List — Natalia &amp; Andr\u00e1s</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#F5F0E8;font-family:'Segoe UI',system-ui,sans-serif;padding:32px 20px;color:#2C2018;}
  .wrap{max-width:900px;margin:0 auto;}
  h1{font-size:28px;color:#A06464;font-weight:400;margin-bottom:4px;text-align:center;}
  .sub{font-size:13px;color:#9C8878;text-align:center;margin-bottom:24px;}
  .stats{display:flex;gap:16px;justify-content:center;margin-bottom:28px;flex-wrap:wrap;}
  .stat{background:#fff;padding:16px 28px;box-shadow:0 2px 12px rgba(44,32,24,.08);text-align:center;}
  .stat-num{font-size:32px;color:#A06464;font-weight:300;}
  .stat-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9C8878;margin-top:4px;}
  .tbl-wrap{background:#fff;box-shadow:0 4px 20px rgba(44,32,24,.1);overflow-x:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{background:#A06464;color:#fff;padding:12px 16px;text-align:left;font-weight:400;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
  td{padding:11px 16px;border-bottom:1px solid #EDE5D8;}
  tr:hover td{background:#FBF3F3;}
  tr:last-child td{border-bottom:none;}
  .empty{text-align:center;padding:48px;color:#9C8878;font-style:italic;}
  .refresh{display:inline-block;margin-top:20px;padding:10px 24px;background:#A06464;color:#fff;text-decoration:none;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
  .refresh:hover{opacity:.85;}
  @media(max-width:600px){th,td{padding:8px 10px;font-size:12px;} .stat{padding:12px 18px;} .stat-num{font-size:24px;}}
</style></head><body>
<div class="wrap">
  <h1>\uD83D\uDC8D Guest List</h1>
  <p class="sub">Natalia &amp; Andr\u00e1s Wedding — 18 July 2026</p>
  <div class="stats">
    <div class="stat"><div class="stat-num">${totalEntries}</div><div class="stat-lbl">Registrations</div></div>
    <div class="stat"><div class="stat-num">${totalGuests}</div><div class="stat-lbl">Total Guests</div></div>
  </div>
  <div class="tbl-wrap">
    ${totalEntries === 0 ? '<p class="empty">No guests registered yet</p>' : `<table>
      <thead><tr><th>#</th><th>Name</th><th>Companions</th><th>Count</th><th>Lang</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`}
  </div>
  <div style="text-align:center;margin-top:20px;">
    <a class="refresh" href="?p=${encodeURIComponent(password)}">Refresh</a>
  </div>
</div>
</body></html>`);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
