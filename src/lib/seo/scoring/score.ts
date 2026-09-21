import type { DetectedIssue } from "@/lib/seo/checks/issues";

export const SCORING_VERSION = "1.0";

const CATEGORY_WEIGHTS: Record<string, number> = {
  technical: 20,
  onpage: 20,
  content: 12,
  links: 10,
  images: 8,
  performance: 10,
  structured: 8,
  mobile: 7,
  local: 3,
  geo: 2,
};

const SEVERITY_PENALTY: Record<string, number> = {
  CRITICAL: 18,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
  INFO: 0,
};

export type CategoryScores = {
  technical: number;
  onpage: number;
  content: number;
  links: number;
  images: number;
  performance: number;
  structured: number;
  mobile: number;
  local: number;
  geo: number;
  overall: number;
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreFromIssues(issues: DetectedIssue[]): CategoryScores {
  const categories = Object.keys(CATEGORY_WEIGHTS);
  const byCategory: Record<string, DetectedIssue[]> = {};
  for (const c of categories) byCategory[c] = [];
  for (const issue of issues) {
    if (!byCategory[issue.category]) byCategory[issue.category] = [];
    byCategory[issue.category].push(issue);
  }

  const scores: Record<string, number> = {};
  for (const c of categories) {
    let penalty = 0;
    for (const issue of byCategory[c] || []) {
      penalty += SEVERITY_PENALTY[issue.severity] ?? 0;
    }
    scores[c] = clamp(100 - penalty);
  }

  let weighted = 0;
  let totalWeight = 0;
  for (const c of categories) {
    const w = CATEGORY_WEIGHTS[c];
    weighted += scores[c] * w;
    totalWeight += w;
  }

  return {
    technical: scores.technical,
    onpage: scores.onpage,
    content: scores.content,
    links: scores.links,
    images: scores.images,
    performance: scores.performance,
    structured: scores.structured,
    mobile: scores.mobile,
    local: scores.local,
    geo: scores.geo,
    overall: clamp(weighted / totalWeight),
  };
}
