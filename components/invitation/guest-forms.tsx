"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { recordInvitationInteraction } from "@/lib/client/invitation-events";
import { useSound } from "@/lib/sound";
import type { Locale } from "@/lib/wedding-config";

type RsvpState = "yes" | "no" | "";

type InvitationFormProps = {
  id: string;
  token: string;
  displayName: string;
  maxGuests: number;
  plusOneAllowed: boolean;
};

async function readErrorCode(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("error" in body)) return "service_unavailable";
  return typeof body.error === "string" ? body.error : "service_unavailable";
}

const mealLabels: Record<string, {
  sectionTitle: string;
  sectionSubtitle: string;
  guestHeader: string;
  mealType: string;
  allergiesLabel: string;
  allergiesPlaceholder: string;
  options: Record<string, string>;
}> = {
  en: {
    sectionTitle: "Menu Preference & Dietary Requirements",
    sectionSubtitle: "Please select meat, vegan, or vegetarian for each guest and note any allergies.",
    guestHeader: "Guest",
    mealType: "Menu Choice",
    allergiesLabel: "Specific Allergies / Dietary Restrictions",
    allergiesPlaceholder: "e.g. Celiac (gluten-free), nut allergy, lactose...",
    options: {
      meat: "🥩 Meat",
      vegan: "🌱 Vegan",
      vegetarian: "🥗 Vegetarian",
    },
  },
  es: {
    sectionTitle: "Preferencia de Menú y Alergias por Invitado",
    sectionSubtitle: "Por favor indica si prefieres carne, vegano o vegetariano, e infórmanos de cualquier alergia.",
    guestHeader: "Invitado/a",
    mealType: "Preferencia de Menú",
    allergiesLabel: "Alergias o Intolerancias Específicas",
    allergiesPlaceholder: "ej. Celíaco (sin gluten), frutos secos, lactosa...",
    options: {
      meat: "🥩 Carne",
      vegan: "🌱 Vegano",
      vegetarian: "🥗 Vegetariano",
    },
  },
  "de-AT": {
    sectionTitle: "Menüauswahl & Allergien pro Gast",
    sectionSubtitle: "Bitte wähle Fleisch, Vegan oder Vegetarisch für jeden Gast und gib allfällige Allergien an.",
    guestHeader: "Gast",
    mealType: "Menü-Wahl",
    allergiesLabel: "Spezifische Allergien & Unverträglichkeiten",
    allergiesPlaceholder: "z.B. Zöliakie (glutenfrei), Laktose, Nussallergie...",
    options: {
      meat: "🥩 Fleisch",
      vegan: "🌱 Vegan",
      vegetarian: "🥗 Vegetarisch",
    },
  },
  hu: {
    sectionTitle: "Menüválasztás és Ételérzékenységek Vendégenként",
    sectionSubtitle: "Kérjük, válaszd ki a húsos, vegán vagy vegetáriánus menüt minden vendégnek, és jelezd az allergiákat.",
    guestHeader: "Vendég",
    mealType: "Menü Választás",
    allergiesLabel: "Allergiák és Ételérzékenységek",
    allergiesPlaceholder: "pl. Lisztérzékenység (gluténmentes), laktóz, dióféle...",
    options: {
      meat: "🥩 Húsos",
      vegan: "🌱 Vegán",
      vegetarian: "🥗 Vegetáriánus",
    },
  },
};

export interface CustomMenuOptionItem {
  id: string;
  name: string;
  icon?: string;
  enabled: boolean;
}

function getInitialPrimaryName(displayName: string): string {
  const cleaned = displayName
    .replace(/\s*\(Demo\)/i, "")
    .replace(/\s*(&|\+)\s*(Guest|Invitado|Gast|Vendég|Acompañante|Begleitperson)/i, "")
    .trim();
  return cleaned || displayName;
}

interface GuestMealState {
  meal: string;
  allergies: string;
}

export function RsvpForm({
  invitation,
  enableMealSelection = true,
  customMenuOptions,
}: {
  invitation: InvitationFormProps;
  enableMealSelection?: boolean;
  customMenuOptions?: CustomMenuOptionItem[];
}) {
  const locale = useLocale();
  const typedLocale = locale as Locale;
  const t = useTranslations("rsvp");
  const { play } = useSound();
  const hasTrackedStart = useRef(false);
  const dict = mealLabels[locale] || mealLabels.en;

  const maxInvited = Math.max(1, invitation.maxGuests);
  const hasPlusOneOption = Boolean(invitation.plusOneAllowed);
  const isMultiSeatParty = maxInvited > 1;

  const [primaryName, setPrimaryName] = useState(() => getInitialPrimaryName(invitation.displayName));
  const [primaryMeal, setPrimaryMeal] = useState<GuestMealState>({ meal: "meat", allergies: "" });

  const [additionalGuestNames, setAdditionalGuestNames] = useState<string[]>(() =>
    Array(Math.max(0, maxInvited - 1)).fill("")
  );
  const [additionalMeals, setAdditionalMeals] = useState<GuestMealState[]>(() =>
    Array(Math.max(0, maxInvited - 1)).fill({ meal: "meat", allergies: "" })
  );

  const [plusOneSelected, setPlusOneSelected] = useState<"yes" | "no">("yes");
  const [plusOneName, setPlusOneName] = useState("");
  const [companionMeal, setCompanionMeal] = useState<GuestMealState>({ meal: "meat", allergies: "" });

  const [invitedAttendingCount, setInvitedAttendingCount] = useState<number>(maxInvited);
  const [attendance, setAttendance] = useState<RsvpState>("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState<"yes" | "no" | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const endpoint = `/api/invitation/${encodeURIComponent(invitation.token)}/rsvp`;

  const handleAdditionalNameChange = (index: number, value: string) => {
    setAdditionalGuestNames((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push("");
      next[index] = value;
      return next;
    });
  };

  const handleAdditionalMealChange = (index: number, meal: string) => {
    setAdditionalMeals((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push({ meal: "meat", allergies: "" });
      next[index] = { ...next[index], meal };
      return next;
    });
  };

  const handleAdditionalAllergiesChange = (index: number, allergies: string) => {
    setAdditionalMeals((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push({ meal: "meat", allergies: "" });
      next[index] = { ...next[index], allergies };
      return next;
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadExistingRsvp() {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const body: unknown = await response.json();
        if (typeof body !== "object" || body === null || !("rsvp" in body) || !body.rsvp) return;

        const saved = body.rsvp as {
          attendanceStatus: "yes" | "no";
          attendeeCount: number;
          guestNames: string[];
          dietaryRequirements: string | null;
          notes: string | null;
          mealPreferences?: Array<{ guestName: string; meal: string; allergies?: string }>;
        };

        setAttendance(saved.attendanceStatus);
        setDietaryRequirements(saved.dietaryRequirements ?? "");
        setNotes(saved.notes ?? "");

        if (saved.attendanceStatus === "yes" && saved.attendeeCount > 0) {
          const totalSaved = saved.attendeeCount;
          let bringsCompanion = false;
          let invCount = totalSaved;
          let pOneName = "";
          let addNames: string[] = [];

          if (hasPlusOneOption) {
            if (totalSaved > maxInvited || (maxInvited === 1 && totalSaved === 2)) {
              bringsCompanion = true;
              invCount = Math.min(maxInvited, Math.max(1, totalSaved - 1));
              const neededAdd = Math.max(0, invCount - 1);
              addNames = saved.guestNames.slice(0, neededAdd);
              pOneName = saved.guestNames[neededAdd] || "";
            } else {
              bringsCompanion = false;
              invCount = Math.min(maxInvited, Math.max(1, totalSaved));
              addNames = saved.guestNames.slice(0, Math.max(0, invCount - 1));
            }
          } else {
            invCount = Math.min(maxInvited, Math.max(1, totalSaved));
            addNames = saved.guestNames.slice(0, Math.max(0, invCount - 1));
          }

          setInvitedAttendingCount(invCount);
          setPlusOneSelected(bringsCompanion ? "yes" : "no");
          setPlusOneName(pOneName);
          setAdditionalGuestNames(addNames);

          if (saved.mealPreferences && saved.mealPreferences.length > 0) {
            const p0 = saved.mealPreferences[0];
            if (p0) {
              if (p0.guestName && p0.guestName !== invitation.displayName) {
                setPrimaryName(p0.guestName);
              }
              setPrimaryMeal({ meal: p0.meal || "classic", allergies: p0.allergies || "" });
            }

            const neededAdd = Math.max(0, invCount - 1);
            const restoredAddMeals: GuestMealState[] = [];
            for (let i = 0; i < neededAdd; i++) {
              const pref = saved.mealPreferences[1 + i];
              restoredAddMeals.push({
                meal: pref?.meal || "classic",
                allergies: pref?.allergies || "",
              });
            }
            setAdditionalMeals(restoredAddMeals);

            if (bringsCompanion && saved.mealPreferences.length > 1 + neededAdd) {
              const compPref = saved.mealPreferences[1 + neededAdd];
              setCompanionMeal({
                meal: compPref?.meal || "classic",
                allergies: compPref?.allergies || "",
              });
            }
          }
        }
      } catch {
        if (!controller.signal.aborted) setErrorMessage(t("loadError"));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadExistingRsvp();
    return () => controller.abort();
  }, [endpoint, t, hasPlusOneOption, maxInvited, invitation.displayName]);

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmation(null);

    if (!attendance) {
      setErrorMessage(t("chooseAttendance"));
      return;
    }

    let finalCount = 0;
    let finalGuestNames: string[] = [];
    let mealPreferences: Array<{ guestName: string; meal: string; allergies?: string }> | undefined = undefined;

    if (attendance === "yes") {
      const actualInvitedCount = isMultiSeatParty ? invitedAttendingCount : 1;
      const bringsCompanion = hasPlusOneOption && plusOneSelected === "yes";

      const validPrimaryName = primaryName.trim() || getInitialPrimaryName(invitation.displayName);
      const validAdditionalNames: string[] = [];

      for (let i = 0; i < actualInvitedCount - 1; i++) {
        const name = (additionalGuestNames[i] || "").trim();
        if (!name) {
          setErrorMessage(t("additionalNamesRequired"));
          return;
        }
        validAdditionalNames.push(name);
      }

      let validCompanionName = "";
      if (bringsCompanion) {
        validCompanionName = plusOneName.trim();
        if (!validCompanionName) {
          setErrorMessage(t("plusOneNameRequired"));
          return;
        }
      }

      finalCount = actualInvitedCount + (bringsCompanion ? 1 : 0);
      finalGuestNames = [...validAdditionalNames, ...(bringsCompanion ? [validCompanionName] : [])];

      if (enableMealSelection) {
        mealPreferences = [
          {
            guestName: validPrimaryName,
            meal: primaryMeal.meal || "classic",
            allergies: primaryMeal.allergies.trim() || undefined,
          },
          ...validAdditionalNames.map((name, i) => ({
            guestName: name,
            meal: additionalMeals[i]?.meal || "classic",
            allergies: additionalMeals[i]?.allergies.trim() || undefined,
          })),
          ...(bringsCompanion
            ? [
                {
                  guestName: validCompanionName,
                  meal: companionMeal.meal || "classic",
                  allergies: companionMeal.allergies.trim() || undefined,
                },
              ]
            : []),
        ];
      }
    }

    const combinedAllergies = mealPreferences
      ?.filter((m) => Boolean(m.allergies))
      .map((m) => `${m.guestName}: ${m.allergies}`)
      .join("; ");
    const finalDietary = combinedAllergies || (dietaryRequirements.trim() || undefined);

    setIsSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceStatus: attendance,
          attendeeCount: finalCount,
          guestNames: finalGuestNames,
          dietaryRequirements: attendance === "yes" ? finalDietary : undefined,
          mealPreferences: attendance === "yes" && enableMealSelection ? mealPreferences : undefined,
          notes: notes.trim() || undefined,
          language: typedLocale,
        }),
      });

      if (!response.ok) {
        const code = await readErrorCode(response);
        setErrorMessage(
          code === "guest_limit"
            ? t("guestLimitError")
            : code === "rate_limited"
            ? t("rateLimitError")
            : t("saveError"),
        );
        return;
      }

      play("rsvp-success");
      setConfirmation(attendance);
    } catch {
      setErrorMessage(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rsvp-section" id="rsvp" aria-labelledby="rsvp-title">
      <div className="section-heading">
        <p className="section-label">{t("label")}</p>
        <h2 id="rsvp-title">{t("title")}</h2>
      </div>
      {confirmation ? (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="rsvp-confirmation"
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          role="status"
          style={{ textAlign: "center", padding: "3rem 1.5rem" }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.34, 1.3, 0.64, 1] }}
        >
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0.4, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.4, 0.64, 1] }}
            style={{ width: "96px", height: "96px", margin: "0 auto 1.5rem" }}
          >
            <Image
              src="/orchids/orchid-single-bloom.svg"
              alt="Celebration Orchid Bloom"
              width={96}
              height={96}
            />
          </motion.div>
          <span style={{ fontSize: "1.4rem", color: "#8C2836", display: "inline-block", marginBottom: "0.5rem" }} aria-hidden="true">
            ♥
          </span>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", color: "#2B2425", margin: "0 0 0.75rem 0" }}>
            {confirmation === "yes" ? t("confirmedTitle") : t("declinedTitle")}
          </h3>
          <p style={{ color: "#5F5456", maxWidth: "480px", margin: "0 auto", fontSize: "0.95rem", lineHeight: 1.6 }}>
            {t(confirmation === "yes" ? "confirmedMessage" : "declinedMessage", { name: primaryName.trim() || invitation.displayName })}
          </p>
          <button
            className="text-button"
            onClick={() => setConfirmation(null)}
            type="button"
            style={{ marginTop: "1rem" }}
          >
            {locale === "es" ? "Modificar mi respuesta" : locale === "de" ? "Antwort bearbeiten" : locale === "hu" ? "Válasz módosítása" : "Edit my response"}
          </button>
        </motion.div>
      ) : (
        <form
          className="guest-form"
          onFocusCapture={() => {
            if (hasTrackedStart.current) return;
            hasTrackedStart.current = true;
            recordInvitationInteraction({
              token: invitation.token,
              invitationId: invitation.id,
              eventType: "RSVP_STARTED",
              locale: typedLocale,
            });
          }}
          onSubmit={submitRsvp}
          aria-busy={isLoading || isSaving}
        >
          <fieldset className="guest-form__fieldset">
            <legend>{t("attendanceQuestion")}</legend>
            <label className="choice-row">
              <input
                checked={attendance === "yes"}
                name="attendance"
                onChange={() => setAttendance("yes")}
                type="radio"
                value="yes"
              />
              <span>{t("attending")}</span>
            </label>
            <label className="choice-row">
              <input
                checked={attendance === "no"}
                name="attendance"
                onChange={() => setAttendance("no")}
                type="radio"
                value="no"
              />
              <span>{t("declining")}</span>
            </label>
          </fieldset>

          {attendance === "yes" && (
            <div className="guest-form__fields">
              {/* Question 1: How many invited guests attending (if multi-seat party) */}
              {isMultiSeatParty && (
                <div
                  style={{
                    padding: "1.1rem 1.25rem",
                    borderRadius: "0.85rem",
                    background: "rgba(255, 255, 255, 0.75)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <label
                    htmlFor="invited-attending-count"
                    style={{
                      display: "block",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#2C1810",
                      marginBottom: "0.6rem",
                    }}
                  >
                    👥 {t("howManyAttending", { max: maxInvited })}
                  </label>
                  <select
                    id="invited-attending-count"
                    value={invitedAttendingCount}
                    onChange={(e) =>
                      setInvitedAttendingCount(
                        Math.min(maxInvited, Math.max(1, Number(e.target.value)))
                      )
                    }
                    style={{
                      width: "100%",
                      maxWidth: "280px",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(212, 175, 55, 0.5)",
                      background: "#FFFDF9",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#2C1810",
                    }}
                  >
                    {Array.from({ length: maxInvited }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? t("guestNumber", { number: 1 }).replace(" 1", "") : (locale === "es" ? "invitados" : locale === "de" ? "Gäste" : locale === "hu" ? "vendég" : "guests")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Question 2: Companion Plus-One Toggle (if plusOneAllowed) */}
              {hasPlusOneOption && (
                <div
                  style={{
                    padding: "1.1rem 1.25rem",
                    borderRadius: "0.85rem",
                    background: "rgba(255, 255, 255, 0.75)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      color: "#2C1810",
                      margin: "0 0 0.65rem 0",
                      fontSize: "0.95rem",
                      lineHeight: 1.45,
                    }}
                  >
                    ✨ {t("plusOnePrompt")}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <label className="choice-row">
                      <input
                        type="radio"
                        name="plusOneChoice"
                        value="yes"
                        checked={plusOneSelected === "yes"}
                        onChange={() => setPlusOneSelected("yes")}
                      />
                      <span style={{ fontSize: "0.92rem", color: "#2C1810" }}>{t("plusOneYes")}</span>
                    </label>
                    <label className="choice-row">
                      <input
                        type="radio"
                        name="plusOneChoice"
                        value="no"
                        checked={plusOneSelected === "no"}
                        onChange={() => setPlusOneSelected("no")}
                      />
                      <span style={{ fontSize: "0.92rem", color: "#2C1810" }}>{t("plusOneNo")}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Guest Confirmation and Meal Selection Cards */}
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                  <h3
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "1.15rem",
                      color: "#2C1810",
                      margin: "0 0 0.35rem 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>📜</span>
                    {t("confirmGuestsTitle")}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.88rem",
                      color: "#6b5b52",
                      lineHeight: 1.45,
                    }}
                  >
                    {t("confirmGuestsSubtitle")}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Card 1: Primary Guest */}
                  <div
                    style={{
                      padding: "1.25rem",
                      borderRadius: "0.9rem",
                      background: "rgba(255, 255, 255, 0.85)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(212, 175, 55, 0.45)",
                      boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.9rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <span style={{ fontSize: "1.15rem" }}>👑</span>
                        <span
                          style={{
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 600,
                            fontSize: "1rem",
                            color: "#2C1810",
                          }}
                        >
                          {t("primaryGuest")}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "999px",
                          background: "rgba(212, 175, 55, 0.15)",
                          color: "#725816",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {t("guestNumber", { number: 1 })}
                      </span>
                    </div>

                    <div className="field-group">
                      <label
                        htmlFor="primary-guest-name"
                        style={{ fontWeight: 600, fontSize: "0.85rem", color: "#4a3e3d" }}
                      >
                        {t("confirmGuestNameLabel")} <span style={{ color: "#8C2836" }}>*</span>
                      </label>
                      <input
                        id="primary-guest-name"
                        type="text"
                        autoComplete="name"
                        placeholder={t("confirmGuestNamePlaceholder")}
                        value={primaryName}
                        onChange={(e) => setPrimaryName(e.target.value)}
                        required
                        style={{
                          background: "#FFFDF9",
                          border: "1px solid rgba(212, 175, 55, 0.4)",
                          borderRadius: "0.5rem",
                          padding: "0.6rem 0.75rem",
                          fontSize: "0.95rem",
                          color: "#2C1810",
                        }}
                      />
                    </div>

                    {enableMealSelection && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: "0.75rem",
                          paddingTop: "0.5rem",
                          borderTop: "1px dashed rgba(212, 175, 55, 0.35)",
                        }}
                      >
                        <div>
                          <label
                            htmlFor="primary-meal-select"
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "#4a3e3d",
                              marginBottom: "0.25rem",
                            }}
                          >
                            🍽️ {dict.mealType}
                          </label>
                          <select
                            id="primary-meal-select"
                            value={primaryMeal.meal === "classic" ? "meat" : primaryMeal.meal}
                            onChange={(e) =>
                              setPrimaryMeal((prev) => ({ ...prev, meal: e.target.value }))
                            }
                            style={{
                              width: "100%",
                              padding: "0.55rem 0.75rem",
                              borderRadius: "0.5rem",
                              border: "1px solid rgba(212, 175, 55, 0.4)",
                              background: "#FFFDF9",
                              fontSize: "0.85rem",
                              color: "#2C1810",
                            }}
                          >
                            {Object.entries(dict.options).map(([optKey, optText]) => (
                              <option key={optKey} value={optKey}>
                                {optText}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="primary-allergy-input"
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "#4a3e3d",
                              marginBottom: "0.25rem",
                            }}
                          >
                            ⚠️ {dict.allergiesLabel}
                          </label>
                          <input
                            id="primary-allergy-input"
                            type="text"
                            placeholder={dict.allergiesPlaceholder}
                            value={primaryMeal.allergies}
                            onChange={(e) =>
                              setPrimaryMeal((prev) => ({ ...prev, allergies: e.target.value }))
                            }
                            style={{
                              width: "100%",
                              padding: "0.55rem 0.75rem",
                              borderRadius: "0.5rem",
                              border: "1px solid rgba(212, 175, 55, 0.35)",
                              background: "#FFFDF9",
                              fontSize: "0.85rem",
                              color: "#2C1810",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cards 2..N: Additional Invited Guests */}
                  {Array.from(
                    { length: Math.max(0, (isMultiSeatParty ? invitedAttendingCount : 1) - 1) },
                    (_, i) => {
                      const guestNum = i + 2;
                      const gName = additionalGuestNames[i] || "";
                      const gMeal = additionalMeals[i]?.meal || "classic";
                      const gAllergies = additionalMeals[i]?.allergies || "";

                      return (
                        <div
                          key={`additional-guest-${i}`}
                          style={{
                            padding: "1.25rem",
                            borderRadius: "0.9rem",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(6px)",
                            border: "1px solid rgba(212, 175, 55, 0.45)",
                            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.9rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "0.5rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <span style={{ fontSize: "1.15rem" }}>👤</span>
                              <span
                                style={{
                                  fontFamily: "'Cinzel', serif",
                                  fontWeight: 600,
                                  fontSize: "1rem",
                                  color: "#2C1810",
                                }}
                              >
                                {t("guestNumber", { number: guestNum })}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                padding: "0.2rem 0.6rem",
                                borderRadius: "999px",
                                background: "rgba(212, 175, 55, 0.15)",
                                color: "#725816",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {locale === "es" ? "Invitado Confirmado" : locale === "de" ? "Eingeladener Gast" : locale === "hu" ? "Meghívott Vendég" : "Invited Guest"}
                            </span>
                          </div>

                          <div className="field-group">
                            <label
                              htmlFor={`guest-name-${i}`}
                              style={{ fontWeight: 600, fontSize: "0.85rem", color: "#4a3e3d" }}
                            >
                              {t("confirmGuestNameLabel")} <span style={{ color: "#8C2836" }}>*</span>
                            </label>
                            <input
                              id={`guest-name-${i}`}
                              type="text"
                              autoComplete="off"
                              placeholder={t("confirmGuestNamePlaceholder")}
                              value={gName}
                              onChange={(e) => handleAdditionalNameChange(i, e.target.value)}
                              required
                              style={{
                                background: "#FFFDF9",
                                border: "1px solid rgba(212, 175, 55, 0.4)",
                                borderRadius: "0.5rem",
                                padding: "0.6rem 0.75rem",
                                fontSize: "0.95rem",
                                color: "#2C1810",
                              }}
                            />
                          </div>

                          {enableMealSelection && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "0.75rem",
                                paddingTop: "0.5rem",
                                borderTop: "1px dashed rgba(212, 175, 55, 0.35)",
                              }}
                            >
                              <div>
                                <label
                                  htmlFor={`guest-meal-${i}`}
                                  style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "#4a3e3d",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  🍽️ {dict.mealType}
                                </label>
                                <select
                                  id={`guest-meal-${i}`}
                                  value={gMeal === "classic" ? "meat" : gMeal}
                                  onChange={(e) => handleAdditionalMealChange(i, e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "0.55rem 0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid rgba(212, 175, 55, 0.4)",
                                    background: "#FFFDF9",
                                    fontSize: "0.85rem",
                                    color: "#2C1810",
                                  }}
                                >
                                  {Object.entries(dict.options).map(([optKey, optText]) => (
                                    <option key={optKey} value={optKey}>
                                      {optText}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label
                                  htmlFor={`guest-allergy-${i}`}
                                  style={{
                                    display: "block",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                    color: "#4a3e3d",
                                    marginBottom: "0.25rem",
                                  }}
                                >
                                  ⚠️ {dict.allergiesLabel}
                                </label>
                                <input
                                  id={`guest-allergy-${i}`}
                                  type="text"
                                  placeholder={dict.allergiesPlaceholder}
                                  value={gAllergies}
                                  onChange={(e) => handleAdditionalAllergiesChange(i, e.target.value)}
                                  style={{
                                    width: "100%",
                                    padding: "0.55rem 0.75rem",
                                    borderRadius: "0.5rem",
                                    border: "1px solid rgba(212, 175, 55, 0.35)",
                                    background: "#FFFDF9",
                                    fontSize: "0.85rem",
                                    color: "#2C1810",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}

                  {/* Plus-One Companion Card (if plusOneAllowed & plusOneSelected === "yes") */}
                  {hasPlusOneOption && plusOneSelected === "yes" && (
                    <div
                      style={{
                        padding: "1.25rem",
                        borderRadius: "0.9rem",
                        background: "rgba(255, 255, 255, 0.88)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(140, 40, 54, 0.35)",
                        boxShadow: "0 4px 18px rgba(140, 40, 54, 0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.9rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                          <span style={{ fontSize: "1.15rem" }}>✨</span>
                          <span
                            style={{
                              fontFamily: "'Cinzel', serif",
                              fontWeight: 600,
                              fontSize: "1rem",
                              color: "#8C2836",
                            }}
                          >
                            {t("companionGuest")}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "999px",
                            background: "rgba(140, 40, 54, 0.1)",
                            color: "#8C2836",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          +1 Companion
                        </span>
                      </div>

                      <div className="field-group">
                        <label
                          htmlFor="plus-one-name-input"
                          style={{ fontWeight: 600, fontSize: "0.85rem", color: "#4a3e3d" }}
                        >
                          {t("confirmGuestNameLabel")} <span style={{ color: "#8C2836" }}>*</span>
                        </label>
                        <input
                          id="plus-one-name-input"
                          type="text"
                          autoComplete="off"
                          placeholder={t("confirmGuestNamePlaceholder")}
                          value={plusOneName}
                          onChange={(e) => setPlusOneName(e.target.value)}
                          required
                          style={{
                            background: "#FFFDF9",
                            border: "1px solid rgba(140, 40, 54, 0.4)",
                            borderRadius: "0.5rem",
                            padding: "0.6rem 0.75rem",
                            fontSize: "0.95rem",
                            color: "#2C1810",
                          }}
                        />
                      </div>

                      {enableMealSelection && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "0.75rem",
                            paddingTop: "0.5rem",
                            borderTop: "1px dashed rgba(140, 40, 54, 0.25)",
                          }}
                        >
                          <div>
                            <label
                              htmlFor="companion-meal-select"
                              style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#4a3e3d",
                                marginBottom: "0.25rem",
                              }}
                            >
                              🍽️ {dict.mealType}
                            </label>
                            <select
                              id="companion-meal-select"
                              value={companionMeal.meal === "classic" ? "meat" : companionMeal.meal}
                              onChange={(e) =>
                                setCompanionMeal((prev) => ({ ...prev, meal: e.target.value }))
                              }
                              style={{
                                width: "100%",
                                padding: "0.55rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(140, 40, 54, 0.35)",
                                background: "#FFFDF9",
                                fontSize: "0.85rem",
                                color: "#2C1810",
                              }}
                            >
                              {Object.entries(dict.options).map(([optKey, optText]) => (
                                <option key={optKey} value={optKey}>
                                  {optText}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              htmlFor="companion-allergy-input"
                              style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "#4a3e3d",
                                marginBottom: "0.25rem",
                              }}
                            >
                              ⚠️ {dict.allergiesLabel}
                            </label>
                            <input
                              id="companion-allergy-input"
                              type="text"
                              placeholder={dict.allergiesPlaceholder}
                              value={companionMeal.allergies}
                              onChange={(e) =>
                                setCompanionMeal((prev) => ({ ...prev, allergies: e.target.value }))
                              }
                              style={{
                                width: "100%",
                                padding: "0.55rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid rgba(140, 40, 54, 0.25)",
                                background: "#FFFDF9",
                                fontSize: "0.85rem",
                                color: "#2C1810",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="field-group">
            <label htmlFor="rsvp-notes">{t("notesLabel")}</label>
            <textarea
              autoComplete="off"
              id="rsvp-notes"
              name="notes"
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              value={notes}
            />
          </div>
          {errorMessage && <p className="form-message form-message--error" role="alert">{errorMessage}</p>}
          <button className="text-button" disabled={isLoading || isSaving} type="submit">
            {isSaving ? t("saving") : t("submit")}
          </button>
        </form>
      )}
    </section>
  );
}
