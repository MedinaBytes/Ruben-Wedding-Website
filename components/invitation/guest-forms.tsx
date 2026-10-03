"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { recordInvitationInteraction } from "@/lib/client/invitation-events";
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

export function RsvpForm({ invitation }: { invitation: InvitationFormProps }) {
  const locale = useLocale();
  const typedLocale = locale as Locale;
  const t = useTranslations("rsvp");
  const hasTrackedStart = useRef(false);
  const [attendance, setAttendance] = useState<RsvpState>("");
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [guestNames, setGuestNames] = useState("");
  const [dietaryRequirements, setDietaryRequirements] = useState("");
  const [notes, setNotes] = useState("");
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
        setAttendeeCount(Math.max(1, saved.attendeeCount));
        setGuestNames(saved.guestNames.join("\n"));
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
  }, [endpoint, t]);

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmation(null);

    if (!attendance) {
      setErrorMessage(t("chooseAttendance"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceStatus: attendance,
          attendeeCount: attendance === "yes" ? attendeeCount : 0,
          guestNames:
            attendance === "yes"
              ? guestNames.split("\n").map((name) => name.trim()).filter(Boolean)
              : [],
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
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
          role="status"
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <h3>{confirmation === "yes" ? t("confirmedTitle") : t("declinedTitle")}</h3>
          <p>{t(confirmation === "yes" ? "confirmedMessage" : "declinedMessage", { name: invitation.displayName })}</p>
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
              <div className="field-group">
                <label htmlFor="attendee-count">{t("attendeeCount")}</label>
                <input
                  autoComplete="off"
                  id="attendee-count"
                  max={invitation.maxGuests}
                  min={1}
                  name="attendeeCount"
                  onChange={(event) => setAttendeeCount(Number(event.target.value))}
                  type="number"
                  value={attendeeCount}
                />
              </div>
              {invitation.plusOneAllowed && invitation.maxGuests > 1 && attendeeCount > 1 && (
                <div className="field-group">
                  <label htmlFor="guest-names">{t("additionalNames")}</label>
                  <textarea
                    autoComplete="off"
                    id="guest-names"
                    name="guestNames"
                    onChange={(event) => setGuestNames(event.target.value)}
                    rows={Math.min(attendeeCount - 1, 3)}
                    value={guestNames}
                  />
                </div>
              )}
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
