import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { buildAuditPdf } from "@/lib/seo/pdf/report-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publicId } = await params;
  const audit = await prisma.audit.findFirst({
    where: { publicId, userId: session.user.id },
    include: {
      issues: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
      pages: {
        orderBy: { createdAt: "asc" },
        take: 40,
        select: {
          url: true,
          statusCode: true,
          title: true,
          pageScore: true,
        },
      },
      report: true,
    },
  });

  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (audit.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "PDF is only available for completed audits." },
      { status: 409 }
    );
  }

  const pdf = buildAuditPdf({
    domain: audit.domain,
    url: audit.url,
    overallScore: audit.overallScore,
    pagesCrawled: audit.pagesCrawled,
    issuesCount: audit.issuesCount,
    criticalCount: audit.criticalCount,
    highCount: audit.highCount,
    completedAt: audit.completedAt,
    scoringVersion: audit.scoringVersion,
    publicId: audit.publicId,
    scores: {
      Technical: audit.technicalScore,
      "On-page": audit.onPageScore,
      Content: audit.contentScore,
      Links: audit.linksScore,
      Images: audit.imagesScore,
      Performance: audit.performanceScore,
      "Structured data": audit.structuredDataScore,
      Mobile: audit.mobileScore,
      Local: audit.localSeoScore,
      "GEO / AI": audit.geoScore,
    },
    issues: audit.issues.map((i) => ({
      severity: i.severity,
      category: i.category,
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
      evidence: i.evidence,
      affectedUrl: i.affectedUrl,
    })),
    pages: audit.pages.map((p) => ({
      url: p.url,
      statusCode: p.statusCode,
      title: p.title,
      pageScore: p.pageScore,
    })),
  });

  const filename = `hukan-seo-audit-${audit.domain.replace(/[^a-z0-9.-]/gi, "_")}-${publicId.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
