import { describe, expect, it } from "vitest";
import type { Intake } from "../intake-schema";
import { buildSummary } from "../intake-summary";

const networkIntake: Partial<Intake> = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  department: "Finance",
  issueCategory: "network",
  issueDescription: "Office Wi-Fi is down for everyone on the third floor since this morning.",
  startedAt: "This morning",
  impact: "whole_office",
  canStillWork: false,
};

describe("buildSummary", () => {
  it("starts with a title line and lists the sections with data", () => {
    const summary = buildSummary(networkIntake, [], "P1");
    expect(summary.split("\n")[0]).toBe("[P1] Network: Office Wi-Fi is down for everyone on the third floor since t...");
    expect(summary).toContain("Requester\nName: Ada Lovelace\nEmail: ada@example.com\nDepartment: Finance");
    expect(summary).toContain("Impact\nAffected: Whole office\nCan still work: No");
  });

  it("omits empty sections and absent optional fields", () => {
    const summary = buildSummary(networkIntake, [], "P1");
    expect(summary).not.toContain("Environment");
    expect(summary).not.toContain("Already tried");
    expect(summary).not.toContain("Error message");
  });

  it("prints Not provided for declined fields", () => {
    const withoutDepartment = { ...networkIntake, department: undefined };
    expect(buildSummary(withoutDepartment, ["department"], "P1")).toContain("Department: Not provided");
  });

  it("includes environment and steps tried when given", () => {
    const summary = buildSummary(
      { ...networkIntake, issueCategory: "hardware", deviceType: "laptop", operatingSystem: "Windows 11", stepsTried: "Rebooted" },
      [],
      "P1",
    );
    expect(summary).toContain("Environment\nDevice: Laptop\nOperating system: Windows 11");
    expect(summary).toContain("Already tried\nSteps: Rebooted");
  });
});
