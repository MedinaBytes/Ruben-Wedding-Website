"use client";

import { useState, useTransition } from "react";
import { sendBatchRsvpReminders, type ReminderResult } from "@/app/actions/admin-reminders";
import { saveMenuOptionsAction } from "@/app/actions/admin-catering";
import type { StoredMenuOption } from "@/lib/storage/resilient-store";

export interface RsvpRow {
  invitationId: string;
  displayName: string;
  groupName: string | null;
  maxGuests: number;
  status: "yes" | "no" | "pending";
  attendeeCount: number;
  guestNames: string[];
  dietaryRequirements: string | null;
  notes: string | null;
  submittedAt: string | null;
}

export type CateringAllergyEntry = {
  guestName: string;
  allergies: string;
  meal: string;
  tableNumber?: number | null;
  tableName?: string | null;
  invitationId?: string;
};

export type CateringGuestRosterEntry = {
  guestName: string;
  meal: string;
  allergies?: string;
  tableNumber?: number | null;
  tableName?: string | null;
  invitationId?: string;
};

export interface CateringSummaryData {
  totalConfirmed: number;
  meals: Record<string, number>;
  allergies: CateringAllergyEntry[];
  menuOptions?: StoredMenuOption[];
  guestRoster?: CateringGuestRosterEntry[];
}

const DEFAULT_MENU_OPTIONS_FALLBACK: StoredMenuOption[] = [
  { id: "classic", name: "Classic (Beef Tenderloin & Viennese Specialties)", icon: "🥩", category: "meat", enabled: true, description: "Baroque roasted with parsnip puree & red wine jus" },
  { id: "fish", name: "Fish (Alpine Char / Trout with Seasonal Vegetables)", icon: "🐟", category: "fish", enabled: true, description: "Fresh Austrian mountain trout with butter potatoes" },
  { id: "vegetarian", name: "Vegetarian (Truffle Risotto & Specialties)", icon: "🥗", category: "vegetarian", enabled: true, description: "Arborio risotto with shaved Styrian black truffle" },
  { id: "vegan", name: "Vegan Gourmet Course", icon: "🌿", category: "vegan", enabled: true, description: "Seasonal forest mushrooms & roasted garden vegetables" },
  { id: "kids", name: "Children's Menu (Wiener Schnitzerl)", icon: "🧒", category: "kids", enabled: true, description: "Crispy mini veal or chicken schnitzel with potato salad" },
];

const COURSE_PALETTE: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  classic: { bg: "#FBE9EB", text: "#8C2836", bar: "#8C2836", border: "#F5C2C7" },
  meat: { bg: "#FBE9EB", text: "#8C2836", bar: "#8C2836", border: "#F5C2C7" },
  fish: { bg: "#EFF6FF", text: "#1D4ED8", bar: "#2563EB", border: "#BFDBFE" },
  vegetarian: { bg: "#ECFDF5", text: "#047857", bar: "#059669", border: "#A7F3D0" },
  vegan: { bg: "#F0FDF4", text: "#15803D", bar: "#16A34A", border: "#BBF7D0" },
  kids: { bg: "#FFFBEB", text: "#B45309", bar: "#D97706", border: "#FDE68A" },
  special: { bg: "#FAF5FF", text: "#7E22CE", bar: "#9333EA", border: "#E9D5FF" },
  standard: { bg: "#F3F4F6", text: "#4B5563", bar: "#6B7280", border: "#E5E7EB" },
};

function getCourseColor(courseIdOrCategory?: string) {
  if (!courseIdOrCategory) return COURSE_PALETTE.classic;
  const key = courseIdOrCategory.toLowerCase();
  return COURSE_PALETTE[key] || { bg: "#FAF7F5", text: "#6A5D60", bar: "#CCA468", border: "#EBE4DD" };
}

function getPrimaryGuestName(displayName: string): string {
  return (
    displayName
      .replace(/\s*&\s*guest(\s*\(demo\))?/i, "")
      .replace(/\s*\(demo\)/i, "")
      .trim() || displayName
  );
}

export function RsvpsManager({
  rsvps,
  cateringSummary,
  enableMealSelection = true,
  enableRsvpReminders = true,
}: {
  rsvps: RsvpRow[];
  cateringSummary?: CateringSummaryData;
  enableMealSelection?: boolean;
  enableRsvpReminders?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no" | "pending">("all");
  const [reminderResult, setReminderResult] = useState<ReminderResult | null>(null);
  const [isReminding, startReminding] = useTransition();

  // Course Personalization State
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuOptions, setMenuOptions] = useState<StoredMenuOption[]>(
    cateringSummary?.menuOptions && cateringSummary.menuOptions.length > 0
      ? cateringSummary.menuOptions
      : DEFAULT_MENU_OPTIONS_FALLBACK
  );
  const [isSavingMenu, startSavingMenu] = useTransition();
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [allergySearch, setAllergySearch] = useState("");

  // New course draft
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseIcon, setNewCourseIcon] = useState("🍽️");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseCategory, setNewCourseCategory] = useState<"meat" | "fish" | "vegetarian" | "vegan" | "kids" | "special">("meat");

  const filtered = rsvps.filter((r) => {
    const matchesSearch =
      r.displayName.toLowerCase().includes(search.toLowerCase()) ||
      r.guestNames.some((name) => name.toLowerCase().includes(search.toLowerCase())) ||
      (r.dietaryRequirements && r.dietaryRequirements.toLowerCase().includes(search.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filter === "all" || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  function exportCsv() {
    const headers = [
      "Invitation Name",
      "Group",
      "Attendance",
      "Guest Count",
      "All Attending Guest Names",
      "Dietary Requirements",
      "Notes",
      "Submitted At",
    ];

    const rows = filtered.map((r) => {
      const primary = getPrimaryGuestName(r.displayName);
      const allNames = r.status === "yes" ? [primary, ...r.guestNames] : [];
      return [
        `"${r.displayName.replace(/"/g, '""')}"`,
        `"${(r.groupName || "").replace(/"/g, '""')}"`,
        r.status.toUpperCase(),
        r.attendeeCount,
        `"${allNames.join("; ").replace(/"/g, '""')}"`,
        `"${(r.dietaryRequirements || "").replace(/"/g, '""')}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
        r.submittedAt || "",
      ];
    });

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wedding_rsvps_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCatererCsv() {
    if (!cateringSummary) return;

    const roster = cateringSummary.guestRoster || [];
    if (roster.length > 0) {
      const headers = [
        "Table Number",
        "Table Name",
        "Guest Name",
        "Course Code",
        "Course Name",
        "Allergies / Special Dietary Needs",
      ];

      const sortedRoster = [...roster].sort((a, b) => {
        const tA = a.tableNumber ?? 999;
        const tB = b.tableNumber ?? 999;
        if (tA !== tB) return tA - tB;
        return a.guestName.localeCompare(b.guestName);
      });

      const rows = sortedRoster.map((item) => {
        const opt = menuOptions.find((o) => o.id === item.meal);
        const courseName = opt ? opt.name : item.meal;
        return [
          item.tableNumber != null ? item.tableNumber : "Unassigned",
          `"${(item.tableName || "Unassigned Table").replace(/"/g, '""')}"`,
          `"${item.guestName.replace(/"/g, '""')}"`,
          `"${item.meal.replace(/"/g, '""')}"`,
          `"${courseName.replace(/"/g, '""')}"`,
          `"${(item.allergies || "").replace(/"/g, '""')}"`,
        ];
      });

      const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hetzendorf_caterer_manifest_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = ["Guest Name", "Table Number", "Table Name", "Meal Choice", "Allergies / Intolerances"];
    const rows = cateringSummary.allergies.map((a) => [
      `"${a.guestName.replace(/"/g, '""')}"`,
      a.tableNumber != null ? a.tableNumber : "Unassigned",
      `"${(a.tableName || "Unassigned").replace(/"/g, '""')}"`,
      `"${a.meal.replace(/"/g, '""')}"`,
      `"${a.allergies.replace(/"/g, '""')}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hetzendorf_caterer_dietary_sheet_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintKitchenSheet() {
    window.print();
  }

  function handleToggleOption(id: string) {
    setMenuOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    );
  }

  function handleUpdateOption(id: string, updates: Partial<StoredMenuOption>) {
    setMenuOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt))
    );
  }

  function handleDeleteOption(id: string) {
    if (menuOptions.length <= 1) {
      alert("At least one menu course must remain configured.");
      return;
    }
    setMenuOptions((prev) => prev.filter((opt) => opt.id !== id));
  }

  function handleAddOption() {
    if (!newCourseName.trim()) return;
    const slug =
      newCourseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `course-${Date.now()}`;

    if (menuOptions.some((o) => o.id === slug)) {
      alert("A course with this identifier already exists. Please choose a different name.");
      return;
    }

    const newOption: StoredMenuOption = {
      id: slug,
      name: newCourseName.trim(),
      icon: newCourseIcon.trim() || "🍽️",
      category: newCourseCategory,
      enabled: true,
      description: newCourseDesc.trim() || undefined,
    };

    setMenuOptions((prev) => [...prev, newOption]);
    setNewCourseName("");
    setNewCourseDesc("");
    setNewCourseIcon("🍽️");
    setNewCourseCategory("meat");
  }

  function handleResetDefaults() {
    if (confirm("Reset menu courses to default Austrian Imperial banquet options?")) {
      setMenuOptions(DEFAULT_MENU_OPTIONS_FALLBACK);
    }
  }

  function handleSaveMenuConfiguration() {
    startSavingMenu(async () => {
      try {
        const saved = await saveMenuOptionsAction(menuOptions);
        setMenuOptions(saved);
        setMenuNotice("✓ Imperial banquet courses saved and updated across guest RSVPs!");
        setTimeout(() => setMenuNotice(null), 4000);
        setIsConfiguringMenu(false);
      } catch {
        alert("Failed to save menu options. Please check admin permissions.");
      }
    });
  }

  function handleBatchReminders() {
    if (!confirm("Send follow-up reminders to all pending guest invitations via Email & WhatsApp queue?")) return;
    startReminding(async () => {
      const res = await sendBatchRsvpReminders();
      setReminderResult(res);
    });
  }

  const yesCount = rsvps.filter((r) => r.status === "yes").length;
  const noCount = rsvps.filter((r) => r.status === "no").length;
  const pendingCount = rsvps.filter((r) => r.status === "pending").length;
  const totalAttendees = rsvps.filter((r) => r.status === "yes").reduce((s, r) => s + r.attendeeCount, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Guest RSVPs &amp; Attendance
          </h1>
          <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.9rem" }}>
            {totalAttendees} Confirmed Guests · {yesCount} Attending · {noCount} Declined · {pendingCount} Pending
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {enableRsvpReminders && (
            <button
              type="button"
              onClick={handleBatchReminders}
              disabled={isReminding}
              style={{
                background: "#8C2836",
                color: "#FFFFFF",
                border: 0,
                borderRadius: "6px",
                padding: "0.55rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(140, 40, 54, 0.2)",
              }}
            >
              {isReminding ? "Preparing Reminders..." : "🔔 Send Batch RSVP Reminders"}
            </button>
          )}

          <button
            type="button"
            onClick={exportCsv}
            style={{
              background: "#55644E",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.55rem 1.1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ⬇ Export RSVPs (CSV)
          </button>
        </div>
      </div>

      {reminderResult && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            color: "#065F46",
            fontSize: "0.88rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>✓ Batch Reminders Queued:</strong> {reminderResult.remindersPrepared} pending invitations prepared ({reminderResult.emailsSent} via Email, {reminderResult.whatsAppPrepared} with WhatsApp numbers).
          </div>
          <button
            type="button"
            onClick={() => setReminderResult(null)}
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "#065F46" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Feedback notice for menu updates */}
      {menuNotice && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.85rem 1.25rem",
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderRadius: "8px",
            color: "#065F46",
            fontSize: "0.88rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>{menuNotice}</div>
          <button
            type="button"
            onClick={() => setMenuNotice(null)}
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "#065F46" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Caterer Dietary & Menu Breakdown Card */}
      {enableMealSelection && cateringSummary && (() => {
        const totalConfirmed = cateringSummary.totalConfirmed || totalAttendees || 0;
        const totalPlatesCount = Object.values(cateringSummary.meals).reduce((s, c) => s + c, 0) || totalConfirmed;

        // Collect all distinct courses: menuOptions plus any unlisted ones with non-zero meals count
        const displayOptions = [...menuOptions];
        Object.keys(cateringSummary.meals).forEach((mealKey) => {
          if (!displayOptions.some((o) => o.id === mealKey) && cateringSummary.meals[mealKey] > 0) {
            displayOptions.push({
              id: mealKey,
              name: mealKey.charAt(0).toUpperCase() + mealKey.slice(1),
              icon: "🍽️",
              category: "special",
              enabled: false,
              description: "Legacy or custom selection",
            });
          }
        });

        const filteredAllergies = cateringSummary.allergies.filter((a) => {
          if (!allergySearch.trim()) return true;
          const q = allergySearch.toLowerCase();
          return (
            a.guestName.toLowerCase().includes(q) ||
            a.allergies.toLowerCase().includes(q) ||
            (a.tableName && a.tableName.toLowerCase().includes(q)) ||
            (a.tableNumber != null && String(a.tableNumber).includes(q)) ||
            a.meal.toLowerCase().includes(q)
          );
        });

        return (
          <>
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #caterer-summary-section, #caterer-summary-section * {
                  visibility: visible !important;
                }
                #caterer-summary-section {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            <div
              id="caterer-summary-section"
            style={{
              marginBottom: "1.75rem",
              background: "#FFFFFF",
              border: "1px solid #E4DBD3",
              borderRadius: "12px",
              padding: "1.75rem",
              boxShadow: "0 2px 14px rgba(0,0,0,0.03)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>🍽️</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontFamily: "var(--font-display, serif)", color: "#2B2425" }}>
                      Schloss Hetzendorf Caterer Summary
                    </h3>
                    <span style={{ background: "#F5EFE6", color: "#8C2836", fontSize: "0.72rem", padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: 600, border: "1px solid #E5D7CA" }}>
                      Live Head Chef Dispatch
                    </span>
                  </div>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.84rem", color: "#6A5D60" }}>
                    Live banquet covers, course selections &amp; table-seated allergy pass for kitchen head chef &amp; banquet service
                  </p>
                </div>
              </div>

              <div className="no-print" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setIsConfiguringMenu(true)}
                  style={{
                    background: "#8C2836",
                    border: "1px solid #751F2C",
                    borderRadius: "6px",
                    padding: "0.45rem 0.95rem",
                    fontSize: "0.82rem",
                    color: "#FFFFFF",
                    cursor: "pointer",
                    fontWeight: 600,
                    boxShadow: "0 2px 6px rgba(140, 40, 54, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>⚙️</span> Personalize Courses
                </button>

                <button
                  type="button"
                  onClick={exportCatererCsv}
                  style={{
                    background: "transparent",
                    border: "1px solid #D5CBC4",
                    borderRadius: "6px",
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.82rem",
                    color: "#4A3E3D",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  📄 Export Caterer Manifest (CSV)
                </button>

                <button
                  type="button"
                  onClick={handlePrintKitchenSheet}
                  style={{
                    background: "transparent",
                    border: "1px solid #D5CBC4",
                    borderRadius: "6px",
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.82rem",
                    color: "#4A3E3D",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  🖨️ Print Kitchen Pass
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.85rem",
                marginBottom: "1.25rem",
                background: "#FAF7F5",
                padding: "0.9rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid #EFEAE5",
              }}
            >
              <div>
                <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#776A6C", fontWeight: 600 }}>
                  Confirmed Banquet Covers
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2B2425", marginTop: "2px" }}>
                  {totalPlatesCount} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6A5D60" }}>plates</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#776A6C", fontWeight: 600 }}>
                  Active Menu Options
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#8C2836", marginTop: "2px" }}>
                  {menuOptions.filter((o) => o.enabled).length}{" "}
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6A5D60" }}>
                    of {menuOptions.length} courses
                  </span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#776A6C", fontWeight: 600 }}>
                  Dietary &amp; Allergy Alerts
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: cateringSummary.allergies.length > 0 ? "#DC2626" : "#059669", marginTop: "2px" }}>
                  {cateringSummary.allergies.length}{" "}
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#6A5D60" }}>
                    flagged {cateringSummary.allergies.length === 1 ? "guest" : "guests"}
                  </span>
                </div>
              </div>
            </div>

            {/* Proportional Banquet Distribution Progress Bar */}
            {totalPlatesCount > 0 && (
              <div style={{ marginBottom: "1.35rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#544648", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Proportional Banquet Distribution
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#776A6C" }}>
                    Total: {totalPlatesCount} portions
                  </span>
                </div>

                <div
                  style={{
                    height: "18px",
                    width: "100%",
                    display: "flex",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: "1px solid #E0D6CD",
                    background: "#F4EFEA",
                  }}
                >
                  {displayOptions.map((opt) => {
                    const count = cateringSummary.meals[opt.id] || 0;
                    if (count === 0) return null;
                    const pct = Math.max(1, Math.round((count / totalPlatesCount) * 100));
                    const palette = getCourseColor(opt.category || opt.id);
                    return (
                      <div
                        key={opt.id}
                        title={`${opt.icon || "🍽️"} ${opt.name}: ${count} plates (${pct}%)`}
                        style={{
                          width: `${(count / totalPlatesCount) * 100}%`,
                          backgroundColor: palette.bar,
                          transition: "width 0.3s ease",
                        }}
                      />
                    );
                  })}
                </div>

                {/* Distribution Legend */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1rem", marginTop: "0.55rem", fontSize: "0.78rem" }}>
                  {displayOptions.map((opt) => {
                    const count = cateringSummary.meals[opt.id] || 0;
                    const pct = totalPlatesCount > 0 ? Math.round((count / totalPlatesCount) * 100) : 0;
                    const palette = getCourseColor(opt.category || opt.id);
                    return (
                      <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#44393B" }}>
                        <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: palette.bar, display: "inline-block" }} />
                        <span style={{ fontWeight: 600 }}>{opt.icon || "🍽️"} {opt.name.split("(")[0].trim()}:</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Course Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "0.85rem",
                marginBottom: "1.25rem",
              }}
            >
              {displayOptions.map((opt) => {
                const count = cateringSummary.meals[opt.id] || 0;
                const pct = totalPlatesCount > 0 ? Math.round((count / totalPlatesCount) * 100) : 0;
                const palette = getCourseColor(opt.category || opt.id);

                return (
                  <div
                    key={opt.id}
                    style={{
                      background: "#FAF7F5",
                      padding: "0.95rem",
                      borderRadius: "8px",
                      border: `1px solid ${palette.border}`,
                      textAlign: "left",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "1.3rem" }}>{opt.icon || "🍽️"}</span>
                        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                          {opt.enabled === false && (
                            <span style={{ fontSize: "0.68rem", background: "#E5E7EB", color: "#4B5563", padding: "0.1rem 0.35rem", borderRadius: "4px" }}>
                              Hidden
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              background: palette.bg,
                              color: palette.text,
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                            }}
                          >
                            {opt.category || "course"}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#2B2425", lineHeight: 1.25, marginTop: "0.2rem" }}>
                        {opt.name}
                      </div>

                      {opt.description && (
                        <div style={{ fontSize: "0.74rem", color: "#776A6C", marginTop: "0.25rem", lineHeight: 1.3 }}>
                          {opt.description}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #EFEAE5", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem", fontWeight: 700, color: palette.text }}>
                        {count}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#6A5D60", fontWeight: 500 }}>
                        {pct}% of banquet
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table-Cross-Referenced Head Chef Kitchen Pass */}
            {cateringSummary.allergies.length > 0 && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  padding: "1rem 1.15rem",
                  marginTop: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem", marginBottom: "0.65rem" }}>
                  <div>
                    <strong style={{ color: "#991B1B", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span>⚠️</span> Head Chef Dietary &amp; Allergy Alert Pass ({cateringSummary.allergies.length} Flagged Plates)
                    </strong>
                    <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.78rem", color: "#B91C1C" }}>
                      Cross-referenced with Palace Table Seating so banquet servers deliver dietary plates directly to the guest&apos;s assigned table.
                    </p>
                  </div>

                  <input
                    type="search"
                    placeholder="Search allergy, guest, or table..."
                    value={allergySearch}
                    onChange={(e) => setAllergySearch(e.target.value)}
                    style={{
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.8rem",
                      borderRadius: "5px",
                      border: "1px solid #FCA5A5",
                      background: "#FFFFFF",
                      color: "#991B1B",
                      minWidth: "200px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.55rem" }}>
                  {filteredAllergies.map((a, idx) => {
                    const opt = menuOptions.find((o) => o.id === a.meal);
                    const courseLabel = opt ? `${opt.icon || "🍽️"} ${opt.name.split("(")[0].trim()}` : a.meal;
                    const isSeated = a.tableNumber != null;

                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #FCA5A5",
                          borderRadius: "6px",
                          padding: "0.6rem 0.8rem",
                          fontSize: "0.82rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.3rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.4rem" }}>
                          <span style={{ fontWeight: 700, color: "#1F2937" }}>{a.guestName}</span>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                              background: isSeated ? "#FEF3C7" : "#F3F4F6",
                              color: isSeated ? "#92400E" : "#6B7280",
                              border: `1px solid ${isSeated ? "#FDE68A" : "#E5E7EB"}`,
                            }}
                          >
                            {isSeated ? `📍 Table ${a.tableNumber}: ${a.tableName}` : "⚠️ Unassigned Table"}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                          <span style={{ color: "#4B5563" }}>Course: <strong>{courseLabel}</strong></span>
                        </div>

                        <div style={{ background: "#FFF1F2", color: "#991B1B", padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px dashed #FDA4AF", fontSize: "0.78rem" }}>
                          <strong>Restriction:</strong> {a.allergies}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      );
    })()}

      {/* Menu Personalization Modal */}
      {isConfiguringMenu && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(30, 24, 25, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              maxWidth: "780px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid #E8DFD8",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #EFEAE5", paddingBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontFamily: "var(--font-display, serif)", color: "#2B2425" }}>
                  ⚙️ Personalize Schloss Hetzendorf Banquet Menu
                </h2>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.84rem", color: "#6A5D60" }}>
                  Configure what courses are offered to guests on the RSVP form and tracked live for the kitchen head chef.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsConfiguringMenu(false)}
                style={{
                  background: "#F4EFEA",
                  border: 0,
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  fontSize: "1rem",
                  cursor: "pointer",
                  color: "#6A5D60",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Configured Courses List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#776A6C" }}>
                Current Banquet Courses ({menuOptions.length})
              </div>

              {menuOptions.map((opt) => (
                <div
                  key={opt.id}
                  style={{
                    background: opt.enabled ? "#FAF7F5" : "#F3F4F6",
                    border: `1px solid ${opt.enabled ? "#E6DDD6" : "#E5E7EB"}`,
                    borderRadius: "8px",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.55rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Active toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: opt.enabled ? "#047857" : "#6B7280" }}>
                      <input
                        type="checkbox"
                        checked={opt.enabled}
                        onChange={() => handleToggleOption(opt.id)}
                        style={{ cursor: "pointer" }}
                      />
                      {opt.enabled ? "Active on RSVP" : "Hidden"}
                    </label>

                    {/* Icon input */}
                    <input
                      type="text"
                      title="Course Icon / Emoji"
                      value={opt.icon || "🍽️"}
                      onChange={(e) => handleUpdateOption(opt.id, { icon: e.target.value })}
                      style={{
                        width: "48px",
                        textAlign: "center",
                        fontSize: "1.1rem",
                        padding: "0.3rem",
                        borderRadius: "5px",
                        border: "1px solid #D5CBC4",
                        background: "#FFFFFF",
                      }}
                    />

                    {/* Course Title */}
                    <input
                      type="text"
                      placeholder="Course Title"
                      value={opt.name}
                      onChange={(e) => handleUpdateOption(opt.id, { name: e.target.value })}
                      style={{
                        flex: 1,
                        minWidth: "220px",
                        padding: "0.4rem 0.7rem",
                        fontSize: "0.88rem",
                        borderRadius: "5px",
                        border: "1px solid #D5CBC4",
                        fontWeight: 600,
                        background: "#FFFFFF",
                      }}
                    />

                    {/* Category */}
                    <select
                      value={opt.category || "special"}
                      onChange={(e) => handleUpdateOption(opt.id, { category: e.target.value as StoredMenuOption["category"] })}
                      style={{
                        padding: "0.4rem 0.6rem",
                        fontSize: "0.82rem",
                        borderRadius: "5px",
                        border: "1px solid #D5CBC4",
                        background: "#FFFFFF",
                      }}
                    >
                      <option value="meat">Meat / Classic</option>
                      <option value="fish">Fish / Seafood</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="kids">Children</option>
                      <option value="special">Specialty</option>
                    </select>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id)}
                      disabled={menuOptions.length <= 1}
                      title="Remove Course"
                      style={{
                        background: "transparent",
                        border: "1px solid #E5D7CA",
                        borderRadius: "5px",
                        color: "#DC2626",
                        cursor: menuOptions.length <= 1 ? "not-allowed" : "pointer",
                        padding: "0.35rem 0.6rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Culinary description */}
                  <input
                    type="text"
                    placeholder="Culinary notes / ingredients (e.g. Baroque roasted with parsnip puree & red wine jus)"
                    value={opt.description || ""}
                    onChange={(e) => handleUpdateOption(opt.id, { description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.8rem",
                      borderRadius: "5px",
                      border: "1px solid #E0D6CD",
                      color: "#4A3E3D",
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Add New Banquet Course */}
            <div
              style={{
                background: "#FAF7F5",
                border: "1px dashed #C8B9AD",
                borderRadius: "8px",
                padding: "1rem 1.15rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#44393B" }}>
                ＋ Add New Banquet Course
              </div>

              <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", alignItems: "center" }}>
                {/* Emoji quick presets */}
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {["🥩", "🐟", "🥗", "🌿", "🧒", "🦆", "🍷", "🧀", "🍰"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewCourseIcon(em)}
                      style={{
                        background: newCourseIcon === em ? "#8C2836" : "#FFFFFF",
                        color: newCourseIcon === em ? "#FFFFFF" : "inherit",
                        border: "1px solid #D5CBC4",
                        borderRadius: "4px",
                        padding: "0.25rem 0.4rem",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="New Course Name (e.g. Imperial Duck Breast)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: "200px",
                    padding: "0.4rem 0.65rem",
                    fontSize: "0.85rem",
                    borderRadius: "5px",
                    border: "1px solid #D5CBC4",
                    background: "#FFFFFF",
                  }}
                />

                <select
                  value={newCourseCategory}
                  onChange={(e) => setNewCourseCategory((e.target.value as NonNullable<StoredMenuOption["category"]>) || "meat")}
                  style={{
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.82rem",
                    borderRadius: "5px",
                    border: "1px solid #D5CBC4",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="meat">Meat / Classic</option>
                  <option value="fish">Fish / Seafood</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="kids">Children</option>
                  <option value="special">Specialty</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddOption}
                  style={{
                    background: "#2563EB",
                    color: "#FFFFFF",
                    border: 0,
                    borderRadius: "5px",
                    padding: "0.45rem 0.95rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add Course
                </button>
              </div>

              <input
                type="text"
                placeholder="Course description / culinary details..."
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.8rem",
                  borderRadius: "5px",
                  border: "1px solid #E0D6CD",
                  background: "#FFFFFF",
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #EFEAE5", paddingTop: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={handleResetDefaults}
                style={{
                  background: "transparent",
                  border: "1px solid #D5CBC4",
                  borderRadius: "6px",
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.82rem",
                  color: "#6A5D60",
                  cursor: "pointer",
                }}
              >
                ↺ Reset Imperial Defaults
              </button>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => setIsConfiguringMenu(false)}
                  style={{
                    background: "#F4EFEA",
                    border: 0,
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    color: "#544648",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveMenuConfiguration}
                  disabled={isSavingMenu}
                  style={{
                    background: "#8C2836",
                    color: "#FFFFFF",
                    border: 0,
                    borderRadius: "6px",
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: isSavingMenu ? "wait" : "pointer",
                    boxShadow: "0 2px 8px rgba(140, 40, 54, 0.2)",
                  }}
                >
                  {isSavingMenu ? "Saving Courses..." : "💾 Save Menu Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Filter by guest name, dietary requirement, or note..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "240px",
            padding: "0.55rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #D5CBC4",
            fontSize: "0.9rem",
            background: "#FFFFFF",
          }}
        />

        <div style={{ display: "flex", gap: "0.3rem" }}>
          {(["all", "yes", "no", "pending"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                background: filter === opt ? "#8C2836" : "#FFFFFF",
                color: filter === opt ? "#FFFFFF" : "#544648",
                fontSize: "0.82rem",
                fontWeight: 500,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {opt === "all" ? "All" : opt}
            </button>
          ))}
        </div>
      </div>

      {/* RSVPs Table */}
      <div className="admin-table-scroll-wrap">
        <table style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#F7F3EF", borderBottom: "1px solid #E4DBD3", color: "#6A5E60", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "0.75rem 1rem" }}>Invitation</th>
              <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem" }}>Count</th>
              <th style={{ padding: "0.75rem 1rem" }}>Attending Guests</th>
              <th style={{ padding: "0.75rem 1rem" }}>Dietary Requirements</th>
              <th style={{ padding: "0.75rem 1rem" }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "#8E7F81" }}>
                  No RSVPs found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.invitationId} style={{ borderBottom: "1px solid #EFEAE5" }}>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#2B2425" }}>{r.displayName}</p>
                    {r.groupName && <span style={{ fontSize: "0.78rem", color: "#776A6C" }}>{r.groupName}</span>}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "999px",
                        fontWeight: 600,
                        background:
                          r.status === "yes"
                            ? "#E8F2E6"
                            : r.status === "no"
                              ? "#FBE9EB"
                              : "#F4EFEA",
                        color:
                          r.status === "yes"
                            ? "#35652D"
                            : r.status === "no"
                              ? "#9C2836"
                              : "#8E7D6F",
                      }}
                    >
                      {r.status === "yes" ? "Attending" : r.status === "no" ? "Declined" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>
                    {r.status === "yes" ? (
                      <span style={{ color: "#2B2425" }}>
                        {r.attendeeCount} / {r.maxGuests}
                      </span>
                    ) : r.status === "no" ? (
                      <span style={{ color: "#9C2836" }}>0</span>
                    ) : (
                      <span style={{ color: "#A89C9E" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", minWidth: "160px" }}>
                    {r.status === "yes" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ fontWeight: 600, color: "#2B2425", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <span>1.</span> {getPrimaryGuestName(r.displayName)}
                          {r.attendeeCount === 1 && r.maxGuests > 1 && (
                            <span style={{ fontSize: "0.72rem", background: "#F4EFEA", color: "#776A6C", padding: "0.1rem 0.4rem", borderRadius: "3px" }}>
                              Solo
                            </span>
                          )}
                        </div>
                        {r.guestNames.map((name, i) => (
                          <div key={i} style={{ color: "#544648", fontSize: "0.84rem", paddingLeft: "0.4rem", borderLeft: "2px solid #D5CBC4" }}>
                            <span>{i + 2}.</span> {name}{" "}
                            {i === 0 && r.maxGuests === 2 ? (
                              <span style={{ color: "#8C2836", fontWeight: 600, fontSize: "0.74rem" }}>(+1)</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : r.status === "no" ? (
                      <span style={{ color: "#9C2836", fontSize: "0.82rem", fontStyle: "italic" }}>Declined</span>
                    ) : (
                      <span style={{ color: "#A89C9E", fontSize: "0.82rem" }}>Awaiting reply</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", maxWidth: "220px" }}>
                    {r.dietaryRequirements ? (
                      <span
                        style={{
                          display: "inline-block",
                          background: "#FEF7EE",
                          color: "#874D00",
                          border: "1px solid #F8DDB7",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.82rem",
                          fontWeight: 500,
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {r.dietaryRequirements}
                      </span>
                    ) : (
                      <span style={{ color: "#B5A8AA" }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", maxWidth: "240px" }}>
                    {r.notes ? (
                      <span
                        style={{
                          display: "inline-block",
                          fontStyle: "italic",
                          color: "#44393B",
                          fontSize: "0.84rem",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        “{r.notes}”
                      </span>
                    ) : (
                      <span style={{ color: "#B5A8AA" }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
