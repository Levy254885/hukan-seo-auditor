import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  parsePublicHttpUrl,
  getDomainFromUrl,
  normalizeWebsiteUrl,
  assertSafeCrawlTarget,
} from "@/lib/seo/url";

const createSchema = z.object({
  url: z.string().min(1, "Website URL is required"),
  name: z.string().max(120).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { audits: true } },
    },
  });

  return NextResponse.json({ websites });
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
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const urlObj = parsePublicHttpUrl(parsed.data.url);
  if (!urlObj) {
    return NextResponse.json(
      { error: "Enter a valid http or https URL." },
      { status: 400 }
    );
  }

  const safety = await assertSafeCrawlTarget(urlObj);
  if (!safety.ok) {
    return NextResponse.json({ error: safety.reason }, { status: 400 });
  }

  const normalized = normalizeWebsiteUrl(urlObj);
  const domain = getDomainFromUrl(urlObj);
  const name = parsed.data.name?.trim() || domain;

  const existing = await prisma.website.findUnique({
    where: {
      userId_domain: {
        userId: session.user.id,
        domain,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ website: existing, existing: true });
  }

  const website = await prisma.website.create({
    data: {
      userId: session.user.id,
      name,
      url: normalized,
      domain,
    },
  });

  return NextResponse.json({ website }, { status: 201 });
}
