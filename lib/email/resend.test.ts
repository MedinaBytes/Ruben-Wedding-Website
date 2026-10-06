import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildEnvelopeInvitationHtml } from "./template";

const sendMock = vi.fn();
const apiKeysListMock = vi.fn();
const domainsListMock = vi.fn();

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = { send: sendMock };
      apiKeys = { list: apiKeysListMock };
      domains = { list: domainsListMock };
    },
  };
});

vi.mock("@/lib/storage/resilient-store", () => ({
  resilientStore: {
    getSettings: () => ({
      resendApiKey: "re_test_key_12345",
      resendFromEmail: "wedding@example.com",
      resendFromName: "Ruben & Andrea",
    }),
    recordEvent: vi.fn(),
  },
}));

vi.mock("@/lib/admin/auth", () => ({
  getAuthenticatedAdminIdentity: vi.fn().mockResolvedValue({ id: "admin-1", email: "admin@example.com" }),
}));

vi.mock("@/lib/admin/audit", () => ({
  recordAdminAudit: vi.fn(),
}));

const { checkResendStatusAction, getResendConfig, sendEmailViaResend, testResendConnectionAction } =
  await import("./resend");

describe("Resend email integration & template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildEnvelopeInvitationHtml generates royal closed envelope with clickable wax seal", () => {
    const html = buildEnvelopeInvitationHtml({
      guestName: "Archduke Ferdinand & Guest",
      invitationUrl: "https://theandyrubenwedding.website/i/archduke-token",
      language: "es",
      maxGuests: 2,
      plusOneAllowed: true,
      siteUrl: "https://theandyrubenwedding.website",
    });

    expect(html).toContain("Archduke Ferdinand & Guest");
    expect(html).toContain("https://theandyrubenwedding.website/i/archduke-token");
    expect(html).toContain("seal-monogram.png");
    expect(html).toContain("orchid-spray-horizontal.png");
    expect(html).toContain("orchid-single-bloom.png");
    expect(html).toContain("✦ TOCA EL SELLO LACRADO PARA ABRIR TU INVITACIÓN ✦");
    expect(html).toContain("Kath. Kirche St. Oswald");
    expect(html).toContain("Schloss Hetzendorf");
    expect(html).toContain("2 plazas reservadas (+1)");
  });

  it("buildEnvelopeInvitationHtml supports English localization", () => {
    const html = buildEnvelopeInvitationHtml({
      guestName: "Lady Sarah Spencer",
      invitationUrl: "https://theandyrubenwedding.website/i/sarah-token",
      language: "en",
      maxGuests: 1,
      plusOneAllowed: false,
    });

    expect(html).toContain("Lady Sarah Spencer");
    expect(html).toContain("✦ CLICK THE WAX SEAL TO OPEN YOUR INVITATION ✦");
    expect(html).toContain("1 seat reserved");
    expect(html).toContain("Open Royal Invitation →");
  });

  it("getResendConfig reads from settings properly", () => {
    const config = getResendConfig();
    expect(config.apiKey).toBe("re_test_key_12345");
    expect(config.fromEmail).toBe("wedding@example.com");
    expect(config.fromName).toBe("Ruben & Andrea");
  });

  it("checkResendStatusAction reports connected when API key is valid", async () => {
    apiKeysListMock.mockResolvedValueOnce({ data: [{ id: "key-1" }], error: null });
    domainsListMock.mockResolvedValueOnce({ data: { data: [{ name: "theandyrubenwedding.website", status: "verified" }] }, error: null });

    const status = await checkResendStatusAction();
    expect(status.configured).toBe(true);
    expect(status.connected).toBe(true);
    expect(status.apiKeyMasked).toContain("re_te");
    expect(status.domains?.[0]?.name).toBe("theandyrubenwedding.website");
  });

  it("sendEmailViaResend dispatches email and returns messageId", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "resend-msg-99" }, error: null });

    const result = await sendEmailViaResend({
      to: "guest@example.com",
      subject: "Invitation",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("resend-msg-99");
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guest@example.com",
        from: '"Ruben & Andrea" <wedding@example.com>',
        subject: "Invitation",
      })
    );
  });

  it("testResendConnectionAction sends test message successfully", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "test-msg-123" }, error: null });

    const formData = new FormData();
    formData.set("resendApiKey", "re_override_key");
    formData.set("testEmail", "tester@example.com");

    const result = await testResendConnectionAction(formData);
    expect(result.success).toBe(true);
    expect(result.message).toContain("test-msg-123");
  });
});
