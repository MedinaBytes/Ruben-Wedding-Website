import { describe, expect, it } from "vitest";

import { isJsonRequest, isSameOriginMutation } from "./request";

describe("same-origin mutation guard", () => {
  it("allows JSON requests from the current origin", () => {
    const request = new Request("https://invitation.example/api/invitation/token/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://invitation.example" },
    });

    expect(isSameOriginMutation(request)).toBe(true);
    expect(isJsonRequest(request)).toBe(true);
  });

  it("rejects cross-origin requests and form content", () => {
    const request = new Request("https://invitation.example/api/invitation/token/rsvp", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://attacker.example" },
    });

    expect(isSameOriginMutation(request)).toBe(false);
    expect(isJsonRequest(request)).toBe(false);
  });

  it("accepts browser same-site requests without an Origin header", () => {
    const request = new Request("https://invitation.example/api/invitation/token/open", {
      method: "POST",
      headers: { "sec-fetch-site": "same-origin" },
    });

    expect(isSameOriginMutation(request)).toBe(true);
  });
});
