import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runAuditCrawl } from "@/lib/seo/crawler/run-audit";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const session = await getSession();
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  let auditId = body.auditId as string | undefined;

  if (!auditId) {
    const job = await prisma.auditJob.findFirst({
      where: { status: "pending", stage: "crawl" },
      orderBy: { createdAt: "asc" },
    });
    if (!job) {
      return NextResponse.json({ message: "No queued audits" });
    }
    auditId = job.auditId;
    await prisma.auditJob.update({
      where: { id: job.id },
      data: { status: "running", startedAt: new Date(), attempts: { increment: 1 } },
    });
  }

  try {
    const result = await runAuditCrawl(auditId);
    await prisma.auditJob.updateMany({
      where: { auditId, stage: "crawl", status: "running" },
      data: { status: "completed", completedAt: new Date() },
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    await prisma.auditJob.updateMany({
      where: { auditId, stage: "crawl" },
      data: { status: "failed", error: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
