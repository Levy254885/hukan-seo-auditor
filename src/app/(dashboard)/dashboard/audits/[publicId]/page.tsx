import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PaymentForm } from "@/components/dashboard/payment-form";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { publicId } = await params;
  const audit = await prisma.audit.findFirst({
    where: { publicId, userId: session.user.id },
    include: {
      pages: { orderBy: { createdAt: "asc" }, take: 50 },
      issues: { orderBy: { createdAt: "asc" }, take: 100 },
    },
  });

  if (!audit) notFound();

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  const sortedIssues = [...audit.issues].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          <Link href="/dashboard/audits" className="hover:underline">Audits</Link> / {audit.domain}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{audit.domain}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)] break-all">{audit.url}</p>
        {audit.status === "COMPLETED" && (
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/api/audits/${audit.publicId}/pdf`}
              className="inline-flex rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              Download PDF
            </a>
            <Link
              href={`/dashboard/audits/${audit.publicId}/compare`}
              className="inline-flex rounded-md border border-[var(--border)] px-4 py-2 text-sm"
            >
              Compare with previous
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Status</p>
          <p className="mt-1 font-medium">{audit.status.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">SEO score</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {audit.overallScore != null ? `${audit.overallScore}` : "—"}
            {audit.overallScore != null && (
              <span className="text-sm font-normal text-[var(--muted-foreground)]">/100</span>
            )}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Pages crawled</p>
          <p className="mt-1 font-medium">{audit.pagesCrawled}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Issues</p>
          <p className="mt-1 font-medium">
            {audit.issuesCount}
            {audit.criticalCount > 0 && (
              <span className="text-[var(--muted-foreground)]"> · {audit.criticalCount} critical</span>
            )}
          </p>
        </div>
      </div>

      {audit.status === "PENDING_PAYMENT" && (
        <div className="rounded-lg border border-[var(--border)] p-6">
          <h2 className="font-medium">Payment required</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Crawling starts only after KES 500 is confirmed by the payment provider webhook.
          </p>
          <p className="mt-4 text-sm">Configuration: {audit.crawlLimit} pages · depth {audit.crawlDepth}</p>
          <PaymentForm auditPublicId={audit.publicId} />
        </div>
      )}

      {["QUEUED", "CRAWLING", "ANALYZING", "SCORING", "GENERATING_REPORT"].includes(audit.status) && (
        <div className="rounded-lg border border-[var(--border)] p-6">
          <h2 className="font-medium">Audit in progress</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {audit.progress}% — {audit.progressMessage || "Working..."}
          </p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Refresh this page for updates. Run `npm run worker` to process the queue.
          </p>
        </div>
      )}

      {audit.status === "FAILED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {audit.errorMessage || "Audit failed."}
        </div>
      )}

      {audit.status === "COMPLETED" && (
        <>
          <section>
            <h2 className="text-lg font-medium mb-4">Category scores</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Technical", audit.technicalScore],
                ["On-page", audit.onPageScore],
                ["Content", audit.contentScore],
                ["Links", audit.linksScore],
                ["Images", audit.imagesScore],
                ["Performance", audit.performanceScore],
                ["Structured data", audit.structuredDataScore],
                ["Mobile", audit.mobileScore],
                ["Local", audit.localSeoScore],
                ["GEO / AI signals", audit.geoScore],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-lg border border-[var(--border)] px-4 py-3">
                  <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
                  <p className="mt-1 font-medium">{score ?? "—"}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">Scoring version {audit.scoringVersion}</p>
          </section>

          <section>
            <h2 className="text-lg font-medium mb-4">Issues</h2>
            {sortedIssues.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No issues recorded for this audit.</p>
            ) : (
              <div className="space-y-3">
                {sortedIssues.map((issue) => (
                  <div key={issue.id} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{issue.severity}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{issue.category}</span>
                    </div>
                    <h3 className="mt-1 font-medium">{issue.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{issue.description}</p>
                    {issue.evidence && <p className="mt-2 text-xs text-[var(--muted-foreground)]">Evidence: {issue.evidence}</p>}
                    {issue.affectedUrl && <p className="mt-1 text-xs break-all text-[var(--muted-foreground)]">{issue.affectedUrl}</p>}
                    <p className="mt-2 text-sm"><span className="font-medium">How to fix: </span>{issue.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium mb-4">Pages</h2>
            {audit.pages.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No pages stored.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">URL</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.pages.map((page) => (
                      <tr key={page.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3 max-w-xs truncate">{page.url}</td>
                        <td className="px-4 py-3">{page.statusCode ?? "—"}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{page.title || "—"}</td>
                        <td className="px-4 py-3">{page.pageScore ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
