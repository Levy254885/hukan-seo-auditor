import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  DEFAULT_CRAWL_DEPTH,
  DEFAULT_CRAWL_LIMIT,
  MAX_CRAWL_DEPTH,
  MAX_CRAWL_LIMIT,
} from "@/lib/seo/url";

const createSchema = z.object({
  websiteId: z.string().min(1),
  crawlLimit: z.number().int().min(5).max(MAX_CRAWL_LIMIT).optional(),
  crawlDepth: z.number().int().min(1).max(MAX_CRAWL_DEPTH).optional(),
  includePaths: z.array(z.string().max(200)).max(20).optional(),
  excludePaths: z.array(z.string().max(200)).max(20).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audits = await prisma.audit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      publicId: true,
      domain: true,
      url: true,
      status: true,
      overallScore: true,
      pagesCrawled: true,
      issuesCount: true,
      createdAt: true,
      completedAt: true,
      websiteId: true,
    },
  });

  return NextResponse.json({ audits });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid audit configuration" },
      { status: 400 }
    );
  }

  const website = await prisma.website.findFirst({
    where: { id: parsed.data.websiteId, userId: session.user.id },
  });

  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  const audit = await prisma.audit.create({
    data: {
      userId: session.user.id,
      websiteId: website.id,
      status: "PENDING_PAYMENT",
      url: website.url,
      domain: website.domain,
      crawlLimit: parsed.data.crawlLimit ?? DEFAULT_CRAWL_LIMIT,
      crawlDepth: parsed.data.crawlDepth ?? DEFAULT_CRAWL_DEPTH,
      includePaths: parsed.data.includePaths ?? [],
      excludePaths: parsed.data.excludePaths ?? [],
      progress: 0,
      progressMessage: "Waiting for payment",
    },
  });

  return NextResponse.json(
    {
      audit: {
        id: audit.id,
        publicId: audit.publicId,
        status: audit.status,
        domain: audit.domain,
        crawlLimit: audit.crawlLimit,
        crawlDepth: audit.crawlDepth,
      },
    },
    { status: 201 }
  );
}
