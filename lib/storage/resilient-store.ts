import fs from "node:fs";
import path from "node:path";

export interface StoredInvitation {
  id: string;
  token: string;
  token_hash: string;
  display_name: string;
  normalized_name: string;
  language: string | null;
  max_guests: number;
  plus_one_allowed: boolean;
  group_name: string | null;
  normalized_group_name: string | null;
  personal_message: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  status: "active" | "draft" | "revoked";
  created_at: string;
}

export interface StoredRsvp {
  invitation_id: string;
  attendance_status: "yes" | "no";
  attendee_count: number;
  guest_names: string[];
  dietary_requirements: string | null;
  notes: string | null;
  language: string;
  submitted_at: string;
  updated_at: string;
}

export interface StoredSongRequest {
  invitation_id: string;
  slot: number;
  song_title: string;
  artist: string | null;
  spotify_url: string | null;
  submitted_at: string;
}

interface LocalDatabase {
  invitations: StoredInvitation[];
  rsvps: StoredRsvp[];
  songRequests: StoredSongRequest[];
  settings: Record<string, unknown>;
  whatsappSession: {
    status: "disconnected" | "connecting" | "connected";
    linkedPhone: string | null;
    qrCode: string | null;
    autoUnlinkAfterDispatch: boolean;
    dispatchIntervalSeconds: number;
    lastSyncedAt: string | null;
  };
}

const DB_PATH = path.resolve(process.cwd(), ".local-db.json");

function getDefaultDb(): LocalDatabase {
  return {
    invitations: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        token: "demo",
        token_hash: "demo_hash",
        display_name: "Sarah & Guest (Demo)",
        normalized_name: "sarah guest demo",
        language: "en",
        max_guests: 2,
        plus_one_allowed: true,
        group_name: "Demo Reviewers",
        normalized_group_name: "demo reviewers",
        personal_message: "We would be absolutely thrilled to celebrate this unforgettable day in Vienna with you!",
        phone: "+43 664 1234567",
        whatsapp: "+436641234567",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ],
    rsvps: [],
    songRequests: [],
    settings: {
      showGiftDetails: false,
      showPrivateAddress: false,
      bankName: "Erste Bank Österreich",
      accountHolder: "Ruben & Andrea",
      iban: "AT61 2011 1000 0000 0000",
      bic: "GIBAATWWXXX",
      giftNote: "Reference: Ruben & Andrea Wedding 2027",
      privateStreet: "Schönbrunner Schloßstraße 47",
      privateCity: "1120 Vienna, Austria",
      privateAccessNotes: "Ring bell for 'Ruben & Andrea' on 2nd floor.",
      whatsappDelaySeconds: 10,
      whatsappTemplate:
        "Dear {name},\n\nRuben & Andrea cordially invite you to celebrate their wedding on October 2, 2027 in Vienna!\n\nPlease open your personalized digital invitation here:\n{url}",
    },
    whatsappSession: {
      status: "connected",
      linkedPhone: "+43 664 999 8888",
      qrCode: null,
      autoUnlinkAfterDispatch: true,
      dispatchIntervalSeconds: 10,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

function loadDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial = getDefaultDb();
      saveDb(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as LocalDatabase;
  } catch {
    return getDefaultDb();
  }
}

function saveDb(db: LocalDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch {}
}

export const resilientStore = {
  // INVITATIONS
  getInvitations(): StoredInvitation[] {
    return loadDb().invitations;
  },

  getInvitationById(id: string): StoredInvitation | null {
    const db = loadDb();
    return db.invitations.find((i) => i.id === id) ?? null;
  },

  getInvitationByToken(token: string): StoredInvitation | null {
    if (token === "demo") {
      return this.getInvitationById("00000000-0000-0000-0000-000000000001");
    }
    const db = loadDb();
    return db.invitations.find((i) => i.token === token || i.id === token) ?? null;
  },

  saveInvitation(inv: StoredInvitation) {
    const db = loadDb();
    const index = db.invitations.findIndex((i) => i.id === inv.id);
    if (index >= 0) {
      db.invitations[index] = inv;
    } else {
      db.invitations.unshift(inv);
    }
    saveDb(db);
    return inv;
  },

  // RSVPS
  getRsvps(): StoredRsvp[] {
    return loadDb().rsvps;
  },

  getRsvp(invitationId: string): StoredRsvp | null {
    const db = loadDb();
    return db.rsvps.find((r) => r.invitation_id === invitationId) ?? null;
  },

  saveRsvp(rsvp: StoredRsvp) {
    const db = loadDb();
    const index = db.rsvps.findIndex((r) => r.invitation_id === rsvp.invitation_id);
    if (index >= 0) {
      db.rsvps[index] = rsvp;
    } else {
      db.rsvps.push(rsvp);
    }
    saveDb(db);
    return rsvp;
  },

  // SONG REQUESTS
  getSongRequests(invitationId?: string): StoredSongRequest[] {
    const db = loadDb();
    if (!invitationId) return db.songRequests;
    return db.songRequests.filter((s) => s.invitation_id === invitationId);
  },

  saveSongRequests(invitationId: string, requests: Array<{ title: string; artist?: string | null; spotifyUrl?: string | null }>) {
    const db = loadDb();
    db.songRequests = db.songRequests.filter((s) => s.invitation_id !== invitationId);
    const now = new Date().toISOString();
    requests.forEach((req, index) => {
      db.songRequests.push({
        invitation_id: invitationId,
        slot: index + 1,
        song_title: req.title,
        artist: req.artist ?? null,
        spotify_url: req.spotifyUrl ?? null,
        submitted_at: now,
      });
    });
    saveDb(db);
  },

  // SETTINGS
  getSettings(): Record<string, unknown> {
    return loadDb().settings;
  },

  updateSettings(partial: Record<string, unknown>) {
    const db = loadDb();
    db.settings = { ...db.settings, ...partial };
    saveDb(db);
    return db.settings;
  },

  // WHATSAPP
  getWhatsAppSession() {
    return loadDb().whatsappSession;
  },

  updateWhatsAppSession(partial: Partial<LocalDatabase["whatsappSession"]>) {
    const db = loadDb();
    db.whatsappSession = { ...db.whatsappSession, ...partial };
    saveDb(db);
    return db.whatsappSession;
  },
};
