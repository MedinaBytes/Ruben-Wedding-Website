import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { generateInvitationToken, hashInvitationToken } from "../lib/invitations/token";
import { normalizeEmail, normalizeName, normalizePhone } from "../lib/invitations/lookup-normalize";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      let v = trimmed.slice(eqIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey);

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ""));
  return result;
}

async function run() {
  const csvFile = path.resolve(process.cwd(), "docs/bulk-invitations-cleaned.csv");
  const rawCsv = fs.readFileSync(csvFile, "utf-8");
  const lines = rawCsv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  
  const headers = parseCsvLine(lines[0]);
  console.log("Headers:", headers);

  const invitationsToInsert = [];
  const localDbInvitations = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    const displayName = parts[0];
    const email = parts[1] || null;
    const whatsapp = parts[2] || null;
    const language = parts[3] || "en";
    const maxGuests = parseInt(parts[4], 10) || 1;
    const plusOneAllowed = parts[5]?.toLowerCase() === "true";
    const groupName = parts[6] || null;
    const personalMessage = parts[7] || null;

    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const id = crypto.randomUUID();

    const inv = {
      id,
      token,
      token_hash: tokenHash,
      display_name: displayName,
      normalized_name: normalizeName(displayName),
      language,
      max_guests: maxGuests,
      plus_one_allowed: plusOneAllowed,
      group_name: groupName,
      normalized_group_name: groupName ? normalizeName(groupName) : null,
      personal_message: personalMessage,
      email,
      normalized_email: email ? normalizeEmail(email) : null,
      phone: whatsapp,
      normalized_phone: whatsapp ? normalizePhone(whatsapp) : null,
      whatsapp,
      normalized_whatsapp: whatsapp ? normalizePhone(whatsapp) : null,
      status: "active",
      created_at: new Date().toISOString(),
    };

    invitationsToInsert.push(inv);
    localDbInvitations.push(inv);
  }

  console.log(`Prepared ${invitationsToInsert.length} invitations. Inserting to Supabase...`);

  // Insert in batches of 10
  let successCount = 0;
  for (let i = 0; i < invitationsToInsert.length; i += 10) {
    const batch = invitationsToInsert.slice(i, i + 10);
    const { data, error } = await client.from("invitations").upsert(batch);
    if (error) {
      console.error(`Error in batch ${i}:`, error);
    } else {
      successCount += batch.length;
      console.log(`Inserted batch ${i} to ${i + batch.length} successfully.`);
    }
  }

  console.log(`Total successfully inserted to Supabase: ${successCount}/${invitationsToInsert.length}`);

  // Also sync to .local-db.json
  const localDbPath = path.resolve(process.cwd(), ".local-db.json");
  if (fs.existsSync(localDbPath)) {
    try {
      const localData = JSON.parse(fs.readFileSync(localDbPath, "utf-8"));
      if (!Array.isArray(localData.invitations)) {
        localData.invitations = [];
      }
      for (const inv of localDbInvitations) {
        const existingIdx = localData.invitations.findIndex((x: any) => x.id === inv.id || x.display_name === inv.display_name);
        if (existingIdx >= 0) {
          localData.invitations[existingIdx] = inv;
        } else {
          localData.invitations.push(inv);
        }
      }
      fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), "utf-8");
      console.log(`Synced ${localDbInvitations.length} invitations to .local-db.json`);
    } catch (err) {
      console.error("Failed to sync to .local-db.json:", err);
    }
  }
}

run().catch(console.error);
