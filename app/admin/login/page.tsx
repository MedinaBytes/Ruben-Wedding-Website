import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signInAdmin } from "@/app/actions/admin-auth";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const isAdmin = await hasAuthenticatedAdmin();
  if (isAdmin) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const errorMessage =
    error === "credentials"
      ? "Invalid admin email or password."
      : error === "setup"
        ? "Authentication setup unavailable. Verify environment variables."
        : "";

  return (
    <div style={{ minHeight: "80dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#FFFFFF",
          border: "1px solid #E4DBD3",
          borderRadius: "12px",
          padding: "2.5rem 2rem",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
          textAlign: "center",
        }}
      >
        <div style={{ width: "75px", height: "75px", margin: "0 auto 1.25rem" }}>
          <Image
            src="/orchids/seal-monogram.svg"
            alt="Ruben & Andrea Monogram"
            width={75}
            height={75}
            priority
          />
        </div>

        <p style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontSize: "0.75rem", color: "#8E696E", marginBottom: "0.25rem" }}>
          Organizer Access
        </p>
        <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.85rem", color: "#2B2425", margin: "0 0 0.5rem 0" }}>
          Admin Sign In
        </h1>
        <p style={{ color: "#6A5D60", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
          Manage invitations, guest RSVPs, music curation, and event settings.
        </p>

        {errorMessage && (
          <div style={{ background: "#FDF2F3", border: "1px solid #F5C6CB", color: "#8E2B38", borderRadius: "6px", padding: "0.6rem 0.8rem", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            {errorMessage}
          </div>
        )}

        <form action={signInAdmin} style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="admin-email" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#3B2E30", marginBottom: "0.4rem" }}>
              Admin Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="admin@example.com"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                fontSize: "0.9rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label htmlFor="admin-password" style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#3B2E30", marginBottom: "0.4rem" }}>
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "0.65rem 0.85rem",
                borderRadius: "6px",
                border: "1px solid #D5CBC4",
                fontSize: "0.9rem",
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: "0.5rem",
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.75rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            Sign In to Dashboard
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid #F0E8E2" }}>
          <Link href="/" style={{ color: "#776A6C", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Return to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
