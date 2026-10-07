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
const mockInvitations: Record<string, any> = {
  "test-inv-1": {
    id: "test-inv-1",
    token: "token123",
    display_name: "Elena Rostova",
    language: "es",
    email: "elena@example.com",
    personal_message: "¡Nos emociona celebrar juntos en Viena!",
    max_guests: 2,
    plus_one_allowed: false,
    status: "active",
  },
  "test-inv-de": {
    id: "test-inv-de",
    token: "token-de",
    display_name: "Christian Weber",
    language: "de-AT",
    email: "christian@example.at",
    personal_message: "Wir freuen uns riesig auf ein unvergessliches Fest!",
    max_guests: 1,
    plus_one_allowed: true,
    status: "active",
  },
  "test-inv-hu": {
    id: "test-inv-hu",
    token: "token-hu",
    display_name: "Mate Kovacs",
    language: "hu",
    email: "mate@example.hu",
    personal_message: "Szeretettel várunk Bécsben!",
    max_guests: 1,
    plus_one_allowed: false,
    status: "active",
  },
  "test-inv-en": {
    id: "test-inv-en",
    token: "token-en",
    display_name: "Sarah Jenkins",
    language: "en",
    email: "sarah@example.com",
    personal_message: "Looking forward to celebrating this unforgettable day in Vienna!",
    max_guests: 1,
    plus_one_allowed: true,
    status: "active",
  },
};

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
    getInvitationById: (id: string) => mockInvitations[id] || null,
    getInvitations: () => Object.values(mockInvitations),
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

const {
  getInvitationEmailSubject,
  buildEnvelopeInvitationHtml,
} = await import("@/lib/email/template");

const {
  sendInvitationEmailAction,
  testSmtpConnectionAction,
  sendBatchInvitationEmailsAction,
} = await import("./admin-email");

describe("admin email actions and localized templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });
    verifyMock.mockResolvedValue(true);
    sendMailMock.mockResolvedValue({ messageId: "msg-12345" });
  });

  describe("localized subject lines", () => {
    it("generates correct subject line for Spanish", () => {
      const subject = getInvitationEmailSubject("es", "Elena Rostova");
      expect(subject).toBe("Invitación Imperial a la Boda de Ruben & Andrea — Elena Rostova");
    });

    it("generates correct subject line for German", () => {
      const subject = getInvitationEmailSubject("de-AT", "Christian Weber");
      expect(subject).toBe("Hochzeitseinladung Ruben & Andrea — Christian Weber");
    });

    it("generates correct subject line for Hungarian", () => {
      const subject = getInvitationEmailSubject("hu", "Mate Kovacs");
      expect(subject).toBe("Esküvői Meghívó: Ruben & Andrea — Mate Kovacs");
    });

    it("generates correct subject line for English", () => {
      const subject = getInvitationEmailSubject("en", "Sarah Jenkins");
      expect(subject).toBe("Ruben & Andrea Wedding Invitation — Sarah Jenkins");
    });
  });

  describe("localized HTML template content", () => {
    it("renders Spanish email template with personal message", () => {
      const html = buildEnvelopeInvitationHtml({
        guestName: "Elena",
        invitationUrl: "https://example.com/i/test",
        language: "es",
        personalMessage: "¡Nos emociona celebrar juntos!",
      });

      expect(html).toContain("ENLACE IMPERIAL · VIENA 2027");
      expect(html).toContain("Invitación Exclusiva para");
      expect(html).toContain("Elena");
      expect(html).toContain("¡Nos emociona celebrar juntos!");
      expect(html).toContain("Abrir Invitación Real →");
      expect(html).toContain("Enviado con amor desde Viena");
    });

    it("renders German email template with personal message", () => {
      const html = buildEnvelopeInvitationHtml({
        guestName: "Christian",
        invitationUrl: "https://example.com/i/test",
        language: "de-AT",
        personalMessage: "Wir freuen uns riesig!",
      });

      expect(html).toContain("KAISERLICHE HOCHZEIT · WIEN 2027");
      expect(html).toContain("Exklusive Einladung für");
      expect(html).toContain("Christian");
      expect(html).toContain("Wir freuen uns riesig!");
      expect(html).toContain("Zur königlichen Einladung →");
      expect(html).toContain("Mit Liebe gesendet aus Wien");
    });

    it("renders Hungarian email template", () => {
      const html = buildEnvelopeInvitationHtml({
        guestName: "Mate",
        invitationUrl: "https://example.com/i/test",
        language: "hu",
      });

      expect(html).toContain("CSÁSZÁRI ESKÜVŐ · BÉCS 2027");
      expect(html).toContain("Exkluzív meghívó");
      expect(html).toContain("Mate");
      expect(html).toContain("Meghívó megtekintése →");
      expect(html).toContain("Szeretettel küldve Bécsből");
    });

    it("renders English email template", () => {
      const html = buildEnvelopeInvitationHtml({
        guestName: "Sarah",
        invitationUrl: "https://example.com/i/test",
        language: "en",
        personalMessage: "Looking forward to celebrating!",
      });

      expect(html).toContain("IMPERIAL WEDDING · VIENNA 2027");
      expect(html).toContain("Exclusively Prepared for");
      expect(html).toContain("Sarah");
      expect(html).toContain("Looking forward to celebrating!");
      expect(html).toContain("Open Royal Invitation →");
      expect(html).toContain("Sent with love from Vienna");
    });
  });

  describe("single invitation email dispatch", () => {
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
          subject: "Invitación Imperial a la Boda de Ruben & Andrea — Elena Rostova",
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
  });

  describe("batch invitation email dispatching", () => {
    it("dry-run accurately groups by language without sending any emails", async () => {
      const batchResult = await sendBatchInvitationEmailsAction({
        dryRun: true,
      });

      expect(batchResult.dryRun).toBe(true);
      expect(batchResult.totalTargeted).toBe(4);
      expect(batchResult.byLanguage).toEqual({
        es: 1,
        de: 1,
        hu: 1,
        en: 1,
      });
      expect(batchResult.sentCount).toBe(0);
      expect(batchResult.processed.length).toBe(4);

      // Verify each guest's item received its own language and localized subject
      const esGuest = batchResult.processed.find((p) => p.invitationId === "test-inv-1");
      expect(esGuest?.language).toBe("es");
      expect(esGuest?.subject).toContain("Invitación Imperial");
      expect(esGuest?.status).toBe("ready");

      const deGuest = batchResult.processed.find((p) => p.invitationId === "test-inv-de");
      expect(deGuest?.language).toBe("de-at");
      expect(deGuest?.subject).toContain("Hochzeitseinladung");
      expect(deGuest?.status).toBe("ready");

      const huGuest = batchResult.processed.find((p) => p.invitationId === "test-inv-hu");
      expect(huGuest?.language).toBe("hu");
      expect(huGuest?.subject).toContain("Esküvői Meghívó");
      expect(huGuest?.status).toBe("ready");

      const enGuest = batchResult.processed.find((p) => p.invitationId === "test-inv-en");
      expect(enGuest?.language).toBe("en");
      expect(enGuest?.subject).toContain("Ruben & Andrea Wedding Invitation");
      expect(enGuest?.status).toBe("ready");

      // Verify ZERO real emails were sent!
      expect(sendMailMock).not.toHaveBeenCalled();
    });

    it("dispatches each invitation strictly in its respective language when executed", async () => {
      const batchResult = await sendBatchInvitationEmailsAction({
        dryRun: false,
        invitationIds: ["test-inv-de", "test-inv-hu"],
      });

      expect(batchResult.dryRun).toBe(false);
      expect(batchResult.sentCount).toBe(2);
      expect(sendMailMock).toHaveBeenCalledTimes(2);

      // Verify German email call
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "christian@example.at",
          subject: "Hochzeitseinladung Ruben & Andrea — Christian Weber",
          html: expect.stringContaining("KAISERLICHE HOCHZEIT"),
        })
      );

      // Verify Hungarian email call
      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "mate@example.hu",
          subject: "Esküvői Meghívó: Ruben & Andrea — Mate Kovacs",
          html: expect.stringContaining("CSÁSZÁRI ESKÜVŐ"),
        })
      );
    });
  });

  describe("SMTP test connection", () => {
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
});
