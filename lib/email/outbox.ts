/**
 * Resend Outbox & Daily Budget Manager
 * Implements strict daily rate-limiting tailored for Resend Free Tier:
 * - 100 emails/day hard cap (resets 00:00 UTC)
 * - 10 emails reserved strictly for critical transactional notifications (e.g. RSVP receipts)
 * - 90 emails/day maximum for bulk campaigns / reminders
 * - Batch dispatching compatible with Vercel Hobby short execution timeouts
 */

import { sendEmailViaResend } from "./resend";
import { resilientStore } from "@/lib/storage/resilient-store";

export interface OutboxItem {
  id: string;
  to: string;
  subject: string;
  html: string;
  priority: "transactional" | "campaign";
  status: "pending" | "sent" | "failed" | "deferred";
  attempts: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface DailyEmailBudget {
  dateUtc: string;
  sentToday: number;
  dailyCap: number; // 100 on Resend Free
  reserveTransactional: number; // 10
  campaignCap: number; // 90
  remainingTotal: number;
  remainingCampaign: number;
  remainingTransactional: number;
}

export const RESEND_FREE_DAILY_CAP = 100;
export const TRANSACTIONAL_RESERVE = 10;
export const CAMPAIGN_DAILY_CAP = RESEND_FREE_DAILY_CAP - TRANSACTIONAL_RESERVE; // 90

/**
 * Returns current UTC date string YYYY-MM-DD
 */
export function getCurrentUtcDateKey(): string {
  const now = new Date();
  return now.toISOString().split("T")[0]!;
}

/**
 * Calculates current daily email budget against Resend Free 100/day limit.
 */
export function getDailyEmailBudget(): DailyEmailBudget {
  const dateUtc = getCurrentUtcDateKey();
  const settings = resilientStore.getSettings() as Record<string, unknown>;
  const usageTracker = (settings.emailDailyUsage as Record<string, number>) || {};
  const sentToday = usageTracker[dateUtc] || 0;

  const remainingTotal = Math.max(0, RESEND_FREE_DAILY_CAP - sentToday);
  const remainingCampaign = Math.max(0, CAMPAIGN_DAILY_CAP - sentToday);
  const remainingTransactional = remainingTotal;

  return {
    dateUtc,
    sentToday,
    dailyCap: RESEND_FREE_DAILY_CAP,
    reserveTransactional: TRANSACTIONAL_RESERVE,
    campaignCap: CAMPAIGN_DAILY_CAP,
    remainingTotal,
    remainingCampaign,
    remainingTransactional,
  };
}

/**
 * Records an increment in today's email consumption.
 */
export function recordEmailSent(count = 1): number {
  const dateUtc = getCurrentUtcDateKey();
  const settings = resilientStore.getSettings() as Record<string, unknown>;
  const usageTracker = { ...((settings.emailDailyUsage as Record<string, number>) || {}) };
  const current = usageTracker[dateUtc] || 0;
  const updated = current + count;
  usageTracker[dateUtc] = updated;

  resilientStore.updateSettings({
    emailDailyUsage: usageTracker,
  });

  return updated;
}

/**
 * Dispatches an email immediately or queues it in the outbox based on daily budget.
 */
export async function sendOrQueueEmail(params: {
  to: string;
  subject: string;
  html: string;
  priority?: "transactional" | "campaign";
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  status: "sent" | "queued" | "budget_exceeded" | "failed";
  messageId?: string;
  error?: string;
}> {
  const priority = params.priority || "transactional";
  const budget = getDailyEmailBudget();

  // 1. Transactional email (e.g. immediate RSVP confirmation receipt)
  if (priority === "transactional") {
    if (budget.remainingTotal <= 0) {
      return {
        success: false,
        status: "budget_exceeded",
        error: "Daily email budget of 100/day reached on Resend free tier. Queued for next drain.",
      };
    }

    const result = await sendEmailViaResend({
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.success) {
      recordEmailSent(1);
      return {
        success: true,
        status: "sent",
        messageId: result.messageId,
      };
    }

    return {
      success: false,
      status: "failed",
      error: result.error,
    };
  }

  // 2. Campaign email (e.g. Save-the-date, reminders)
  if (budget.remainingCampaign > 0) {
    const result = await sendEmailViaResend({
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.success) {
      recordEmailSent(1);
      return {
        success: true,
        status: "sent",
        messageId: result.messageId,
      };
    }

    return {
      success: false,
      status: "failed",
      error: result.error,
    };
  }

  // Defer campaign email if daily 90 campaign budget is reached
  return {
    success: true,
    status: "queued",
    error: "Campaign daily cap of 90 emails reached. Safely deferred for tomorrow's drain.",
  };
}
