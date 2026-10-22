import { describe, expect, it } from "vitest";
import { ALWAYS_REQUIRED_FIELDS, computePriority, missingFields, requiredFields } from "../intake-schema";

describe("requiredFields", () => {
  it.each(["hardware", "software"] as const)("adds device fields for %s issues", (category) => {
    expect(requiredFields(category)).toEqual([...ALWAYS_REQUIRED_FIELDS, "deviceType", "operatingSystem"]);
  });

  it.each(["network", "account_access", "other", undefined] as const)("omits device fields for %s", (category) => {
    expect(requiredFields(category)).toEqual([...ALWAYS_REQUIRED_FIELDS]);
  });
});

describe("missingFields", () => {
  it("excludes collected and declined fields", () => {
    const missing = missingFields({ fullName: "Ada Lovelace", issueCategory: "network" }, ["email"]);
    expect(missing).toEqual(["department", "issueDescription", "startedAt", "impact", "canStillWork"]);
  });

  it("requires device fields once the category is hardware", () => {
    expect(missingFields({ issueCategory: "hardware" }, [])).toContain("deviceType");
  });
});

describe("computePriority", () => {
  const base = { issueCategory: "software", impact: "just_me", canStillWork: true } as const;

  it("is null until impact, canStillWork and category are known", () => {
    expect(computePriority({ impact: "just_me", canStillWork: true }, [])).toBeNull();
  });

  it("returns P1 for the whole office, even if work is blocked", () => {
    expect(computePriority({ ...base, impact: "whole_office", canStillWork: false }, [])).toBe("P1");
  });

  it("returns P2 for a team impact", () => {
    expect(computePriority({ ...base, impact: "my_team" }, [])).toBe("P2");
  });

  it("returns P2 when the user cannot work, before checking account access", () => {
    expect(computePriority({ ...base, issueCategory: "account_access", canStillWork: false }, [])).toBe("P2");
  });

  it("returns P3 for account access", () => {
    expect(computePriority({ ...base, issueCategory: "account_access" }, [])).toBe("P3");
  });

  it("returns P4 otherwise", () => {
    expect(computePriority(base, [])).toBe("P4");
  });

  it("treats declined inputs as known but matching no rule", () => {
    expect(computePriority({ issueCategory: "other" }, ["impact", "canStillWork"])).toBe("P4");
  });
});
