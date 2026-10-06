import type { Metadata } from "next";
import { signOutAdmin } from "@/app/actions/admin-auth";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";

import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = {
  title: "Admin Portal — Ruben & Andrea Wedding",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await hasAuthenticatedAdmin();
  const showHeader = isAdmin || process.env.NODE_ENV !== "production";

  return (
    <div style={{ minHeight: "100dvh", background: "#FBF9F7", color: "#2B2425", fontFamily: "var(--font-body, system-ui)" }}>
      {showHeader && <AdminHeader signOutAction={signOutAdmin} />}

      <main style={{ maxWidth: "1360px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {children}
      </main>
    </div>
  );
}
