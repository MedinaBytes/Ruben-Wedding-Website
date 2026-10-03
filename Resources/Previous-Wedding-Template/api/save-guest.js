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
  // CORS for preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, companions, guestCount, lang, timestamp } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Sanitize inputs
  const sanitizedName = name.trim().substring(0, 100);
  const sanitizedCompanions = Array.isArray(companions)
    ? companions.map(c => (typeof c === 'string' ? c.trim().substring(0, 100) : '')).filter(Boolean)
    : [];
  const sanitizedCount = Math.min(Math.max(1, parseInt(guestCount) || 1), 10);
  const sanitizedLang = ['en', 'es', 'hu'].includes(lang) ? lang : 'en';

  const entry = {
    name: sanitizedName,
    companions: sanitizedCompanions,
    guestCount: sanitizedCount,
    lang: sanitizedLang,
    timestamp: timestamp || new Date().toISOString(),
    ip: (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim() || 'unknown'
  };

  try {
    const redis = await getRedis();
    if (!redis) {
      console.error('REDIS_URL not configured');
      return res.status(200).json({ ok: false, reason: 'storage_not_configured' });
    }
    await redis.rPush('guests', JSON.stringify(entry));
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Redis save error:', e.message);
    return res.status(200).json({ ok: false, reason: 'redis_error' });
  }
}
