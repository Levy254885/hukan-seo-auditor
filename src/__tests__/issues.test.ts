import { describe, it, expect } from "vitest";
import { detectPageIssues } from "@/lib/seo/checks/issues";

const base = {
  url: "https://example.com/",
  statusCode: 200,
  responseTimeMs: 200,
  title: "Example Domain Site Title",
  titleLength: 24,
  metaDescription: "A reasonable meta description for testing purposes here.",
  descriptionLength: 55,
  h1: "Example",
  h1Count: 1,
  wordCount: 300,
  canonical: "https://example.com/",
  robotsMeta: null as string | null,
  viewport: "width=device-width, initial-scale=1",
  imagesMissingAlt: 0,
  imagesCount: 2,
  internalLinks: 5,
  isHttps: true,
  hasJsonLd: true,
  openGraphCount: 3,
};

describe("detectPageIssues", () => {
  it("finds no critical issues on a healthy page", () => {
    const issues = detectPageIssues(base);
    expect(issues.filter((i) => i.severity === "CRITICAL")).toHaveLength(0);
  });

  it("flags missing title", () => {
    const issues = detectPageIssues({
      ...base,
      title: null,
      titleLength: 0,
    });
    expect(issues.some((i) => i.ruleId === "missing-title")).toBe(true);
  });

  it("flags non-https", () => {
    const issues = detectPageIssues({
      ...base,
      url: "http://example.com/",
      isHttps: false,
    });
    expect(issues.some((i) => i.ruleId === "not-https")).toBe(true);
  });

  it("flags unreachable pages", () => {
    const issues = detectPageIssues({
      ...base,
      statusCode: 0,
    });
    expect(issues.some((i) => i.ruleId === "page-unreachable")).toBe(true);
  });
});
