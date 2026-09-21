import { describe, it, expect } from "vitest";
import { parsePublicHttpUrl, getDomainFromUrl } from "@/lib/seo/url";

describe("parsePublicHttpUrl", () => {
  it("accepts https public URLs", () => {
    const u = parsePublicHttpUrl("https://example.com/path");
    expect(u).not.toBeNull();
    expect(u?.hostname).toBe("example.com");
  });

  it("rejects non-http schemes", () => {
    expect(parsePublicHttpUrl("ftp://example.com")).toBeNull();
    expect(parsePublicHttpUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty / invalid", () => {
    expect(parsePublicHttpUrl("")).toBeNull();
    expect(parsePublicHttpUrl("not a url")).toBeNull();
  });
});

describe("getDomainFromUrl", () => {
  it("strips www", () => {
    expect(getDomainFromUrl("https://www.example.com/a")).toBe("example.com");
  });
});
