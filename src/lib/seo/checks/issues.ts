export type DetectedIssue = {
  ruleId: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  description: string;
  evidence?: string;
  affectedUrl?: string;
  affectedElement?: string;
  recommendation: string;
  estimatedImpact?: string;
};

type PageInput = {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  descriptionLength: number;
  h1: string | null;
  h1Count: number;
  wordCount: number;
  canonical: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  imagesMissingAlt: number;
  imagesCount: number;
  internalLinks: number;
  isHttps: boolean;
  hasJsonLd: boolean;
  openGraphCount: number;
};

export function detectPageIssues(page: PageInput): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const url = page.url;

  if (page.statusCode === 0) {
    issues.push({
      ruleId: "page-unreachable",
      category: "technical",
      severity: "CRITICAL",
      title: "Page could not be fetched",
      description: "The crawler could not retrieve this page.",
      affectedUrl: url,
      recommendation: "Check DNS, SSL, firewall, and server availability.",
      estimatedImpact: "high",
    });
    return issues;
  }

  if (page.statusCode >= 500) {
    issues.push({
      ruleId: "server-error",
      category: "technical",
      severity: "CRITICAL",
      title: `Server error (${page.statusCode})`,
      description: "The page returned a 5xx status code.",
      evidence: `HTTP ${page.statusCode}`,
      affectedUrl: url,
      recommendation: "Fix server errors before expecting indexation.",
      estimatedImpact: "high",
    });
  } else if (page.statusCode >= 400) {
    issues.push({
      ruleId: "client-error",
      category: "technical",
      severity: page.statusCode === 404 ? "HIGH" : "MEDIUM",
      title: `HTTP ${page.statusCode}`,
      description: "The page returned a client error status.",
      evidence: `HTTP ${page.statusCode}`,
      affectedUrl: url,
      recommendation: "Fix broken URLs or return a proper redirect.",
      estimatedImpact: "medium",
    });
  }

  if (!page.isHttps) {
    issues.push({
      ruleId: "not-https",
      category: "technical",
      severity: "CRITICAL",
      title: "Page is not served over HTTPS",
      description: "Search engines and browsers expect HTTPS.",
      affectedUrl: url,
      recommendation: "Enable TLS and redirect HTTP to HTTPS.",
      estimatedImpact: "high",
    });
  }

  if (page.statusCode >= 200 && page.statusCode < 300) {
    if (!page.title) {
      issues.push({
        ruleId: "missing-title",
        category: "onpage",
        severity: "HIGH",
        title: "Missing title tag",
        description: "No <title> element was found.",
        affectedUrl: url,
        affectedElement: "title",
        recommendation: "Add a unique, descriptive title under ~60 characters.",
        estimatedImpact: "high",
      });
    } else if (page.titleLength < 15) {
      issues.push({
        ruleId: "title-too-short",
        category: "onpage",
        severity: "MEDIUM",
        title: "Title tag is very short",
        description: "Short titles often lack context for search results.",
        evidence: `Length: ${page.titleLength}`,
        affectedUrl: url,
        recommendation: "Expand the title with a clear page topic.",
        estimatedImpact: "medium",
      });
    } else if (page.titleLength > 70) {
      issues.push({
        ruleId: "title-too-long",
        category: "onpage",
        severity: "LOW",
        title: "Title tag may be truncated",
        description: "Titles over ~60–70 characters may truncate in SERPs.",
        evidence: `Length: ${page.titleLength}`,
        affectedUrl: url,
        recommendation: "Keep important words near the start of the title.",
        estimatedImpact: "low",
      });
    }

    if (!page.metaDescription) {
      issues.push({
        ruleId: "missing-meta-description",
        category: "onpage",
        severity: "MEDIUM",
        title: "Missing meta description",
        description: "No meta description was found.",
        affectedUrl: url,
        affectedElement: 'meta[name="description"]',
        recommendation: "Write a unique summary of about 120–160 characters.",
        estimatedImpact: "medium",
      });
    } else if (page.descriptionLength > 320) {
      issues.push({
        ruleId: "meta-description-long",
        category: "onpage",
        severity: "LOW",
        title: "Meta description is long",
        description: "Very long descriptions may be truncated.",
        evidence: `Length: ${page.descriptionLength}`,
        affectedUrl: url,
        recommendation: "Tighten the description around the primary intent.",
        estimatedImpact: "low",
      });
    }

    if (page.h1Count === 0) {
      issues.push({
        ruleId: "missing-h1",
        category: "onpage",
        severity: "HIGH",
        title: "Missing H1",
        description: "No H1 heading was found.",
        affectedUrl: url,
        recommendation: "Add one clear H1 that describes the page topic.",
        estimatedImpact: "medium",
      });
    } else if (page.h1Count > 1) {
      issues.push({
        ruleId: "multiple-h1",
        category: "onpage",
        severity: "LOW",
        title: "Multiple H1 headings",
        description: "More than one H1 was detected.",
        evidence: `H1 count: ${page.h1Count}`,
        affectedUrl: url,
        recommendation: "Prefer a single primary H1 for clarity.",
        estimatedImpact: "low",
      });
    }

    if (!page.canonical) {
      issues.push({
        ruleId: "missing-canonical",
        category: "technical",
        severity: "MEDIUM",
        title: "Missing canonical URL",
        description: "No rel=canonical link was detected.",
        affectedUrl: url,
        recommendation: "Add a self-referencing canonical where appropriate.",
        estimatedImpact: "medium",
      });
    }

    if (!page.viewport) {
      issues.push({
        ruleId: "missing-viewport",
        category: "mobile",
        severity: "HIGH",
        title: "Missing viewport meta tag",
        description: "Mobile browsers may not scale the page correctly.",
        affectedUrl: url,
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
        estimatedImpact: "high",
      });
    }

    if (page.wordCount > 0 && page.wordCount < 50) {
      issues.push({
        ruleId: "thin-content",
        category: "content",
        severity: "MEDIUM",
        title: "Very thin content",
        description: "The page has little textual content.",
        evidence: `Word count: ${page.wordCount}`,
        affectedUrl: url,
        recommendation: "Expand useful content that matches search intent.",
        estimatedImpact: "medium",
      });
    }

    if (page.imagesCount > 0 && page.imagesMissingAlt > 0) {
      issues.push({
        ruleId: "images-missing-alt",
        category: "images",
        severity: "MEDIUM",
        title: "Images missing alt text",
        description: "Some images have empty or missing alt attributes.",
        evidence: `${page.imagesMissingAlt} of ${page.imagesCount} images`,
        affectedUrl: url,
        recommendation: "Add meaningful alt text for informative images.",
        estimatedImpact: "medium",
      });
    }

    if (page.internalLinks === 0) {
      issues.push({
        ruleId: "no-internal-links",
        category: "links",
        severity: "MEDIUM",
        title: "No internal links found",
        description: "The page does not link to other internal pages.",
        affectedUrl: url,
        recommendation: "Add contextual internal links to related pages.",
        estimatedImpact: "medium",
      });
    }

    if (!page.hasJsonLd) {
      issues.push({
        ruleId: "no-structured-data",
        category: "structured",
        severity: "LOW",
        title: "No JSON-LD structured data detected",
        description: "Structured data was not found on this page.",
        affectedUrl: url,
        recommendation: "Add relevant schema (Organization, WebPage, Product, etc.) where accurate.",
        estimatedImpact: "low",
      });
    }

    if (page.openGraphCount === 0) {
      issues.push({
        ruleId: "missing-open-graph",
        category: "onpage",
        severity: "LOW",
        title: "Missing Open Graph tags",
        description: "No og:* meta tags were found.",
        affectedUrl: url,
        recommendation: "Add og:title, og:description, and og:image for social sharing.",
        estimatedImpact: "low",
      });
    }

    if (page.responseTimeMs > 3000) {
      issues.push({
        ruleId: "slow-response",
        category: "performance",
        severity: "MEDIUM",
        title: "Slow server response",
        description: "Time to first response exceeded 3 seconds from the crawler.",
        evidence: `${page.responseTimeMs} ms`,
        affectedUrl: url,
        recommendation: "Improve TTFB with caching, hosting, and lighter responses.",
        estimatedImpact: "medium",
      });
    }

    if (page.robotsMeta && /noindex/i.test(page.robotsMeta)) {
      issues.push({
        ruleId: "noindex",
        category: "technical",
        severity: "INFO",
        title: "Page is marked noindex",
        description: "Meta robots includes noindex.",
        evidence: page.robotsMeta,
        affectedUrl: url,
        recommendation: "Only use noindex intentionally for pages that should stay out of search.",
        estimatedImpact: "depends",
      });
    }
  }

  return issues;
}
