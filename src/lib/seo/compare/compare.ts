export type ComparableAudit = {
  publicId: string;
  domain: string;
  completedAt: Date | null;
  overallScore: number | null;
  technicalScore: number | null;
  onPageScore: number | null;
  contentScore: number | null;
  linksScore: number | null;
  imagesScore: number | null;
  performanceScore: number | null;
  structuredDataScore: number | null;
  mobileScore: number | null;
  localSeoScore: number | null;
  geoScore: number | null;
  pagesCrawled: number;
  issuesCount: number;
  criticalCount: number;
  highCount: number;
};

export type ScoreDelta = {
  key: string;
  label: string;
  before: number | null;
  after: number | null;
  delta: number | null;
};

const CATEGORIES: { key: keyof ComparableAudit; label: string }[] = [
  { key: "overallScore", label: "Overall" },
  { key: "technicalScore", label: "Technical" },
  { key: "onPageScore", label: "On-page" },
  { key: "contentScore", label: "Content" },
  { key: "linksScore", label: "Links" },
  { key: "imagesScore", label: "Images" },
  { key: "performanceScore", label: "Performance" },
  { key: "structuredDataScore", label: "Structured data" },
  { key: "mobileScore", label: "Mobile" },
  { key: "localSeoScore", label: "Local" },
  { key: "geoScore", label: "GEO / AI" },
];

export function compareAudits(before: ComparableAudit, after: ComparableAudit) {
  const scoreDeltas: ScoreDelta[] = CATEGORIES.map(({ key, label }) => {
    const b = before[key] as number | null;
    const a = after[key] as number | null;
    const delta = typeof b === "number" && typeof a === "number" ? a - b : null;
    return { key, label, before: b, after: a, delta };
  });

  let improved = 0;
  let declined = 0;
  let unchanged = 0;
  for (const d of scoreDeltas) {
    if (d.delta == null) continue;
    if (d.delta > 0) improved += 1;
    else if (d.delta < 0) declined += 1;
    else unchanged += 1;
  }

  return {
    scoreDeltas,
    pagesDelta: after.pagesCrawled - before.pagesCrawled,
    issuesDelta: after.issuesCount - before.issuesCount,
    criticalDelta: after.criticalCount - before.criticalCount,
    highDelta: after.highCount - before.highCount,
    improved,
    declined,
    unchanged,
  };
}
