/**
 * Professional multi-page SEO audit PDF (no external PDF library).
 * Headers, score card, category bars, severity-grouped issues, page table, footer.
 */

export type PdfIssue = {
  severity: string;
  category: string;
  title: string;
  description?: string;
  recommendation: string;
  evidence?: string | null;
  affectedUrl?: string | null;
};

export type PdfPageRow = {
  url: string;
  statusCode: number | null;
  title: string | null;
  pageScore: number | null;
};

export type PdfInput = {
  domain: string;
  url: string;
  overallScore: number | null;
  pagesCrawled: number;
  issuesCount: number;
  criticalCount: number;
  highCount: number;
  completedAt: Date | null;
  scoringVersion: string;
  scores: Record<string, number | null>;
  issues: PdfIssue[];
  pages?: PdfPageRow[];
  publicId?: string;
};

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 40;
const HEADER_BOTTOM = PAGE_H - 52;

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function clip(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "\u2026";
}

function scoreTone(score: number | null): [number, number, number] {
  if (score == null) return [0.55, 0.55, 0.55];
  if (score >= 80) return [0.05, 0.55, 0.35];
  if (score >= 60) return [0.75, 0.5, 0.05];
  return [0.75, 0.15, 0.12];
}

class Doc {
  pages: string[][] = [[]];
  y = HEADER_BOTTOM;
  pageIndex = 0;
  input: PdfInput;

  constructor(input: PdfInput) {
    this.input = input;
  }

  private ops() {
    return this.pages[this.pageIndex];
  }

  private push(...ops: string[]) {
    this.ops().push(...ops);
  }

  newPage() {
    this.pages.push([]);
    this.pageIndex = this.pages.length - 1;
    this.y = HEADER_BOTTOM;
    this.drawChrome(false, this.input);
  }

  ensure(space: number) {
    if (this.y - space < FOOTER_Y + 24) {
      this.newPage();
    }
  }

  setFill(r: number, g: number, b: number) {
    this.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  setStroke(r: number, g: number, b: number) {
    this.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  rect(x: number, y: number, w: number, h: number, mode: "f" | "S" | "B" = "f") {
    this.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${mode}`);
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    this.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  text(
    str: string,
    x: number,
    y: number,
    size: number,
    bold = false,
    color: [number, number, number] = [0.1, 0.1, 0.12]
  ) {
    this.setFill(...color);
    this.push("BT");
    this.push(`/${bold ? "F2" : "F1"} ${size} Tf`);
    this.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
    this.push(`(${esc(str)}) Tj`);
    this.push("ET");
  }

  drawChrome(isFirst: boolean, input?: PdfInput) {
    this.setFill(0.07, 0.09, 0.14);
    this.rect(0, PAGE_H - 34, PAGE_W, 34, "f");
    this.text("HUKAN SEO AUDITOR", MARGIN, PAGE_H - 21, 10, true, [1, 1, 1]);
    this.text("Professional SEO Audit Report", PAGE_W - MARGIN - 148, PAGE_H - 21, 8, false, [
      0.72, 0.75, 0.82,
    ]);

    this.y = HEADER_BOTTOM;

    if (isFirst && input) {
      this.text(clip(input.domain, 48), MARGIN, this.y, 18, true);
      this.y -= 22;
      this.text(clip(input.url, 92), MARGIN, this.y, 9, false, [0.4, 0.42, 0.48]);
      this.y -= 14;
      const when = input.completedAt
        ? input.completedAt.toISOString().replace("T", " ").slice(0, 19) + " UTC"
        : "n/a";
      this.text(
        `Completed: ${when}  \u00b7  Scoring v${input.scoringVersion}  \u00b7  Ref: ${(input.publicId || "\u2014").slice(0, 10)}`,
        MARGIN,
        this.y,
        8,
        false,
        [0.45, 0.47, 0.52]
      );
      this.y -= 12;
      this.setStroke(0.86, 0.87, 0.9);
      this.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
      this.y -= 16;
    } else if (input) {
      this.text(clip(input.domain, 50) + " \u2014 continued", MARGIN, this.y, 10, true, [
        0.25, 0.27, 0.32,
      ]);
      this.y -= 18;
    }
  }

  finalizeFooters(input: PdfInput) {
    const total = this.pages.length;
    for (let i = 0; i < total; i++) {
      const ops = this.pages[i];
      ops.push("0.88 0.89 0.91 RG");
      ops.push(`${MARGIN} 32 m ${PAGE_W - MARGIN} 32 l S`);
      ops.push("0.5 0.52 0.55 rg");
      ops.push("BT /F1 7 Tf");
      ops.push(`${MARGIN} 18 Td`);
      ops.push(
        `(${esc("Confidential \u00b7 Hukan SEO Auditor \u00b7 KES 500 professional audit")}) Tj`
      );
      ops.push("ET");
      ops.push("BT /F1 7 Tf");
      ops.push(`${PAGE_W - MARGIN - 58} 18 Td`);
      ops.push(`(${esc(`Page ${i + 1} of ${total}`)}) Tj`);
      ops.push("ET");
    }
  }
}

function assemblePdf(pageOps: string[][]): Buffer {
  const pageContents = pageOps.map((ops) => ops.join("\n"));
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  const kids = pageContents.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(
    `2 0 obj<< /Type /Pages /Kids [${kids}] /Count ${pageContents.length} >>endobj\n`
  );

  const fontRegular = 3 + pageContents.length * 2;
  const fontBold = fontRegular + 1;
  let objNum = 3;
  for (let i = 0; i < pageContents.length; i++) {
    const contentObj = objNum + 1;
    objects.push(
      `${objNum} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentObj} 0 R /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> >>endobj\n`
    );
    const stream = pageContents[i];
    objects.push(
      `${contentObj} 0 obj<< /Length ${Buffer.byteLength(stream, "utf8")} >>stream\n${stream}\nendstream\nendobj\n`
    );
    objNum += 2;
  }
  objects.push(
    `${fontRegular} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n`
  );
  objects.push(
    `${fontBold} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj\n`
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export function buildAuditPdf(input: PdfInput): Buffer {
  const doc = new Doc(input);
  doc.drawChrome(true, input);

  doc.ensure(80);
  const boxH = 70;
  const boxTop = doc.y;
  doc.setFill(0.96, 0.97, 0.98);
  doc.rect(MARGIN, boxTop - boxH, CONTENT_W, boxH, "f");
  doc.setStroke(0.88, 0.9, 0.92);
  doc.rect(MARGIN, boxTop - boxH, CONTENT_W, boxH, "S");

  doc.text("OVERALL SEO SCORE", MARGIN + 14, boxTop - 18, 8, false, [0.4, 0.42, 0.48]);
  const scoreLabel = input.overallScore != null ? String(input.overallScore) : "\u2014";
  const tone = scoreTone(input.overallScore);
  doc.text(scoreLabel, MARGIN + 14, boxTop - 48, 26, true, tone);
  doc.text("/ 100", MARGIN + 14 + (scoreLabel.length >= 3 ? 48 : 34), boxTop - 44, 10, false, [
    0.45, 0.47, 0.52,
  ]);

  const stats: [string, string][] = [
    ["Pages crawled", String(input.pagesCrawled)],
    ["Issues found", String(input.issuesCount)],
    ["Critical", String(input.criticalCount)],
    ["High priority", String(input.highCount)],
  ];
  let sy = boxTop - 18;
  for (const [label, val] of stats) {
    doc.text(label, MARGIN + 150, sy, 8, false, [0.45, 0.47, 0.52]);
    doc.text(val, MARGIN + 240, sy, 10, true);
    sy -= 13;
  }

  let verdict = "Needs significant improvement";
  if (input.overallScore != null) {
    if (input.overallScore >= 85) verdict = "Strong technical foundation";
    else if (input.overallScore >= 70) verdict = "Good \u2014 address remaining issues";
    else if (input.overallScore >= 50) verdict = "Fair \u2014 prioritise high-impact fixes";
  }
  doc.text(verdict, MARGIN + 320, boxTop - 36, 9, true, tone);
  doc.y = boxTop - boxH - 18;

  doc.ensure(40);
  doc.text("Category scores", MARGIN, doc.y, 12, true);
  doc.y -= 16;

  const barMax = 200;
  for (const [label, score] of Object.entries(input.scores)) {
    doc.ensure(16);
    doc.text(clip(label, 20), MARGIN, doc.y, 9, false, [0.25, 0.27, 0.3]);
    doc.text(score != null ? String(score) : "\u2014", MARGIN + 118, doc.y, 9, true);

    const trackY = doc.y - 1;
    doc.setFill(0.9, 0.91, 0.93);
    doc.rect(MARGIN + 150, trackY, barMax, 7, "f");
    if (score != null) {
      const w = Math.max(2, (Math.min(100, Math.max(0, score)) / 100) * barMax);
      doc.setFill(...scoreTone(score));
      doc.rect(MARGIN + 150, trackY, w, 7, "f");
    }
    doc.y -= 15;
  }
  doc.y -= 8;

  doc.ensure(36);
  doc.text("Issues & recommendations", MARGIN, doc.y, 12, true);
  doc.y -= 12;
  doc.text(
    `${input.issuesCount} issue(s) \u00b7 showing up to 50 detail rows`,
    MARGIN,
    doc.y,
    8,
    false,
    [0.45, 0.47, 0.52]
  );
  doc.y -= 14;

  const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  const sorted = [...input.issues].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity)
  );

  if (sorted.length === 0) {
    doc.text("No issues were recorded for this audit.", MARGIN, doc.y, 10);
    doc.y -= 14;
  }

  for (const issue of sorted.slice(0, 50)) {
    const need = 52 + (issue.affectedUrl ? 10 : 0) + (issue.description ? 10 : 0);
    doc.ensure(need);

    const sevColor: [number, number, number] =
      issue.severity === "CRITICAL"
        ? [0.75, 0.15, 0.12]
        : issue.severity === "HIGH"
          ? [0.8, 0.35, 0.1]
          : issue.severity === "MEDIUM"
            ? [0.75, 0.55, 0.05]
            : [0.4, 0.45, 0.5];

    doc.setFill(...sevColor);
    doc.rect(MARGIN, doc.y - 2, 54, 11, "f");
    doc.text(issue.severity.slice(0, 8), MARGIN + 3, doc.y, 7, true, [1, 1, 1]);
    doc.text(issue.category.toUpperCase(), MARGIN + 60, doc.y, 8, false, [0.45, 0.47, 0.52]);
    doc.y -= 13;

    doc.text(clip(issue.title, 88), MARGIN, doc.y, 10, true);
    doc.y -= 12;

    if (issue.description) {
      doc.text(clip(issue.description, 95), MARGIN, doc.y, 8, false, [0.35, 0.37, 0.4]);
      doc.y -= 11;
    }

    doc.text("Fix: " + clip(issue.recommendation, 90), MARGIN, doc.y, 8, false, [
      0.12, 0.35, 0.25,
    ]);
    doc.y -= 11;

    if (issue.affectedUrl) {
      doc.text(clip(issue.affectedUrl, 95), MARGIN, doc.y, 7, false, [0.5, 0.52, 0.55]);
      doc.y -= 10;
    }

    doc.setStroke(0.92, 0.93, 0.94);
    doc.line(MARGIN, doc.y + 2, PAGE_W - MARGIN, doc.y + 2);
    doc.y -= 8;
  }

  if (input.pages && input.pages.length > 0) {
    doc.ensure(40);
    doc.text("Crawled pages", MARGIN, doc.y, 12, true);
    doc.y -= 14;

    doc.setFill(0.94, 0.95, 0.96);
    doc.rect(MARGIN, doc.y - 3, CONTENT_W, 14, "f");
    doc.text("URL", MARGIN + 4, doc.y, 8, true, [0.3, 0.32, 0.35]);
    doc.text("HTTP", MARGIN + 300, doc.y, 8, true, [0.3, 0.32, 0.35]);
    doc.text("Score", MARGIN + 340, doc.y, 8, true, [0.3, 0.32, 0.35]);
    doc.text("Title", MARGIN + 385, doc.y, 8, true, [0.3, 0.32, 0.35]);
    doc.y -= 16;

    for (const row of input.pages.slice(0, 40)) {
      doc.ensure(12);
      doc.text(clip(row.url, 46), MARGIN + 4, doc.y, 7);
      doc.text(row.statusCode != null ? String(row.statusCode) : "\u2014", MARGIN + 300, doc.y, 7);
      doc.text(row.pageScore != null ? String(row.pageScore) : "\u2014", MARGIN + 340, doc.y, 7);
      doc.text(clip(row.title || "\u2014", 28), MARGIN + 385, doc.y, 7, false, [0.4, 0.42, 0.45]);
      doc.y -= 11;
    }
  }

  doc.ensure(60);
  doc.y -= 6;
  doc.setStroke(0.88, 0.89, 0.91);
  doc.line(MARGIN, doc.y, PAGE_W - MARGIN, doc.y);
  doc.y -= 16;
  doc.text("Recommended next steps", MARGIN, doc.y, 11, true);
  doc.y -= 14;
  const steps = [
    "1. Resolve CRITICAL and HIGH issues first \u2014 they affect crawlability and rankings.",
    "2. Re-run an audit after changes and use Compare to measure progress.",
    "3. Request SEO fixes from your dashboard if you need implementation support.",
  ];
  for (const s of steps) {
    doc.ensure(12);
    doc.text(s, MARGIN, doc.y, 8, false, [0.3, 0.32, 0.35]);
    doc.y -= 12;
  }

  doc.finalizeFooters(input);
  return assemblePdf(doc.pages);
}
