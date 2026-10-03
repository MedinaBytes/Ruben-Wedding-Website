import { describe, expect, it } from "vitest";

import de from "./de/common.json";
import en from "./en/common.json";
import es from "./es/common.json";
import hu from "./hu/common.json";

function messagePaths(value: unknown, parent = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [parent];

  return Object.entries(value).flatMap(([key, child]) =>
    messagePaths(child, parent ? `${parent}.${key}` : key),
  ).sort();
}

describe("locale message structure", () => {
  it("keeps every locale's message keys aligned with English", () => {
    const englishPaths = messagePaths(en);

    expect(messagePaths(es)).toEqual(englishPaths);
    expect(messagePaths(de)).toEqual(englishPaths);
    expect(messagePaths(hu)).toEqual(englishPaths);
  });
});
