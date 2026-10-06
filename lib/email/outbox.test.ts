import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getDailyEmailBudget,
  recordEmailSent,
  sendOrQueueEmail,
} from "./outbox";

let mockSettings: Record<string, unknown> = {};

vi.mock("@/lib/storage/resilient-store", () => ({
  resilientStore: {
    getSettings: () => mockSettings,
    updateSettings: (s: Record<string, unknown>) => {
      mockSettings = { ...mockSettings, ...s };
      return mockSettings;
    },
  },
}));

const mockSendResend = vi.fn();
vi.mock("./resend", () => ({
  sendEmailViaResend: (args: unknown) => mockSendResend(args),
}));

describe("Resend outbox and daily budget manager", () => {
  beforeEach(() => {
    mockSettings = {};
    vi.clearAllMocks();
  });

  it("calculates budget correctly on fresh day", () => {
    const budget = getDailyEmailBudget();
    expect(budget.dailyCap).toBe(100);
    expect(budget.campaignCap).toBe(90);
    expect(budget.reserveTransactional).toBe(10);
    expect(budget.sentToday).toBe(0);
    expect(budget.remainingTotal).toBe(100);
    expect(budget.remainingCampaign).toBe(90);
  });

  it("records sent emails and updates remaining balance", () => {
    recordEmailSent(5);
    const budget = getDailyEmailBudget();
    expect(budget.sentToday).toBe(5);
    expect(budget.remainingTotal).toBe(95);
    expect(budget.remainingCampaign).toBe(85);
  });

  it("dispatches transactional email and decrements budget", async () => {
    mockSendResend.mockResolvedValueOnce({ success: true, messageId: "msg-123" });

    const result = await sendOrQueueEmail({
      to: "guest@example.com",
      subject: "Your RSVP Confirmation",
      html: "<p>Thank you!</p>",
      priority: "transactional",
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("sent");
    expect(result.messageId).toBe("msg-123");

    const budget = getDailyEmailBudget();
    expect(budget.sentToday).toBe(1);
  });

  it("defers campaign email when daily campaign cap of 90 is reached", async () => {
    recordEmailSent(90); // Exhaust campaign budget
    const budgetBefore = getDailyEmailBudget();
    expect(budgetBefore.remainingCampaign).toBe(0);
    expect(budgetBefore.remainingTotal).toBe(10); // 10 reserved for transactional

    const result = await sendOrQueueEmail({
      to: "newsletter@example.com",
      subject: "Save the Date Campaign",
      html: "<p>Reminder</p>",
      priority: "campaign",
    });

    expect(result.status).toBe("queued");
    expect(mockSendResend).not.toHaveBeenCalled();

    // But transactional email can still pass in the 10-email reserve!
    mockSendResend.mockResolvedValueOnce({ success: true, messageId: "msg-reserve" });
    const transResult = await sendOrQueueEmail({
      to: "rsvp@example.com",
      subject: "Instant RSVP Receipt",
      html: "<p>Receipt</p>",
      priority: "transactional",
    });

    expect(transResult.status).toBe("sent");
    expect(mockSendResend).toHaveBeenCalledTimes(1);
  });
});
