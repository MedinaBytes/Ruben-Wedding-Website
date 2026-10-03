import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Supabase URL:", url);
  console.log("Has Service Key:", Boolean(key));

  if (!url || !key) return;

  const client = createClient(url, key);
  const { data: inv, error: invErr } = await client.from("invitations").select("*").limit(5);
  console.log("Invitations result:", { data: inv, error: invErr });

  const { data: rsvp, error: rsvpErr } = await client.from("rsvps").select("*").limit(5);
  console.log("RSVP result:", { data: rsvp, error: rsvpErr });

  const { data: song, error: songErr } = await client.from("song_requests").select("*").limit(5);
  console.log("Song result:", { data: song, error: songErr });

  const { data: events, error: evErr } = await client.from("invitation_events").select("*").limit(5);
  console.log("Events result:", { data: events, error: evErr });
}

main().catch(console.error);
