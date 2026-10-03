import { describe, expect, it } from "vitest";

import { normalizeLookupValue } from "@/lib/invitations/lookup-normalize";

describe("lookup invitation normalization", () => {
  it("normalizes names, emails, and phone numbers before matching", () => {
    expect(normalizeLookupValue("  José García   ")).toBe("jose garcia");
    expect(normalizeLookupValue(" Müller@Example.com ")).toBe("muller@example.com");
    expect(normalizeLookupValue("+43 (1) 234 56 78")).toBe("4312345678");
  });
});
