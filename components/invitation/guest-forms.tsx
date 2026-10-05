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
    sectionTitle: "Menu & Dietary Preferences per Guest",
    sectionSubtitle: "Please choose a course for each attending guest at Schloss Hetzendorf.",
    guestHeader: "Guest",
    mealType: "Meal Preference",
    allergiesLabel: "Specific Allergies / Intolerances",
    allergiesPlaceholder: "e.g. Celiac (gluten-free), nut allergy, lactose...",
    options: {
      classic: "🥩 Classic (Beef Tenderloin & Viennese Specialties)",
      fish: "🐟 Fish (Alpine Char / Trout with Seasonal Vegetables)",
      vegetarian: "🥗 Vegetarian (Truffle Risotto & Specialties)",
      vegan: "🌿 Vegan Gourmet Menu",
      kids: "🧒 Children's Menu (Wiener Schnitzerl)",
    },
  },
  es: {
    sectionTitle: "Selección de Menú por Invitado",
    sectionSubtitle: "Por favor elige la opción de plato para cada invitado en el Palacio Hetzendorf.",
    guestHeader: "Invitado/a",
    mealType: "Preferencia de Menú",
    allergiesLabel: "Alergias o Intolerancias Específicas",
    allergiesPlaceholder: "ej. Celíaco (sin gluten), frutos secos, lactosa...",
    options: {
      classic: "🥩 Clásico (Solomillo de Ternera y Especialidades Vienesas)",
      fish: "🐟 Pescado (Trucha / Salvelino Alpino con Verduras)",
      vegetarian: "🥗 Vegetariano (Risotto de Trufa y Pastas)",
      vegan: "🌿 Menú Gourmet Vegano",
      kids: "🧒 Menú Infantil (Milanesa Vienesa)",
    },
  },
  "de-AT": {
    sectionTitle: "Menüauswahl & Speisen pro Gast",
    sectionSubtitle: "Bitte wählt euren gewünschten Hauptgang für das Hochzeitsdinner im Schloss Hetzendorf.",
    guestHeader: "Gast",
    mealType: "Hauptgang-Wahl",
    allergiesLabel: "Spezifische Allergien & Unverträglichkeiten",
    allergiesPlaceholder: "z.B. Zöliakie (glutenfrei), Laktose, Nussallergie...",
    options: {
      classic: "🥩 Klassisch (Zartes Rindsmedaillon & Wiener Beilagen)",
      fish: "🐟 Fisch (Alpensaibling / Zander auf Gemüse)",
      vegetarian: "🥗 Vegetarisch (Trüffel-Risotto & Spezialitäten)",
      vegan: "🌿 Veganes Gourmet-Menü",
      kids: "🧒 Kindermenü (Wiener Schnitzerl)",
    },
  },
  hu: {
    sectionTitle: "Menüválasztás és Ételigények Vendégenként",
    sectionSubtitle: "Kérjük, válaszd ki a főételt minden résztvevő vendég számára a Hetzendorf-kastélyban.",
    guestHeader: "Vendég",
    mealType: "Menü Választás",
    allergiesLabel: "Allergiák és Ételérzékenységek",
    allergiesPlaceholder: "pl. Lisztérzékenység (gluténmentes), laktóz, dióféle...",
    options: {
      classic: "🥩 Klasszikus (Marhabélszín és bécsi köretek)",
      fish: "🐟 Hal (Alpesi szaibling szezonális zöldségekkel)",
      vegetarian: "🥗 Vegetáriánus (Szarvasgombás rizottó)",
      vegan: "🌿 Vegán Gourmet Menü",
      kids: "🧒 Gyerekmenü (Bécsi szelet)",
    },
  },
};

export function RsvpForm({
  invitation,
  enableMealSelection = true,
}: {
  invitation: InvitationFormProps;
  enableMealSelection?: boolean;
}) {
  const locale = useLocale();
  const typedLocale = locale as Locale;
  const t = useTranslations("rsvp");
  const { play } = useSound();
  const hasTrackedStart = useRef(false);
  const isSingleGuestOnly = !invitation.plusOneAllowed && invitation.maxGuests <= 1;
  const isPlusOneInvitation = invitation.plusOneAllowed && invitation.maxGuests === 2;
  const isMultiGuestParty = invitation.maxGuests > 2;

  const [plusOneSelected, setPlusOneSelected] = useState<"yes" | "no">("yes");
  const [plusOneName, setPlusOneName] = useState("");
  const [attendance, setAttendance] = useState<RsvpState>("");
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [guestNames, setGuestNames] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [meals, setMeals] = useState<Record<number, { meal: string; allergies: string }>>({
    0: { meal: "classic", allergies: "" },
    1: { meal: "classic", allergies: "" },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState<"yes" | "no" | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const endpoint = `/api/invitation/${encodeURIComponent(invitation.token)}/rsvp`;

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
        };
        setAttendance(saved.attendanceStatus);
        if (isPlusOneInvitation) {
          if (saved.attendeeCount === 2) {
            setPlusOneSelected("yes");
            setPlusOneName(saved.guestNames[0] || "");
          } else {
            setPlusOneSelected("no");
            setPlusOneName("");
          }
        } else if (isMultiGuestParty) {
          setAttendeeCount(Math.max(1, Math.min(invitation.maxGuests, saved.attendeeCount)));
          setGuestNames(saved.guestNames.join("\n"));
        } else {
          setAttendeeCount(1);
          setGuestNames("");
        }
        setDietaryRequirements(saved.dietaryRequirements ?? "");
        setNotes(saved.notes ?? "");
      } catch {
        if (!controller.signal.aborted) setErrorMessage(t("loadError"));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadExistingRsvp();
    return () => controller.abort();
  }, [endpoint, t, isPlusOneInvitation, isMultiGuestParty, invitation.maxGuests]);

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmation(null);

    if (!attendance) {
      setErrorMessage(t("chooseAttendance"));
      return;
    }

    let finalCount = 1;
    let finalGuestNames: string[] = [];

    if (attendance === "no") {
      finalCount = 0;
      finalGuestNames = [];
    } else if (isSingleGuestOnly) {
      finalCount = 1;
      finalGuestNames = [];
    } else if (isPlusOneInvitation) {
      if (plusOneSelected === "yes") {
        const trimmed = plusOneName.trim();
        if (!trimmed) {
          setErrorMessage(t("plusOneNameRequired"));
          return;
        }
        finalCount = 2;
        finalGuestNames = [trimmed];
      } else {
        finalCount = 1;
        finalGuestNames = [];
      }
    } else if (isMultiGuestParty) {
      finalCount = attendeeCount;
      const names = guestNames
        .split("\n")
        .map((name) => name.trim())
        .filter(Boolean);
      if (finalCount > 1 && names.length < finalCount - 1) {
        setErrorMessage(t("additionalNamesRequired"));
        return;
      }
      finalGuestNames = names.slice(0, finalCount - 1);
    }

    setIsSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceStatus: attendance,
          attendeeCount: finalCount,
          guestNames: finalGuestNames,
          dietaryRequirements: attendance === "yes" ? dietaryRequirements.trim() : undefined,
          notes: notes.trim() || undefined,
          language: typedLocale,
        }),
      });

      if (!response.ok) {
        const code = await readErrorCode(response);
        setErrorMessage(code === "guest_limit" ? t("guestLimitError") : code === "rate_limited" ? t("rateLimitError") : t("saveError"));
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
            {t(confirmation === "yes" ? "confirmedMessage" : "declinedMessage", { name: invitation.displayName })}
          </p>
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
              {/* Case 1: Standard Plus-One (+1) Invitation */}
              {isPlusOneInvitation && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <fieldset className="guest-form__fieldset" style={{ border: 0, padding: 0, margin: "0 0 1rem 0" }}>
                    <legend style={{ fontWeight: 600, color: "#2B2425", marginBottom: "0.6rem", fontSize: "0.95rem" }}>
                      {t("plusOneQuestion")}
                    </legend>
                    <label className="choice-row" style={{ marginBottom: "0.5rem" }}>
                      <input
                        type="radio"
                        name="plusOneChoice"
                        value="yes"
                        checked={plusOneSelected === "yes"}
                        onChange={() => setPlusOneSelected("yes")}
                      />
                      <span>{t("plusOneWithGuest")}</span>
                    </label>
                    <label className="choice-row">
                      <input
                        type="radio"
                        name="plusOneChoice"
                        value="no"
                        checked={plusOneSelected === "no"}
                        onChange={() => setPlusOneSelected("no")}
                      />
                      <span>{t("plusOneSolo")}</span>
                    </label>
                  </fieldset>

                  {plusOneSelected === "yes" && (
                    <div className="field-group" style={{ marginTop: "0.75rem" }}>
                      <label htmlFor="plus-one-name">
                        {t("plusOneNameLabel")} <span style={{ color: "#8C2836" }}>*</span>
                      </label>
                      <input
                        autoComplete="off"
                        id="plus-one-name"
                        name="plusOneName"
                        onChange={(event) => setPlusOneName(event.target.value)}
                        placeholder={t("plusOneNamePlaceholder")}
                        required
                        type="text"
                        value={plusOneName}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Multi-Guest Group or Family (3+ guests) */}
              {isMultiGuestParty && (
                <>
                  <div className="field-group">
                    <label htmlFor="attendee-count">
                      {t("attendeeCount")} ({t("maxAllowed", { max: invitation.maxGuests })})
                    </label>
                    <input
                      autoComplete="off"
                      id="attendee-count"
                      max={invitation.maxGuests}
                      min={1}
                      name="attendeeCount"
                      onChange={(event) => setAttendeeCount(Math.min(invitation.maxGuests, Math.max(1, Number(event.target.value))))}
                      type="number"
                      value={attendeeCount}
                    />
                  </div>
                  {attendeeCount > 1 && (
                    <div className="field-group">
                      <label htmlFor="guest-names">
                        {t("additionalNames")} <span style={{ color: "#8C2836" }}>*</span>
                      </label>
                      <textarea
                        autoComplete="off"
                        id="guest-names"
                        name="guestNames"
                        onChange={(event) => setGuestNames(event.target.value)}
                        placeholder={t("additionalNamesPlaceholder")}
                        rows={Math.min(attendeeCount - 1, 4)}
                        value={guestNames}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {/* Case 3: Single Guest Only - No questions about how many people! */}

              <div className="field-group">
                <label htmlFor="dietary-requirements">{t("dietaryLabel")}</label>
                <textarea
                  autoComplete="off"
                  id="dietary-requirements"
                  name="dietaryRequirements"
                  onChange={(event) => setDietaryRequirements(event.target.value)}
                  rows={2}
                  value={dietaryRequirements}
                />
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
