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
  email?: string | null;
  normalized_email?: string | null;
  phone?: string | null;
  normalized_phone?: string | null;
  whatsapp?: string | null;
  normalized_whatsapp?: string | null;
  status: "active" | "draft" | "revoked";
  created_at: string;
}

export interface MealPreference {
  guestName: string;
  meal: "classic" | "fish" | "vegetarian" | "vegan" | "kids" | "standard";
  allergies?: string;
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
  meal_preferences?: MealPreference[];
}

export interface StoredWish {
  id: string;
  invitation_id: string;
  guest_name: string;
  message: string;
  locale?: string | null;
  status: "approved" | "pending";
  created_at: string;
}

export interface StoredTableAssignment {
  id: string;
  invitation_id: string;
  guest_name: string;
  table_number: number;
  table_name: string;
  seat_number?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoredTableDefinition {
  number: number;
  name: string;
  capacity: number;
}

export const DEFAULT_IMPERIAL_TABLES: StoredTableDefinition[] = [
  { number: 1, name: "Ehrentisch (Head Table)", capacity: 8 },
  { number: 2, name: "Schloss Hetzendorf", capacity: 10 },
  { number: 3, name: "Schönbrunn Salon", capacity: 10 },
  { number: 4, name: "St. Oswald", capacity: 10 },
  { number: 5, name: "Wiener Walzer", capacity: 10 },
  { number: 6, name: "Belvedere", capacity: 8 },
  { number: 7, name: "Donauzauber", capacity: 8 },
  { number: 8, name: "Kaiserin Elisabeth", capacity: 8 },
];

export interface StoredMenuOption {
  id: string;
  name: string;
  icon?: string;
  category?: "meat" | "fish" | "vegetarian" | "vegan" | "kids" | "special";
  enabled: boolean;
  description?: string;
}

export const DEFAULT_MENU_OPTIONS: StoredMenuOption[] = [
  { id: "classic", name: "Classic (Beef Tenderloin & Viennese Specialties)", icon: "🥩", category: "meat", enabled: true },
  { id: "fish", name: "Fish (Alpine Char / Trout with Seasonal Vegetables)", icon: "🐟", category: "fish", enabled: true },
  { id: "vegetarian", name: "Vegetarian (Truffle Risotto & Specialties)", icon: "🥗", category: "vegetarian", enabled: true },
  { id: "vegan", name: "Vegan Gourmet Course", icon: "🌿", category: "vegan", enabled: true },
  { id: "kids", name: "Children's Menu (Wiener Schnitzerl)", icon: "🧒", category: "kids", enabled: true },
];

export interface StoredCheckIn {
  id: string;
  invitation_id: string;
  guest_name?: string;
  guest_count?: number;
  attendee_count?: number;
  checked_in_at: string;
  checked_in_by?: string;
  notes?: string;
}

export interface StoredSongRequest {
  id?: string;
  invitation_id: string;
  slot: number;
  song_title: string;
  artist: string | null;
  spotify_url: string | null;
  spotify_track_id?: string | null;
  album_artwork_url?: string | null;
  selected_for_playlist?: boolean;
  submitted_at: string;
}

export interface StoredEvent {
  id: string;
  invitation_id: string;
  session_id?: string | null;
  event_type: string;
  locale?: string | null;
  created_at: string;
}

interface LocalDatabase {
  invitations: StoredInvitation[];
  rsvps: StoredRsvp[];
  songRequests: StoredSongRequest[];
  events?: StoredEvent[];
  wishes?: StoredWish[];
  tableAssignments?: StoredTableAssignment[];
  tables?: StoredTableDefinition[];
  menuOptions?: StoredMenuOption[];
  checkIns?: StoredCheckIn[];
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

const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
const DB_PATH = isTestEnv
  ? path.resolve(process.cwd(), ".local-db.test.json")
  : path.resolve(process.cwd(), ".local-db.json");
const BACKUP_PATH = path.resolve(process.cwd(), ".local-db.backup.json");

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
    events: [
      {
        id: "evt-demo-1",
        invitation_id: "00000000-0000-0000-0000-000000000001",
        session_id: "demo-session",
        event_type: "INVITE_OPENED",
        locale: "en",
        created_at: new Date().toISOString(),
      },
    ],
    wishes: [
      {
        id: "wish-demo-1",
        invitation_id: "00000000-0000-0000-0000-000000000001",
        guest_name: "Sarah & Marcus",
        message: "Wishing Ruben & Andrea a lifetime of radiant love and laughter in Vienna! Cannot wait to celebrate with you at Hetzendorf.",
        locale: "en",
        status: "approved",
        created_at: new Date().toISOString(),
      },
    ],
    tableAssignments: [],
    tables: DEFAULT_IMPERIAL_TABLES,
    menuOptions: DEFAULT_MENU_OPTIONS,
    checkIns: [],
    settings: {
      enableDemoInvitation: true,
      demoDeleted: false,
      enableCalendarSync: true,
      enableEnvelopeCalligraphy: true,
      enableMealSelection: true,
      enableTravelConcierge: true,
      enableDayOfTimeline: false,
      enableGuestbook: false,
      enableTablePlanner: true,
      enableQrCheckin: false,
      enableRsvpReminders: true,
      showGiftDetails: false,
      enableBankTransfer: true,
      bankName: "Erste Bank Österreich",
      accountHolder: "Ruben & Andrea",
      iban: "AT61 2011 1000 0000 0000",
      bic: "GIBAATWWXXX",
      giftNote: "Reference: Ruben & Andrea Wedding 2027",
      enableRevolut: true,
      revolutTag: "@ruben_andrea",
      revolutNote: "Revolut Pay / Instant transfer without fees",
      enableWise: true,
      wiseTag: "andrea.ruben@wise.com",
      wiseNote: "Wise multi-currency international transfer",
      enableCash: true,
      cashNote: "A royal wedding envelope box will be available during the cocktail reception at Schloss Hetzendorf.",
      showPrivateAddress: false,
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
      if (!isTestEnv && fs.existsSync(BACKUP_PATH)) {
        try {
          const backupRaw = fs.readFileSync(BACKUP_PATH, "utf-8");
          const backupParsed = JSON.parse(backupRaw) as LocalDatabase;
          if (Array.isArray(backupParsed.invitations) && backupParsed.invitations.length > 0) {
            saveDb(backupParsed);
            return backupParsed;
          }
        } catch {}
      }
      const initial = getDefaultDb();
      saveDb(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as LocalDatabase;
    if (!Array.isArray(parsed.events)) parsed.events = [];
    if (!Array.isArray(parsed.invitations)) parsed.invitations = [];
    if (!Array.isArray(parsed.rsvps)) parsed.rsvps = [];
    if (!Array.isArray(parsed.songRequests)) parsed.songRequests = [];
    if (!Array.isArray(parsed.wishes)) parsed.wishes = [];
    if (!Array.isArray(parsed.tableAssignments)) parsed.tableAssignments = [];
    if (!Array.isArray(parsed.tables) || parsed.tables.length === 0) parsed.tables = DEFAULT_IMPERIAL_TABLES;
    if (!Array.isArray(parsed.menuOptions) || parsed.menuOptions.length === 0) parsed.menuOptions = DEFAULT_MENU_OPTIONS;
    if (!Array.isArray(parsed.checkIns)) parsed.checkIns = [];
    if (!parsed.settings || typeof parsed.settings !== "object") parsed.settings = {};

    const isDemoDisabled = parsed.settings.demoDeleted === true || parsed.settings.enableDemoInvitation === false;
    if (isDemoDisabled) {
      parsed.invitations = parsed.invitations.filter((i) => i.id !== "00000000-0000-0000-0000-000000000001" && i.token !== "demo");
    }

    // Fallback recovery: If invitations was somehow emptied or lost non-demo records, check backup
    if (!isTestEnv && parsed.invitations.length <= 1 && fs.existsSync(BACKUP_PATH)) {
      try {
        const backupRaw = fs.readFileSync(BACKUP_PATH, "utf-8");
        const backupParsed = JSON.parse(backupRaw) as LocalDatabase;
        if (Array.isArray(backupParsed.invitations) && backupParsed.invitations.length > parsed.invitations.length) {
          // Merge backup invitations so nothing is ever dropped
          const existingIds = new Set(parsed.invitations.map((i) => i.id));
          for (const bInv of backupParsed.invitations) {
            if (isDemoDisabled && (bInv.id === "00000000-0000-0000-0000-000000000001" || bInv.token === "demo")) {
              continue;
            }
            if (!existingIds.has(bInv.id)) {
              parsed.invitations.push(bInv);
            }
          }
          saveDb(parsed);
        }
      } catch {}
    }

    return parsed;
  } catch {
    return getDefaultDb();
  }
}

function saveDb(db: LocalDatabase) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    if (!isTestEnv) {
      fs.writeFileSync(BACKUP_PATH, JSON.stringify(db, null, 2), "utf-8");
    }
  } catch {}
}

export const resilientStore = {
  // DEMO INVITATION CONTROLS
  isDemoEnabled(): boolean {
    const db = loadDb();
    if (db.settings?.demoDeleted === true) return false;
    if (typeof db.settings?.enableDemoInvitation === "boolean") {
      return db.settings.enableDemoInvitation;
    }
    return process.env.NODE_ENV !== "production";
  },

  setDemoEnabled(enabled: boolean) {
    const db = loadDb();
    if (!db.settings) db.settings = {};
    db.settings.enableDemoInvitation = enabled;
    db.settings.demoDeleted = !enabled;

    if (!enabled) {
      db.invitations = db.invitations.filter(
        (i) => i.id !== "00000000-0000-0000-0000-000000000001" && i.token !== "demo"
      );
      db.rsvps = db.rsvps.filter((r) => r.invitation_id !== "00000000-0000-0000-0000-000000000001");
      db.songRequests = db.songRequests.filter((s) => s.invitation_id !== "00000000-0000-0000-0000-000000000001");
    } else {
      const exists = db.invitations.some(
        (i) => i.id === "00000000-0000-0000-0000-000000000001" || i.token === "demo"
      );
      if (!exists) {
        db.invitations.unshift({
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
        });
      }
    }
    saveDb(db);
    try {
      if (!isTestEnv && fs.existsSync(BACKUP_PATH)) {
        const backupRaw = fs.readFileSync(BACKUP_PATH, "utf-8");
        const backupParsed = JSON.parse(backupRaw) as LocalDatabase;
        if (backupParsed) {
          if (!backupParsed.settings) backupParsed.settings = {};
          backupParsed.settings.enableDemoInvitation = enabled;
          backupParsed.settings.demoDeleted = !enabled;
          if (!enabled && Array.isArray(backupParsed.invitations)) {
            backupParsed.invitations = backupParsed.invitations.filter(
              (i) => i.id !== "00000000-0000-0000-0000-000000000001" && i.token !== "demo"
            );
          }
          fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupParsed, null, 2), "utf-8");
        }
      }
    } catch {}
  },

  // INVITATIONS
  getInvitations(): StoredInvitation[] {
    const list = loadDb().invitations;
    if (!this.isDemoEnabled()) {
      return list.filter((i) => i.id !== "00000000-0000-0000-0000-000000000001" && i.token !== "demo");
    }
    return list;
  },

  getInvitationById(id: string): StoredInvitation | null {
    if ((id === "00000000-0000-0000-0000-000000000001" || id === "demo") && !this.isDemoEnabled()) {
      return null;
    }
    const db = loadDb();
    return db.invitations.find((i) => i.id === id) ?? null;
  },

  getInvitationByToken(token: string): StoredInvitation | null {
    if (token === "demo") {
      if (!this.isDemoEnabled()) return null;
      return this.getInvitationById("00000000-0000-0000-0000-000000000001");
    }
    const db = loadDb();
    const inv = db.invitations.find((i) => i.token === token || i.id === token) ?? null;
    if (inv && (inv.id === "00000000-0000-0000-0000-000000000001" || inv.token === "demo") && !this.isDemoEnabled()) {
      return null;
    }
    return inv;
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

  deleteInvitation(id: string) {
    const isDemo = id === "00000000-0000-0000-0000-000000000001" || id === "demo";
    if (isDemo) {
      this.setDemoEnabled(false);
      return;
    }
    const db = loadDb();
    db.invitations = db.invitations.filter((i) => i.id !== id);
    db.rsvps = db.rsvps.filter((r) => r.invitation_id !== id);
    db.songRequests = db.songRequests.filter((s) => s.invitation_id !== id);
    saveDb(db);
    try {
      if (!isTestEnv && fs.existsSync(BACKUP_PATH)) {
        const backupRaw = fs.readFileSync(BACKUP_PATH, "utf-8");
        const backupParsed = JSON.parse(backupRaw) as LocalDatabase;
        if (backupParsed && Array.isArray(backupParsed.invitations)) {
          backupParsed.invitations = backupParsed.invitations.filter((i) => i.id !== id);
          fs.writeFileSync(BACKUP_PATH, JSON.stringify(backupParsed, null, 2), "utf-8");
        }
      }
    } catch {}
  },

  updateInvitationStatus(id: string, status: "active" | "draft" | "revoked") {
    const db = loadDb();
    const inv = db.invitations.find((i) => i.id === id);
    if (inv) {
      inv.status = status;
      saveDb(db);
    }
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
    return db.songRequests
      .filter((s) => s.invitation_id === invitationId)
      .sort((a, b) => a.slot - b.slot);
  },

  addSongRequest(
    invitationId: string,
    song: {
      title: string;
      artist?: string | null;
      spotifyUrl?: string | null;
      spotifyTrackId?: string | null;
      albumArtworkUrl?: string | null;
    },
  ): { success: boolean; error?: string; song?: StoredSongRequest } {
    const db = loadDb();
    const existing = db.songRequests
      .filter((s) => s.invitation_id === invitationId)
      .sort((a, b) => a.slot - b.slot);

    if (existing.length >= 3) {
      return { success: false, error: "maximum_reached" };
    }

    const cleanTitle = song.title.trim();
    const cleanArtist = song.artist?.trim() || null;
    const isDup = existing.some(
      (s) =>
        (song.spotifyTrackId && s.spotify_track_id && s.spotify_track_id === song.spotifyTrackId) ||
        (s.song_title.toLowerCase() === cleanTitle.toLowerCase() &&
          (s.artist || "").toLowerCase() === (cleanArtist || "").toLowerCase()),
    );
    if (isDup) {
      return { success: false, error: "already_submitted" };
    }

    const usedSlots = new Set(existing.map((s) => s.slot));
    let nextSlot = 1;
    while (usedSlots.has(nextSlot) && nextSlot <= 3) {
      nextSlot++;
    }

    const now = new Date().toISOString();
    const newSong: StoredSongRequest = {
      id: `song-${invitationId}-${nextSlot}-${Date.now().toString(36)}`,
      invitation_id: invitationId,
      slot: nextSlot,
      song_title: cleanTitle,
      artist: cleanArtist,
      spotify_url: song.spotifyUrl?.trim() || null,
      spotify_track_id: song.spotifyTrackId?.trim() || null,
      album_artwork_url: song.albumArtworkUrl?.trim() || null,
      selected_for_playlist: false,
      submitted_at: now,
    };

    db.songRequests.push(newSong);

    // Recompact slots
    const userSongs = db.songRequests
      .filter((s) => s.invitation_id === invitationId)
      .sort((a, b) => a.slot - b.slot);
    userSongs.forEach((s, idx) => {
      s.slot = idx + 1;
    });

    saveDb(db);
    return { success: true, song: newSong };
  },

  deleteSongRequest(invitationId: string, identifier: string | number): boolean {
    const db = loadDb();
    const beforeCount = db.songRequests.length;
    db.songRequests = db.songRequests.filter((s) => {
      if (s.invitation_id !== invitationId) return true;
      if (typeof identifier === "number" && s.slot === identifier) return false;
      if (
        typeof identifier === "string" &&
        (s.id === identifier ||
          s.spotify_track_id === identifier ||
          String(s.slot) === identifier ||
          s.song_title.toLowerCase() === identifier.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    // Recompact slots
    const remaining = db.songRequests
      .filter((s) => s.invitation_id === invitationId)
      .sort((a, b) => a.slot - b.slot);
    remaining.forEach((s, idx) => {
      s.slot = idx + 1;
    });

    saveDb(db);
    return db.songRequests.length < beforeCount;
  },

  saveSongRequests(
    invitationId: string,
    requests: Array<{
      title: string;
      artist?: string | null;
      spotifyUrl?: string | null;
      spotifyTrackId?: string | null;
      albumArtworkUrl?: string | null;
    }>,
  ) {
    const db = loadDb();
    db.songRequests = db.songRequests.filter((s) => s.invitation_id !== invitationId);
    const now = new Date().toISOString();
    requests.slice(0, 3).forEach((req, index) => {
      const slot = index + 1;
      db.songRequests.push({
        id: `song-${invitationId}-${slot}-${Date.now().toString(36)}`,
        invitation_id: invitationId,
        slot,
        song_title: req.title.trim(),
        artist: req.artist?.trim() || null,
        spotify_url: req.spotifyUrl?.trim() || null,
        spotify_track_id: req.spotifyTrackId?.trim() || null,
        album_artwork_url: req.albumArtworkUrl?.trim() || null,
        selected_for_playlist: false,
        submitted_at: now,
      });
    });
    saveDb(db);
  },

  toggleSongSelected(id: string, selected: boolean): boolean {
    const db = loadDb();
    const song = db.songRequests.find((s) => s.id === id || s.song_title === id);
    if (song) {
      song.selected_for_playlist = selected;
      saveDb(db);
      return true;
    }
    return false;
  },

  // EVENTS
  getEvents(): StoredEvent[] {
    const db = loadDb();
    return db.events ?? [];
  },

  recordEvent(event: Omit<StoredEvent, "id" | "created_at">): StoredEvent {
    const db = loadDb();
    if (!db.events) db.events = [];
    const newEvent: StoredEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      invitation_id: event.invitation_id,
      session_id: event.session_id ?? null,
      event_type: event.event_type,
      locale: event.locale ?? null,
      created_at: new Date().toISOString(),
    };
    db.events.unshift(newEvent);
    if (db.events.length > 500) {
      db.events = db.events.slice(0, 500);
    }
    saveDb(db);
    return newEvent;
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

  purgeWeddingData(keepDemo = true) {
    const db = loadDb();
    if (!isTestEnv) {
      try {
        fs.writeFileSync(
          path.resolve(process.cwd(), ".local-db.purge-backup.json"),
          JSON.stringify(db, null, 2),
          "utf-8",
        );
      } catch {}
    }
    if (keepDemo) {
      db.invitations = getDefaultDb().invitations;
    } else {
      db.invitations = [];
    }
    db.rsvps = [];
    db.songRequests = [];
    db.events = [];
    saveDb(db);
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

  // DIGITAL GUESTBOOK WISHES
  getWishes(): StoredWish[] {
    const db = loadDb();
    return (db.wishes ?? []).filter((w) => w.status === "approved");
  },

  getAllWishes(): StoredWish[] {
    return loadDb().wishes ?? [];
  },

  saveWish(wish: StoredWish): StoredWish {
    const db = loadDb();
    if (!Array.isArray(db.wishes)) db.wishes = [];
    const index = db.wishes.findIndex((w) => w.id === wish.id);
    if (index >= 0) {
      db.wishes[index] = wish;
    } else {
      db.wishes.unshift(wish);
    }
    saveDb(db);
    return wish;
  },

  deleteWish(id: string) {
    const db = loadDb();
    if (!Array.isArray(db.wishes)) return;
    db.wishes = db.wishes.filter((w) => w.id !== id);
    saveDb(db);
  },

  // TABLE SEATING ASSIGNMENTS
  getTableAssignments(): StoredTableAssignment[] {
    return loadDb().tableAssignments ?? [];
  },

  saveTableAssignment(assignment: StoredTableAssignment): StoredTableAssignment {
    const db = loadDb();
    if (!Array.isArray(db.tableAssignments)) db.tableAssignments = [];
    const index = db.tableAssignments.findIndex(
      (t) => (t.id && t.id === assignment.id) || (t.invitation_id === assignment.invitation_id && t.guest_name === assignment.guest_name),
    );
    if (index >= 0) {
      db.tableAssignments[index] = assignment;
    } else {
      db.tableAssignments.push(assignment);
    }
    saveDb(db);
    return assignment;
  },

  deleteTableAssignment(idOrInvitationId: string) {
    const db = loadDb();
    if (!Array.isArray(db.tableAssignments)) return;
    db.tableAssignments = db.tableAssignments.filter(
      (t) => t.id !== idOrInvitationId && t.invitation_id !== idOrInvitationId,
    );
    saveDb(db);
  },

  // TABLE DEFINITIONS (SCHLOSS HETZENDORF CUSTOMIZABLE TABLES)
  getTables(): StoredTableDefinition[] {
    const db = loadDb();
    if (!Array.isArray(db.tables) || db.tables.length === 0) {
      return DEFAULT_IMPERIAL_TABLES;
    }
    return db.tables;
  },

  saveTables(tables: StoredTableDefinition[]): StoredTableDefinition[] {
    const db = loadDb();
    db.tables = tables;
    if (Array.isArray(db.tableAssignments)) {
      for (const a of db.tableAssignments) {
        const match = tables.find((t) => t.number === a.table_number);
        if (match) {
          a.table_name = match.name;
        }
      }
    }
    saveDb(db);
    return tables;
  },

  saveTable(table: StoredTableDefinition): StoredTableDefinition[] {
    const db = loadDb();
    if (!Array.isArray(db.tables) || db.tables.length === 0) {
      db.tables = [...DEFAULT_IMPERIAL_TABLES];
    }
    const idx = db.tables.findIndex((t) => t.number === table.number);
    if (idx >= 0) {
      db.tables[idx] = table;
    } else {
      db.tables.push(table);
      db.tables.sort((a, b) => a.number - b.number);
    }
    if (Array.isArray(db.tableAssignments)) {
      for (const a of db.tableAssignments) {
        if (a.table_number === table.number) {
          a.table_name = table.name;
        }
      }
    }
    saveDb(db);
    return db.tables;
  },

  deleteTable(tableNumber: number): StoredTableDefinition[] {
    const db = loadDb();
    if (!Array.isArray(db.tables)) {
      db.tables = [...DEFAULT_IMPERIAL_TABLES];
    }
    db.tables = db.tables.filter((t) => t.number !== tableNumber);
    if (Array.isArray(db.tableAssignments)) {
      db.tableAssignments = db.tableAssignments.filter((a) => a.table_number !== tableNumber);
    }
    saveDb(db);
    return db.tables;
  },

  // CHECK-IN ENGINE (ON-SITE AT SCHLOSS HETZENDORF)
  getCheckIns(): StoredCheckIn[] {
    return loadDb().checkIns ?? [];
  },

  recordCheckIn(invitationId: string, guestCount = 1, notes?: string): StoredCheckIn {
    const db = loadDb();
    if (!Array.isArray(db.checkIns)) db.checkIns = [];
    const newCheckIn: StoredCheckIn = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invitation_id: invitationId,
      guest_count: guestCount,
      attendee_count: guestCount,
      checked_in_at: new Date().toISOString(),
      checked_in_by: "usher",
      notes,
    };
    db.checkIns.unshift(newCheckIn);
    saveDb(db);
    return newCheckIn;
  },

  removeCheckIn(idOrInvitationId: string) {
    const db = loadDb();
    if (!Array.isArray(db.checkIns)) return;
    db.checkIns = db.checkIns.filter((c) => c.id !== idOrInvitationId && c.invitation_id !== idOrInvitationId);
    saveDb(db);
  },

  // MENU & COURSE OPTIONS (SCHLOSS HETZENDORF BANQUET)
  getMenuOptions(): StoredMenuOption[] {
    const db = loadDb();
    if (!Array.isArray(db.menuOptions) || db.menuOptions.length === 0) {
      return DEFAULT_MENU_OPTIONS;
    }
    return db.menuOptions;
  },

  saveMenuOptions(options: StoredMenuOption[]): StoredMenuOption[] {
    const db = loadDb();
    db.menuOptions = options;
    saveDb(db);
    return options;
  },

  saveMenuOption(option: StoredMenuOption): StoredMenuOption[] {
    const db = loadDb();
    if (!Array.isArray(db.menuOptions)) db.menuOptions = [...DEFAULT_MENU_OPTIONS];
    const idx = db.menuOptions.findIndex((o) => o.id === option.id);
    if (idx >= 0) {
      db.menuOptions[idx] = option;
    } else {
      db.menuOptions.push(option);
    }
    saveDb(db);
    return db.menuOptions;
  },

  deleteMenuOption(optionId: string): StoredMenuOption[] {
    const db = loadDb();
    if (!Array.isArray(db.menuOptions)) db.menuOptions = [...DEFAULT_MENU_OPTIONS];
    db.menuOptions = db.menuOptions.filter((o) => o.id !== optionId);
    saveDb(db);
    return db.menuOptions;
  },

  // CATERING & DIETARY AGGREGATOR
  getCateringSummary() {
    const rsvps = this.getRsvps().filter((r) => r.attendance_status === "yes");
    const totalConfirmedGuests = rsvps.reduce((acc, r) => acc + (r.attendee_count || 1), 0);
    const menuOptions = this.getMenuOptions();
    const tableAssignments = this.getTableAssignments();
    const tableMap = new Map(tableAssignments.map((t) => [t.invitation_id, t]));

    const mealBreakdown: Record<string, number> = {};
    for (const opt of menuOptions) {
      mealBreakdown[opt.id] = 0;
    }
    mealBreakdown.standard = 0;

    const guestRoster: Array<{
      guestName: string;
      meal: string;
      allergies: string;
      tableNumber?: number;
      tableName?: string;
      invitationId: string;
    }> = [];

    const allergies: Array<{
      guestName: string;
      allergies: string;
      meal: string;
      tableNumber?: number;
      tableName?: string;
      invitationId: string;
    }> = [];

    for (const r of rsvps) {
      const tableInfo = tableMap.get(r.invitation_id);
      if (Array.isArray(r.meal_preferences) && r.meal_preferences.length > 0) {
        for (const pref of r.meal_preferences) {
          const mealId = pref.meal || "classic";
          mealBreakdown[mealId] = (mealBreakdown[mealId] || 0) + 1;

          guestRoster.push({
            guestName: pref.guestName || "Guest",
            meal: mealId,
            allergies: pref.allergies?.trim() || "",
            tableNumber: tableInfo?.table_number,
            tableName: tableInfo?.table_name,
            invitationId: r.invitation_id,
          });

          if (pref.allergies && pref.allergies.trim()) {
            allergies.push({
              guestName: pref.guestName || "Guest",
              allergies: pref.allergies.trim(),
              meal: mealId,
              tableNumber: tableInfo?.table_number,
              tableName: tableInfo?.table_name,
              invitationId: r.invitation_id,
            });
          }
        }
      } else {
        mealBreakdown.standard = (mealBreakdown.standard || 0) + (r.attendee_count || 1);
        guestRoster.push({
          guestName: r.guest_names?.[0] || "Guest",
          meal: "standard",
          allergies: r.dietary_requirements?.trim() || "",
          tableNumber: tableInfo?.table_number,
          tableName: tableInfo?.table_name,
          invitationId: r.invitation_id,
        });
      }

      if (r.dietary_requirements && r.dietary_requirements.trim()) {
        const alreadyIn = allergies.some((a) => a.invitationId === r.invitation_id);
        if (!alreadyIn) {
          allergies.push({
            guestName: r.guest_names?.[0] || "Party",
            allergies: r.dietary_requirements.trim(),
            meal: "standard",
            tableNumber: tableInfo?.table_number,
            tableName: tableInfo?.table_name,
            invitationId: r.invitation_id,
          });
        }
      }
    }

    return {
      totalConfirmed: totalConfirmedGuests,
      totalConfirmedGuests,
      meals: mealBreakdown,
      mealBreakdown,
      menuOptions,
      guestRoster,
      allergies,
    };
  },
};
