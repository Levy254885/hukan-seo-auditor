import { prisma } from "../lib/db";
import { runAuditCrawl } from "../lib/seo/crawler/run-audit";

const POLL_MS = Number(process.env.WORKER_POLL_MS || 5000);

async function claimNextAudit() {
  const job = await prisma.auditJob.findFirst({
    where: { status: "pending", stage: "crawl" },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return null;

  await prisma.auditJob.update({
    where: { id: job.id },
    data: {
      status: "running",
      attempts: { increment: 1 },
      startedAt: new Date(),
    },
  });

  return job;
}

async function loop() {
  console.log("[worker] Hukan SEO Auditor worker started");
  for (;;) {
    try {
      const job = await claimNextAudit();
      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }

      console.log(`[worker] Running audit ${job.auditId}`);
      try {
        const result = await runAuditCrawl(job.auditId);
        await prisma.auditJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            error: null,
          },
        });
        console.log(
          `[worker] Completed audit ${job.auditId}: ${result.pagesCrawled} pages, score ${result.score}`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "failed";
        await prisma.auditJob.update({
          where: { id: job.id },
          data: {
            status: job.attempts + 1 >= job.maxAttempts ? "failed" : "pending",
            error: message,
          },
        });
        console.error(`[worker] Audit ${job.auditId} error:`, message);
      }
    } catch (error) {
      console.error("[worker] loop error", error);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

loop();
