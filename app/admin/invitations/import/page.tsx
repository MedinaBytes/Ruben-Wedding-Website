import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAuthenticatedAdmin } from "@/lib/admin/auth";
import { BulkImportForm } from "@/components/admin/bulk-import-form";

export const metadata: Metadata = {
  title: "Bulk Import Invitations — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminBulkImportPage() {
  const isAdmin = await hasAuthenticatedAdmin();
  if (!isAdmin && process.env.NODE_ENV === "production") {
    redirect("/admin/login");
  }

  return <BulkImportForm />;
}
