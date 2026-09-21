import { describe, it, expect } from "vitest";
import { scoreFromIssues, SCORING_VERSION } from "@/lib/seo/scoring/score";
import type { DetectedIssue } from "@/lib/seo/checks/issues";

function issue(
  partial: Partial<DetectedIssue> & Pick<DetectedIssue, "ruleId" | "severity" | "category">
): DetectedIssue {
  return {
    title: partial.title || partial.ruleId,
    description: partial.description || "test",
    recommendation: partial.recommendation || "fix",
    ...partial,
  };
}

describe("scoreFromIssues", () => {
  it("returns perfect scores with no issues", () => {
    const scores = scoreFromIssues([]);
    expect(scores.overall).toBe(100);
    expect(scores.technical).toBe(100);
    expect(scores.onpage).toBe(100);
  });

  it("applies critical penalties", () => {
    const scores = scoreFromIssues([
      issue({ ruleId: "not-https", category: "technical", severity: "CRITICAL" }),
    ]);
    expect(scores.technical).toBeLessThan(100);
    expect(scores.overall).toBeLessThan(100);
  });

  it("is deterministic for the same input", () => {
    const issues = [
      issue({ ruleId: "missing-title", category: "onpage", severity: "HIGH" }),
      issue({ ruleId: "thin-content", category: "content", severity: "MEDIUM" }),
    ];
    expect(scoreFromIssues(issues)).toEqual(scoreFromIssues(issues));
  });

  it("exposes scoring version", () => {
    expect(SCORING_VERSION).toMatch(/^\d+\.\d+/);
  });
});
