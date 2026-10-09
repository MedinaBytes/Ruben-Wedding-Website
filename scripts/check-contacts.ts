import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envContent = fs.readFileSync(".env", "utf-8");
for (const line of envContent.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0) {
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const [settingsRes, rsvpsRes, invsRes] = await Promise.all([
    client.from("site_settings").select("*"),
    client.from("rsvps").select("*"),
    client.from("invitations").select("*")
  ]);

  console.log("=== SITE SETTINGS ===");
  for (const s of settingsRes.data || []) {
    console.log(s.key, ":", JSON.stringify(s.value));
  }

  console.log("=== RSVPS COUNT ===", rsvpsRes.data?.length);
  const yesRsvps = (rsvpsRes.data || []).filter((r: any) => r.attendance_status === "yes");
  console.log("Yes RSVPs count:", yesRsvps.length);

  console.log("=== INVITATIONS COUNT ===", invsRes.data?.length);

  // Check how many Yes RSVPs map to an invitation in invitations
  const invMap = new Map((invsRes.data || []).map((i: any) => [i.id, i]));
  let unmapped = 0;
  for (const r of yesRsvps) {
    if (!invMap.has(r.invitation_id)) {
      unmapped++;
      console.log("Unmapped RSVP invitation_id:", r.invitation_id);
    }
  }
  console.log("Unmapped count:", unmapped);
}

run();
