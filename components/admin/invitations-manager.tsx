"use client";

import { useState } from "react";
import Link from "next/link";
import { CreateInvitationForm } from "@/components/admin/create-invitation-form";
import { deleteInvitationAction, revokeInvitationAction, toggleDemoInvitationAction, updateInvitationContactAction } from "@/app/actions/admin-invitations";
import { sendInvitationEmailAction, sendBatchInvitationEmailsAction, type BatchInvitationEmailResult } from "@/app/actions/admin-email";
import { buildWhatsAppInvitationLink } from "@/lib/whatsapp/wa-link";

export interface InvitationRow {
  id: string;
  displayName: string;
  groupName: string | null;
  language: string | null;
  maxGuests: number;
  plusOneAllowed: boolean;
  status: "active" | "draft" | "revoked";
  createdAt: string;
  rsvpStatus: "yes" | "no" | "pending";
  attendeeCount: number;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  token?: string;
}

export function InvitationsManager({
  invitations,
  siteUrl,
  isDemoEnabled = false,
}: {
  invitations: InvitationRow[];
  siteUrl: string;
  isDemoEnabled?: boolean;
}) {
  const [items, setItems] = useState<InvitationRow[]>(invitations);
  const [demoActive, setDemoActive] = useState<boolean>(isDemoEnabled);
  const [togglingDemo, setTogglingDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchInvitationEmailResult | null>(null);

  // QR Modal State
  const [activeQr, setActiveQr] = useState<{
    displayName: string;
    targetUrl: string;
    svg: string;
    dataUrl: string;
  } | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Email Dispatch Modal State
  const [activeEmailInv, setActiveEmailInv] = useState<InvitationRow | null>(null);
  const [recipientEmailInput, setRecipientEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Contact Edit Modal State
  const [editingContactInv, setEditingContactInv] = useState<InvitationRow | null>(null);
  const [contactPhoneInput, setContactPhoneInput] = useState("");
  const [contactWhatsappInput, setContactWhatsappInput] = useState("");
  const [contactEmailInput, setContactEmailInput] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<string | null>(null);

  const filtered = items.filter((inv) => {
    const matchesSearch =
      inv.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.groupName && inv.groupName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function openEmailModal(inv: InvitationRow) {
    setActiveEmailInv(inv);
    setRecipientEmailInput(inv.email || "");
    setEmailResult(null);
  }

  async function handleSendEmail() {
    if (!activeEmailInv) return;
    setSendingEmail(true);
    setEmailResult(null);

    try {
      const res = await sendInvitationEmailAction({
        invitationId: activeEmailInv.id,
        recipientEmail: recipientEmailInput.trim(),
      });
      if (res.success) {
        setEmailResult({
          success: true,
          message: `Royal invitation sent via ${res.provider === "resend" ? "Resend API" : "SMTP"}! Message ID: ${res.messageId || "ok"}`,
        });
        if (recipientEmailInput.trim() && activeEmailInv.email !== recipientEmailInput.trim()) {
          setItems((prev) =>
            prev.map((i) => (i.id === activeEmailInv.id ? { ...i, email: recipientEmailInput.trim() } : i))
          );
        }
      } else {
        setEmailResult({
          success: false,
          message: res.error || "Failed to deliver email.",
        });
      }
    } catch (err: unknown) {
      setEmailResult({
        success: false,
        message: err instanceof Error ? err.message : "Error sending email.",
      });
    } finally {
      setSendingEmail(false);
    }
  }

  function openContactModal(inv: InvitationRow) {
    setEditingContactInv(inv);
    setContactPhoneInput(inv.phone || "");
    setContactWhatsappInput(inv.whatsapp || inv.phone || "");
    setContactEmailInput(inv.email || "");
    setContactFeedback(null);
  }

  async function handleSaveContact() {
    if (!editingContactInv) return;
    setSavingContact(true);
    setContactFeedback(null);
    try {
      const res = await updateInvitationContactAction({
        id: editingContactInv.id,
        phone: contactPhoneInput.trim() || null,
        whatsapp: contactWhatsappInput.trim() || null,
        email: contactEmailInput.trim() || null,
      });
      if (res.success) {
        const updatedPhone = contactPhoneInput.trim() || null;
        const updatedWa = contactWhatsappInput.trim() || null;
        const updatedMail = contactEmailInput.trim() || null;
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingContactInv.id
              ? { ...i, phone: updatedPhone, whatsapp: updatedWa, email: updatedMail }
              : i
          )
        );
        setContactFeedback("✓ Contact details updated successfully!");
        setTimeout(() => setEditingContactInv(null), 1200);
      } else {
        setContactFeedback(res.error || "Failed to update contact.");
      }
    } catch {
      setContactFeedback("Network error updating contact.");
    } finally {
      setSavingContact(false);
    }
  }

  function toggleSelectAllFiltered() {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  }

  function selectAllWithEmail() {
    const withEmail = filtered.filter((i) => i.email && i.email.includes("@")).map((i) => i.id);
    setSelectedIds(new Set(withEmail));
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExecuteBatchEmail(dryRun: boolean) {
    if (selectedIds.size === 0) return;
    if (!dryRun) {
      const confirmed = confirm(
        `Are you sure you want to dispatch LIVE invitation emails to ${selectedIds.size} guests?\n\nEach invitation will be formatted and delivered strictly in the guest's assigned invitation language.`
      );
      if (!confirmed) return;
    }

    setBatchLoading(true);
    try {
      const res = await sendBatchInvitationEmailsAction({
        invitationIds: Array.from(selectedIds),
        dryRun,
      });
      setBatchResult(res);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error executing batch email operation.");
    } finally {
      setBatchLoading(false);
    }
  }

  async function copyLink(inv: InvitationRow) {
    const targetToken = inv.token || inv.id;
    const url = `${siteUrl.replace(/\/$/, "")}/i/${targetToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDelete(inv: InvitationRow) {
    const isDemo = inv.id === "00000000-0000-0000-0000-000000000001" || inv.token === "demo";
    const confirmMsg = isDemo
      ? 'Delete the demo user invitation ("Sarah & Guest") and disable /i/demo permanently for production?'
      : `Are you sure you want to delete the invitation for "${inv.displayName}"?`;
    if (!confirm(confirmMsg)) return;
    setItems((prev) => prev.filter((i) => i.id !== inv.id));
    if (isDemo) {
      setDemoActive(false);
    }
    await deleteInvitationAction(inv.id);
  }

  async function handleToggleDemo() {
    setTogglingDemo(true);
    const target = !demoActive;
    try {
      const res = await toggleDemoInvitationAction(target);
      if (res.success) {
        setDemoActive(target);
        if (!target) {
          setItems((prev) => prev.filter((i) => i.id !== "00000000-0000-0000-0000-000000000001" && i.token !== "demo"));
        } else {
          const demoRow: InvitationRow = {
            id: "00000000-0000-0000-0000-000000000001",
            displayName: "Sarah & Guest (Demo)",
            groupName: "Demo Reviewers",
            language: "en",
            maxGuests: 2,
            plusOneAllowed: true,
            status: "active",
            createdAt: new Date().toISOString(),
            rsvpStatus: "pending",
            attendeeCount: 0,
            phone: "+43 664 1234567",
            whatsapp: "+436641234567",
            token: "demo",
          };
          setItems((prev) => [demoRow, ...prev.filter((i) => i.id !== demoRow.id)]);
        }
      }
    } finally {
      setTogglingDemo(false);
    }
  }

  async function handleRevoke(inv: InvitationRow) {
    const newStatus = inv.status === "active" ? "revoked" : "active";
    setItems((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: newStatus } : i)),
    );
    await revokeInvitationAction(inv.id, newStatus);
  }

  async function openQrModal(inv: InvitationRow) {
    setLoadingQr(true);
    try {
      const res = await fetch(`/api/admin/invitations/${inv.id}/qr`);
      if (res.ok) {
        const data = await res.json();
        setActiveQr(data);
      }
    } catch {
      alert("Failed to load QR code.");
    } finally {
      setLoadingQr(false);
    }
  }

  function downloadSvg() {
    if (!activeQr) return;
    const blob = new Blob([activeQr.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${activeQr.displayName.replace(/\s+/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPng() {
    if (!activeQr) return;
    const a = document.createElement("a");
    a.href = activeQr.dataUrl;
    a.download = `QR-${activeQr.displayName.replace(/\s+/g, "_")}.png`;
    a.click();
  }

  function sendWhatsApp(inv: InvitationRow) {
    const targetToken = inv.token || inv.id;
    const inviteUrl = `${siteUrl.replace(/\/$/, "")}/i/${targetToken}`;
    const { url } = buildWhatsAppInvitationLink({
      phoneNumber: inv.whatsapp || inv.phone,
      guestName: inv.displayName,
      invitationUrl: inviteUrl,
      language: inv.language || "es",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      {/* Top Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display, serif)", fontSize: "2rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
            Guest Invitations
          </h1>
          <p style={{ margin: 0, color: "#6E6264", fontSize: "0.9rem" }}>
            Total: {invitations.length} invitations · Showing {filtered.length}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            style={{
              background: showCreate ? "#665759" : "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.55rem 1.1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {showCreate ? "Close Form" : "+ Create Invitation"}
          </button>
          <Link
            href="/admin/invitations/import"
            style={{
              background: "#FFFFFF",
              border: "1px solid #D8CFC8",
              color: "#544648",
              borderRadius: "6px",
              padding: "0.55rem 1.1rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Bulk Import CSV
          </Link>
        </div>
      </div>

      {/* Production / Demo Deployment Status Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "0.75rem 1.15rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          background: demoActive ? "#FFFDF9" : "#F6FAF7",
          border: `1px solid ${demoActive ? "#EADECF" : "#CFE6D7"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem" }}>
          <span style={{ fontSize: "1.1rem" }}>{demoActive ? "🧪" : "🔒"}</span>
          <div>
            <span style={{ fontWeight: 600, color: demoActive ? "#8C2836" : "#2E6B47" }}>
              {demoActive ? "Demo Mode Active:" : "Production Mode Active:"}
            </span>
            <span style={{ color: "#6A5D60", marginLeft: "0.4rem" }}>
              {demoActive
                ? 'Sample guest "Sarah & Guest (Demo)" and /i/demo are accessible for reviewer testing.'
                : "Demo data is disabled and /i/demo is inaccessible. Ready for real wedding guests."}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleDemo}
          disabled={togglingDemo}
          style={{
            background: demoActive ? "#8C2836" : "#2E6B47",
            color: "#FFFFFF",
            border: 0,
            borderRadius: "6px",
            padding: "0.35rem 0.8rem",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            opacity: togglingDemo ? 0.6 : 1,
          }}
        >
          {demoActive ? "Delete / Disable Demo User" : "Enable Demo Invitation"}
        </button>
      </div>

      {/* Create Invitation Collapsible Section */}
      {showCreate && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBD3", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.3rem", marginTop: 0, color: "#2B2425" }}>
            Create New Guest Invitation
          </h2>
          <CreateInvitationForm
            labels={{
              displayName: "Guest / Family Name",
              groupName: "Group / Category (e.g. Friends, Family)",
              lookupEmail: "Email (Optional)",
              lookupPhone: "Phone (Optional)",
              preferredLanguage: "Language",
              languageDefault: "Auto (Browser)",
              guestPlaces: "Max Allowed Guests",
              plusOneAllowed: "Allow Plus-One (+1)",
              creatingInvitation: "Generating...",
              createInvitation: "Create & Generate Link",
              createInvitationSuccess: "Invitation created successfully!",
              createInvitationError: "Failed to create invitation.",
              invitationUrl: "Personal Invitation URL",
            }}
          />
        </div>
      )}

      {/* Search and Filters Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by guest or group name..."
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "0.55rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #D5CBC4",
            fontSize: "0.85rem",
            background: "#FFFFFF",
            color: "#3B2E30",
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="revoked">Revoked Only</option>
        </select>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => {
              setBatchResult(null);
              setBatchModalOpen(true);
            }}
            style={{
              background: "#8C2836",
              color: "#FFFFFF",
              border: 0,
              borderRadius: "6px",
              padding: "0.55rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(140, 40, 54, 0.25)",
            }}
          >
            ✉ Batch Email ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Quick Selection Toolbar */}
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#6A5D60" }}>
        <span>Quick select:</span>
        <button
          type="button"
          onClick={selectAllWithEmail}
          style={{ background: "none", border: "none", color: "#8C2836", textDecoration: "underline", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
        >
          All with email ({filtered.filter((i) => i.email && i.email.includes("@")).length})
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={toggleSelectAllFiltered}
          style={{ background: "none", border: "none", color: "#8C2836", textDecoration: "underline", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
        >
          {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect all" : `All filtered (${filtered.length})`}
        </button>
        {selectedIds.size > 0 && (
          <>
            <span>·</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              style={{ background: "none", border: "none", color: "#6A5D60", textDecoration: "underline", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
            >
              Clear selection ({selectedIds.size})
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="admin-table-scroll-wrap">
        <table style={{ width: "100%", minWidth: "680px", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ background: "#F7F3EF", borderBottom: "1px solid #E4DBD3", color: "#6A5E60", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ width: "38px", padding: "0.75rem 0.5rem", textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAllFiltered}
                  aria-label="Select all filtered guests"
                />
              </th>
              <th style={{ padding: "0.75rem 1rem" }}>Guest Name</th>
              <th style={{ padding: "0.75rem 1rem" }}>Group</th>
              <th style={{ padding: "0.75rem 1rem" }}>Guests</th>
              <th style={{ padding: "0.75rem 1rem" }}>Lang</th>
              <th style={{ padding: "0.75rem 1rem" }}>RSVP</th>
              <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "2.5rem", textAlign: "center", color: "#8E7F81" }}>
                  No invitations match your search.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #EFEAE5", background: selectedIds.has(inv.id) ? "#FDF8F5" : undefined }}>
                  <td style={{ width: "38px", padding: "0.85rem 0.5rem", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelectRow(inv.id)}
                      aria-label={`Select ${inv.displayName}`}
                    />
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#2B2425" }}>
                    <div>{inv.displayName}</div>
                    {(inv.email || inv.whatsapp || inv.phone) && (
                      <div style={{ fontSize: "0.72rem", color: "#776A6C", fontWeight: 400, marginTop: "0.2rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {inv.email && <span title="Guest Email">✉ {inv.email}</span>}
                        {inv.whatsapp && <span title="WhatsApp Number" style={{ color: "#2E7D32" }}>📱 {inv.whatsapp}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "#776A6C" }}>
                    {inv.groupName || "—"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span>{inv.maxGuests} {inv.maxGuests === 1 ? "seat" : "seats"}</span>
                    {inv.plusOneAllowed && (
                      <span style={{ marginLeft: "0.4rem", fontSize: "0.72rem", background: "#E8F0E4", color: "#3B612C", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                        +1
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textTransform: "uppercase", fontSize: "0.8rem", color: "#776A6C" }}>
                    {inv.language || "Auto"}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "999px",
                        fontWeight: 600,
                        background:
                          inv.rsvpStatus === "yes"
                            ? "#E8F2E6"
                            : inv.rsvpStatus === "no"
                              ? "#FBE9EB"
                              : "#F4EFEA",
                        color:
                          inv.rsvpStatus === "yes"
                            ? "#35652D"
                            : inv.rsvpStatus === "no"
                              ? "#9C2836"
                              : "#8E7D6F",
                      }}
                    >
                      {inv.rsvpStatus === "yes" ? `Yes (${inv.attendeeCount})` : inv.rsvpStatus === "no" ? "No" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        background: inv.status === "active" ? "#EEF6EC" : "#F7EDEE",
                        color: inv.status === "active" ? "#447838" : "#993B47",
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <a
                        href={`/i/${inv.token || inv.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: "#EEF6EC",
                          border: "1px solid #C8E6C9",
                          borderRadius: "4px",
                          padding: "0.3rem 0.65rem",
                          fontSize: "0.78rem",
                          textDecoration: "none",
                          color: "#2B6628",
                          fontWeight: 600,
                        }}
                      >
                        Open ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => copyLink(inv)}
                        style={{
                          background: "#F4EFEA",
                          border: "1px solid #DCD3CB",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: copiedId === inv.id ? "#35652D" : "#44393B",
                          fontWeight: 500,
                        }}
                      >
                        {copiedId === inv.id ? "✓ Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openQrModal(inv)}
                        disabled={loadingQr}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #DCD3CB",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#7A2833",
                        }}
                      >
                        QR
                      </button>
                      <button
                        type="button"
                        onClick={() => openContactModal(inv)}
                        title="Add or update phone & WhatsApp number"
                        style={{
                          background: inv.whatsapp || inv.phone ? "#F4F7F4" : "#FFF9E6",
                          border: `1px solid ${inv.whatsapp || inv.phone ? "#C8E6C9" : "#F5DEB3"}`,
                          borderRadius: "4px",
                          padding: "0.3rem 0.55rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: inv.whatsapp || inv.phone ? "#2E7D32" : "#B45309",
                          fontWeight: 600,
                        }}
                      >
                        ✏️ {inv.whatsapp || inv.phone ? "Phone" : "+ Add WA"}
                      </button>
                      <button
                        type="button"
                        onClick={() => sendWhatsApp(inv)}
                        title="Send invitation via WhatsApp"
                        style={{
                          background: "#E8F5E9",
                          border: "1px solid #C8E6C9",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#1B5E20",
                          fontWeight: 500,
                        }}
                      >
                        WA
                      </button>
                      <button
                        type="button"
                        onClick={() => openEmailModal(inv)}
                        title="Send royal invitation via Email (Resend API)"
                        style={{
                          background: "#FAF4EF",
                          border: "1px solid #E2D6CB",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#8C2836",
                          fontWeight: 600,
                        }}
                      >
                        ✉ Email
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv)}
                        title={inv.status === "active" ? "Revoke invitation" : "Activate invitation"}
                        style={{
                          background: "#FFF8F0",
                          border: "1px solid #EEDAC5",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#8C5820",
                        }}
                      >
                        {inv.status === "active" ? "Revoke" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(inv)}
                        title="Delete invitation"
                        style={{
                          background: "#FDF2F3",
                          border: "1px solid #F5C6CB",
                          borderRadius: "4px",
                          padding: "0.3rem 0.6rem",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          color: "#8E2B38",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QR Code Modal */}
      {activeQr && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setActiveQr(null)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", margin: "0 0 0.25rem 0", color: "#2B2425" }}>
              Personal QR Code
            </h3>
            <p style={{ margin: "0 0 1.25rem 0", color: "#6A5D60", fontSize: "0.9rem" }}>
              For <strong>{activeQr.displayName}</strong>
            </p>

            {/* Rendered QR Image */}
            <div className="admin-qr-card-preview">
              {activeQr.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeQr.dataUrl}
                  alt={`QR code for ${activeQr.displayName}`}
                  width={200}
                  height={200}
                />
              ) : (
                <div
                  style={{ width: "100%", height: "100%" }}
                  dangerouslySetInnerHTML={{ __html: activeQr.svg }}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "1.25rem" }}>
              <button
                type="button"
                onClick={downloadSvg}
                style={{
                  background: "#8C2836",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Download SVG
              </button>
              <button
                type="button"
                onClick={downloadPng}
                style={{
                  background: "#55644E",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.45rem 0.9rem",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Download PNG
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveQr(null)}
              style={{
                background: "transparent",
                border: 0,
                color: "#776A6C",
                fontSize: "0.85rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Royal Email Dispatch Modal */}
      {activeEmailInv && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.25rem",
          }}
          onClick={() => setActiveEmailInv(null)}
        >
          <div
            style={{
              background: "#FAF7F2",
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              border: "1px solid #DFD5C8",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>✉</div>
              <h3 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", margin: "0 0 0.35rem 0", color: "#2B2425" }}>
                Send Royal Email Invitation
              </h3>
              <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.85rem" }}>
                Dispatches the luxury closed envelope featuring the interactive olive botanical wax seal link.
              </p>
            </div>

            <div style={{ background: "#FFFFFF", padding: "1rem", borderRadius: "8px", border: "1px solid #E6DCD2", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ color: "#776A6C" }}>Guest:</span> <strong>{activeEmailInv.displayName}</strong>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ color: "#776A6C" }}>Language:</span> <strong style={{ textTransform: "uppercase" }}>{activeEmailInv.language || "es"}</strong>
              </div>
              <div>
                <span style={{ color: "#776A6C" }}>Allocated Seats:</span> <strong>{activeEmailInv.maxGuests}{activeEmailInv.plusOneAllowed ? " (+1)" : ""}</strong>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#44383A", marginBottom: "0.35rem" }}>
                Recipient Email Address:
              </label>
              <input
                type="email"
                value={recipientEmailInput}
                onChange={(e) => setRecipientEmailInput(e.target.value)}
                placeholder="guest@example.com"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid #D5CBC4",
                  fontSize: "0.9rem",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>

            {emailResult && (
              <div
                style={{
                  marginBottom: "1.25rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  background: emailResult.success ? "#E8F5E9" : "#FCEEEF",
                  border: `1px solid ${emailResult.success ? "#C8E6C9" : "#F5C6CB"}`,
                  color: emailResult.success ? "#1B5E20" : "#8C2836",
                }}
              >
                {emailResult.success ? "✓ " : "✗ "}
                {emailResult.message}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setActiveEmailInv(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5CBC4",
                  borderRadius: "6px",
                  padding: "0.55rem 1rem",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  color: "#544648",
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail || !recipientEmailInput.trim()}
                style={{
                  background: "#8C2836",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: sendingEmail || !recipientEmailInput.trim() ? "not-allowed" : "pointer",
                  opacity: sendingEmail || !recipientEmailInput.trim() ? 0.6 : 1,
                  boxShadow: "0 2px 8px rgba(140, 40, 54, 0.25)",
                }}
              >
                {sendingEmail ? "Dispatching..." : "Send Invitation ✈"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Email Modal */}
      {batchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.25rem",
          }}
          onClick={() => {
            if (!batchLoading) setBatchModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#FAF7F2",
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
              border: "1px solid #DFD5C8",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>✉</div>
              <h3 style={{ fontFamily: "var(--font-display, serif)", fontSize: "1.4rem", margin: "0 0 0.35rem 0", color: "#2B2425" }}>
                Batch Invitation Email Dispatch
              </h3>
              <p style={{ margin: 0, color: "#6A5D60", fontSize: "0.85rem" }}>
                Send or preview luxury envelope invitations in batch, automatically localized per guest.
              </p>
            </div>

            {/* Language Breakdown & Multi-Language Guarantee */}
            <div style={{ background: "#FFFFFF", padding: "1rem", borderRadius: "8px", border: "1px solid #E6DCD2", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              <div style={{ fontWeight: 600, color: "#2B2425", marginBottom: "0.5rem" }}>
                Selected Guests: {selectedIds.size}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <span style={{ background: "#F5EFE7", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                  🇪🇸 Spanish: {items.filter((i) => selectedIds.has(i.id) && (i.language || "es").toLowerCase().startsWith("es")).length}
                </span>
                <span style={{ background: "#F5EFE7", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                  🇩🇪 German: {items.filter((i) => selectedIds.has(i.id) && (i.language || "").toLowerCase().startsWith("de")).length}
                </span>
                <span style={{ background: "#F5EFE7", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                  🇭🇺 Hungarian: {items.filter((i) => selectedIds.has(i.id) && (i.language || "").toLowerCase().startsWith("hu")).length}
                </span>
                <span style={{ background: "#F5EFE7", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                  🇬🇧 English: {items.filter((i) => selectedIds.has(i.id) && !["es", "de", "hu"].some((l) => (i.language || "").toLowerCase().startsWith(l))).length}
                </span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#2E7D32", display: "flex", alignItems: "flex-start", gap: "0.4rem", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>✓</span>
                <span>
                  <strong>Multi-Language Guarantee:</strong> Each guest receives their invitation email strictly in their assigned invitation language with their personalized greeting and matching royal envelope design.
                </span>
              </div>
            </div>

            {/* Results or Preview Table */}
            {batchResult && (
              <div style={{ background: "#FFFFFF", padding: "1rem", borderRadius: "8px", border: "1px solid #E6DCD2", marginBottom: "1.25rem", maxHeight: "240px", overflowY: "auto" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.5rem", color: batchResult.dryRun ? "#3B612C" : "#8C2836" }}>
                  {batchResult.dryRun ? "✓ Dry-Run Verification (Safe — No emails sent):" : "✓ Batch Dispatch Results:"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.78rem" }}>
                  {batchResult.processed.map((p) => (
                    <div key={p.invitationId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.6rem", background: "#FAF7F2", borderRadius: "4px", border: "1px solid #EFEAE5" }}>
                      <div>
                        <strong>{p.displayName}</strong> <span style={{ textTransform: "uppercase", fontSize: "0.7rem", color: "#8C2836", fontWeight: 700 }}>[{p.language}]</span>
                        <div style={{ color: "#6A5D60", fontSize: "0.72rem" }}>{p.subject}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: p.status === "sent" || p.status === "ready" ? "#2E7D32" : "#8C2836" }}>
                        {p.status === "ready" ? "Verified" : p.status === "sent" ? "Sent ✓" : p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => setBatchModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5CBC4",
                  borderRadius: "6px",
                  padding: "0.55rem 1rem",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  color: "#544648",
                }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => handleExecuteBatchEmail(true)}
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #8C2836",
                  color: "#8C2836",
                  borderRadius: "6px",
                  padding: "0.55rem 1.1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: batchLoading ? "wait" : "pointer",
                }}
              >
                {batchLoading ? "Checking..." : "Preview / Dry Run Only (Safe)"}
              </button>
              <button
                type="button"
                disabled={batchLoading}
                onClick={() => handleExecuteBatchEmail(false)}
                style={{
                  background: "#8C2836",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.55rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: batchLoading ? "wait" : "pointer",
                  boxShadow: "0 2px 8px rgba(140, 40, 54, 0.25)",
                }}
              >
                {batchLoading ? "Dispatching..." : "Send Batch Emails ✈"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact / WhatsApp Modal */}
      {editingContactInv && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "1.75rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display, serif)", fontSize: "1.3rem", color: "#2B2425" }}>
                Edit Contact Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingContactInv(null)}
                style={{ background: "none", border: 0, fontSize: "1.2rem", cursor: "pointer", color: "#6A5D60" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 1.25rem 0", color: "#6A5D60", fontSize: "0.85rem" }}>
              Update WhatsApp, phone number, and email for <strong>{editingContactInv.displayName}</strong>.
            </p>

            {contactFeedback && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  background: contactFeedback.startsWith("✓") ? "#F0FDF4" : "#FEF2F2",
                  color: contactFeedback.startsWith("✓") ? "#166534" : "#991B1B",
                  border: `1px solid ${contactFeedback.startsWith("✓") ? "#BBF7D0" : "#FECACA"}`,
                }}
              >
                {contactFeedback}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.3rem" }}>
                  📱 WhatsApp Number (International format):
                </label>
                <input
                  type="text"
                  placeholder="e.g. +436641234567 or 436641234567"
                  value={contactWhatsappInput}
                  onChange={(e) => {
                    setContactWhatsappInput(e.target.value);
                    if (!contactPhoneInput) setContactPhoneInput(e.target.value);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #D5CBC4",
                    fontSize: "0.88rem",
                    background: "#FFFFFF",
                  }}
                />
                <span style={{ fontSize: "0.72rem", color: "#776A6C", display: "block", marginTop: "0.2rem" }}>
                  Used for automated bot dispatch and direct 1-click WhatsApp links.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.3rem" }}>
                  📞 Standard Phone:
                </label>
                <input
                  type="text"
                  placeholder="e.g. +43 664 1234567"
                  value={contactPhoneInput}
                  onChange={(e) => setContactPhoneInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #D5CBC4",
                    fontSize: "0.88rem",
                    background: "#FFFFFF",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#2B2425", marginBottom: "0.3rem" }}>
                  ✉ Email:
                </label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={contactEmailInput}
                  onChange={(e) => setContactEmailInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid #D5CBC4",
                    fontSize: "0.88rem",
                    background: "#FFFFFF",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => setEditingContactInv(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #D5CBC4",
                  borderRadius: "6px",
                  padding: "0.5rem 0.95rem",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  color: "#6A5D60",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingContact}
                onClick={handleSaveContact}
                style={{
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: "6px",
                  padding: "0.5rem 1.2rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: savingContact ? "wait" : "pointer",
                }}
              >
                {savingContact ? "Saving..." : "Save Contact Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
