import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const auditMock = vi.fn();
const sendMailMock = vi.fn();
const verifyMock = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  getAuthenticatedAdminIdentity: authMock,
}));

vi.mock("@/lib/admin/audit", () => ({
  recordAdminAudit: auditMock,
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      verify: verifyMock,
      sendMail: sendMailMock,
    }),
  },
}));

vi.mock("@/lib/storage/resilient-store", () => ({
  resilientStore: {
    getSettings: () => ({
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUser: "wedding@example.com",
      smtpPass: "secret",
      smtpSenderEmail: "wedding@example.com",
      smtpSenderName: "Ruben & Andrea",
    }),
    getInvitationById: (id: string) => {
      if (id === "test-inv-1") {
        return {
          id: "test-inv-1",
          token: "token123",
          display_name: "Elena Rostova",
          language: "es",
          email: "elena@example.com",
        };
      }
      return null;
    },
    recordEvent: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null }),
        }),
      }),
    }),
  }),
}));

const { sendInvitationEmailAction, testSmtpConnectionAction } = await import("./admin-email");

describe("admin email actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "msg-12345" });
  });

  it("sends luxury invitation email with personalized language and link", async () => {
    const result = await sendInvitationEmailAction({
      invitationId: "test-inv-1",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg-12345");
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "elena@example.com",
        from: '"Ruben & Andrea" <wedding@example.com>',
        subject: expect.stringContaining("Elena Rostova"),
        html: expect.stringContaining("token123"),
      })
    );
  });

  it("rejects sending when guest has no email address", async () => {
    const result = await sendInvitationEmailAction({
      invitationId: "non-existent-id",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invitation not found/i);
  });

  it("tests SMTP connection successfully", async () => {
    const formData = new FormData();
    formData.set("smtpHost", "smtp.test.com");
    formData.set("smtpPort", "587");
    formData.set("smtpUser", "user@test.com");
    formData.set("smtpPass", "pass123");
    formData.set("testEmail", "target@test.com");

    const result = await testSmtpConnectionAction(formData);
    expect(result.success).toBe(true);
    expect(verifyMock).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalled();
  });
});
