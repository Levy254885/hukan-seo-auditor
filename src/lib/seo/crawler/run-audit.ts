import { prisma } from "@/lib/db";
import { fetchPage } from "@/lib/seo/crawler/fetch";
import { parseHtml } from "@/lib/seo/crawler/parse";
import { detectPageIssues, type DetectedIssue } from "@/lib/seo/checks/issues";
import { scoreFromIssues, SCORING_VERSION } from "@/lib/seo/scoring/score";
import { getDomainFromUrl, parsePublicHttpUrl } from "@/lib/seo/url";

function normalizeKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function shouldExclude(url: string, excludePaths: string[]): boolean {
  try {
    const path = new URL(url).pathname;
    return excludePaths.some((p) => path.startsWith(p));
  } catch {
    return false;
  }
}

export async function runAuditCrawl(auditId: string) {
  const audit = await prisma.audit.findUnique({ where: { id: auditId } });
  if (!audit) throw new Error("Audit not found");

  if (!["QUEUED", "CRAWLING", "ANALYZING"].includes(audit.status)) {
    throw new Error(`Audit status ${audit.status} is not runnable`);
  }

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: "CRAWLING",
      startedAt: audit.startedAt ?? new Date(),
      progress: 10,
      progressMessage: "Discovering pages...",
      errorMessage: null,
    },
  });

  const seed = audit.url;
  const seedHost = getDomainFromUrl(seed);
  const queue: { url: string; depth: number }[] = [{ url: seed, depth: 0 }];
  const visited = new Set<string>();
  const allIssues: DetectedIssue[] = [];
  let pagesCrawled = 0;

  try {
    while (queue.length > 0 && pagesCrawled < audit.crawlLimit) {
      const item = queue.shift()!;
      const key = normalizeKey(item.url);
      if (visited.has(key)) continue;
      if (shouldExclude(item.url, audit.excludePaths)) continue;
      visited.add(key);

      const progress = Math.min(85, 10 + Math.round((pagesCrawled / audit.crawlLimit) * 70));
      await prisma.audit.update({
        where: { id: auditId },
        data: { progress, progressMessage: `Crawling ${key}`, pagesCrawled },
      });

      const fetched = await fetchPage(item.url);
      let parsed = null;
      if (fetched.html) {
        parsed = parseHtml(fetched.html, fetched.finalUrl);
      }

      const isHttps = fetched.finalUrl.startsWith("https:");
      const pageIssues = detectPageIssues({
        url: fetched.finalUrl,
        statusCode: fetched.statusCode,
        responseTimeMs: fetched.responseTimeMs,
        title: parsed?.title ?? null,
        titleLength: parsed?.titleLength ?? 0,
        metaDescription: parsed?.metaDescription ?? null,
        descriptionLength: parsed?.descriptionLength ?? 0,
        h1: parsed?.h1 ?? null,
        h1Count: parsed?.h1Count ?? 0,
        wordCount: parsed?.wordCount ?? 0,
        canonical: parsed?.canonical ?? null,
        robotsMeta: parsed?.robotsMeta ?? null,
        viewport: parsed?.viewport ?? null,
        imagesMissingAlt: parsed?.imagesMissingAlt ?? 0,
        imagesCount: parsed?.images.length ?? 0,
        internalLinks: parsed?.internalLinks.length ?? 0,
        isHttps,
        hasJsonLd: (parsed?.jsonLd.length ?? 0) > 0,
        openGraphCount: Object.keys(parsed?.openGraph ?? {}).length,
      });

      for (const issue of pageIssues) allIssues.push(issue);

      const pageScore = Math.max(
        0,
        100 -
          pageIssues.reduce((sum, i) => {
            const map: Record<string, number> = {
              CRITICAL: 25,
              HIGH: 12,
              MEDIUM: 6,
              LOW: 2,
              INFO: 0,
            };
            return sum + (map[i.severity] ?? 0);
          }, 0)
      );

      await prisma.auditPage.create({
        data: {
          auditId,
          url: fetched.url,
          normalizedUrl: key,
          statusCode: fetched.statusCode || null,
          responseTimeMs: fetched.responseTimeMs,
          title: parsed?.title,
          titleLength: parsed?.titleLength,
          metaDescription: parsed?.metaDescription,
          descriptionLength: parsed?.descriptionLength,
          h1: parsed?.h1,
          headings: parsed?.headings ?? undefined,
          wordCount: parsed?.wordCount,
          canonical: parsed?.canonical,
          robotsDirectives: parsed?.robotsMeta,
          indexable: !(parsed?.robotsMeta && /noindex/i.test(parsed.robotsMeta)),
          internalLinks: parsed?.internalLinks.length ?? 0,
          externalLinks: parsed?.externalLinks.length ?? 0,
          imagesCount: parsed?.images.length ?? 0,
          imagesMissingAlt: parsed?.imagesMissingAlt ?? 0,
          structuredData: parsed?.jsonLd ?? undefined,
          openGraph: parsed?.openGraph ?? undefined,
          twitterMeta: parsed?.twitterMeta ?? undefined,
          pageScore,
          contentType: fetched.contentType,
          redirectedFrom: fetched.redirectedFrom,
          depth: item.depth,
          issues: pageIssues as object[],
        },
      });

      pagesCrawled += 1;

      if (
        parsed &&
        item.depth < audit.crawlDepth &&
        fetched.statusCode >= 200 &&
        fetched.statusCode < 400
      ) {
        for (const link of parsed.internalLinks) {
          try {
            const host = getDomainFromUrl(link);
            if (host !== seedHost) continue;
            const n = normalizeKey(link);
            if (visited.has(n)) continue;
            if (shouldExclude(link, audit.excludePaths)) continue;
            const parsedLink = parsePublicHttpUrl(link);
            if (!parsedLink) continue;
            queue.push({ url: link, depth: item.depth + 1 });
          } catch {
            // skip
          }
        }
      }
    }

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "SCORING",
        progress: 90,
        progressMessage: "Calculating scores...",
        pagesCrawled,
      },
    });

    const seenIssue = new Set<string>();
    for (const issue of allIssues) {
      const k = `${issue.ruleId}|${issue.affectedUrl || ""}`;
      if (seenIssue.has(k)) continue;
      seenIssue.add(k);
      await prisma.auditIssue.create({
        data: {
          auditId,
          ruleId: issue.ruleId,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          evidence: issue.evidence,
          affectedUrl: issue.affectedUrl,
          affectedElement: issue.affectedElement,
          recommendation: issue.recommendation,
          estimatedImpact: issue.estimatedImpact,
        },
      });
    }

    const scores = scoreFromIssues(allIssues);
    const criticalCount = allIssues.filter((i) => i.severity === "CRITICAL").length;
    const highCount = allIssues.filter((i) => i.severity === "HIGH").length;

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "COMPLETED",
        progress: 100,
        progressMessage: "Audit complete",
        completedAt: new Date(),
        overallScore: scores.overall,
        scoringVersion: SCORING_VERSION,
        pagesCrawled,
        issuesCount: seenIssue.size,
        criticalCount,
        highCount,
        technicalScore: scores.technical,
        onPageScore: scores.onpage,
        contentScore: scores.content,
        linksScore: scores.links,
        imagesScore: scores.images,
        performanceScore: scores.performance,
        structuredDataScore: scores.structured,
        mobileScore: scores.mobile,
        localSeoScore: scores.local,
        geoScore: scores.geo,
      },
    });

    await prisma.website.update({
      where: { id: audit.websiteId },
      data: { lastAuditAt: new Date(), latestScore: scores.overall },
    });

    await prisma.report.create({ data: { auditId } });

    return { pagesCrawled, issues: seenIssue.size, score: scores.overall };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed";
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "FAILED",
        progressMessage: "Audit failed",
        errorMessage: message,
      },
    });
    throw error;
  }
}
