import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { deleteWeddingData } from "@/app/actions/admin-data";
import { signInAdmin } from "@/app/actions/admin-auth";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; deleted?: string }>;
}) {
  const [isAdmin, t, params] = await Promise.all([
    hasAuthenticatedAdmin(),
    getTranslations("admin"),
    searchParams,
  ]);

  if (!isAdmin) {
    const errorMessage = params.error === "setup"
      ? t("setupError")
      : params.error === "credentials"
        ? t("credentialsError")
        : params.error === "delete-confirmation"
          ? t("deleteConfirmationError")
          : params.error === "delete"
            ? t("deleteError")
        : "";

    return (
      <main className="admin-page" id="main">
        <section className="admin-login" aria-labelledby="admin-login-title">
          <p className="section-label">{t("label")}</p>
          <h1 id="admin-login-title">{t("loginTitle")}</h1>
          <p>{t("loginDescription")}</p>
          <form action={signInAdmin} className="guest-form">
            <div className="field-group">
              <label htmlFor="admin-email">{t("email")}</label>
              <input autoComplete="username" id="admin-email" name="email" required type="email" />
            </div>
            <div className="field-group">
              <label htmlFor="admin-password">{t("password")}</label>
              <input autoComplete="current-password" id="admin-password" name="password" required type="password" />
            </div>
            {errorMessage && <p className="form-message form-message--error" role="alert">{errorMessage}</p>}
            <button className="text-button" type="submit">{t("signIn")}</button>
          </form>
        </section>
      </main>
    );
  }

  const labelKeys = [
    "label", "title", "signOut", "navigation", "overview", "invitations", "rsvps", "music", "analytics", "summary",
    "dataUnavailable", "invitationCount", "invitationDenominator", "guestCount", "guestDenominator", "openedCount",
    "openedDenominator", "attendingCount", "declinedCount", "attendanceResponses", "pendingCount", "pendingDenominator",
    "confirmedGuests", "confirmedGuestsNote", "songCount", "songRequestsNote", "deleteSectionTitle",
    "deleteWarning", "deleteConfirmationLabel", "deleteAction",
  ] as const;
  const labels = Object.fromEntries(await Promise.all(labelKeys.map(async (key) => [key, t(key)])));
  const statusMessage = params.deleted === "1"
    ? t("deleteSuccess")
    : params.error === "delete-confirmation"
      ? t("deleteConfirmationError")
      : params.error === "delete"
        ? t("deleteError")
        : "";

  return (
    <main className="admin-page" id="main">
      <AdminDashboard
        labels={labels}
        statusMessage={statusMessage}
        statusIsError={Boolean(params.error)}
        deleteAction={deleteWeddingData}
      />
    </main>
  );
}