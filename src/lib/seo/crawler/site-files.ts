import { fetchPage } from "@/lib/seo/crawler/fetch";
import type { DetectedIssue } from "@/lib/seo/checks/issues";

export async function checkSiteFiles(origin: string): Promise<DetectedIssue[]> {
  const issues: DetectedIssue[] = [];
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const sitemapUrl = new URL("/sitemap.xml", origin).toString();

  const robots = await fetchPage(robotsUrl);
  if (robots.statusCode === 0 || robots.statusCode >= 400) {
    issues.push({
      ruleId: "robots-missing",
      category: "technical",
      severity: "MEDIUM",
      title: "robots.txt not found",
      description: "Could not fetch /robots.txt with a successful status.",
      evidence: robots.statusCode ? `HTTP ${robots.statusCode}` : robots.error || "unreachable",
      affectedUrl: robotsUrl,
      recommendation: "Publish a robots.txt that allows crawling of public pages.",
      estimatedImpact: "medium",
    });
  } else if (robots.html && /Disallow:\s*\/\s*$/im.test(robots.html) && !/Allow:/i.test(robots.html)) {
    issues.push({
      ruleId: "robots-blocks-all",
      category: "technical",
      severity: "HIGH",
      title: "robots.txt appears to block all crawling",
      description: "A Disallow: / rule was detected without a compensating Allow rule.",
      affectedUrl: robotsUrl,
      recommendation: "Only block private paths; keep public content crawlable.",
      estimatedImpact: "high",
    });
  }

  const sitemap = await fetchPage(sitemapUrl);
  if (sitemap.statusCode === 0 || sitemap.statusCode >= 400) {
    issues.push({
      ruleId: "sitemap-missing",
      category: "technical",
      severity: "MEDIUM",
      title: "sitemap.xml not found",
      description: "Could not fetch /sitemap.xml with a successful status.",
      evidence: sitemap.statusCode ? `HTTP ${sitemap.statusCode}` : sitemap.error || "unreachable",
      affectedUrl: sitemapUrl,
      recommendation: "Publish an XML sitemap and reference it in robots.txt.",
      estimatedImpact: "medium",
    });
  }

  return issues;
}
