import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [websiteCount, auditCount, completedCount, latestAudit] =
    await Promise.all([
      prisma.website.count({ where: { userId } }),
      prisma.audit.count({ where: { userId } }),
      prisma.audit.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.audit.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          publicId: true,
          domain: true,
          status: true,
          overallScore: true,
          completedAt: true,
          createdAt: true,
        },
      }),
    ]);

  const pendingCount = auditCount - completedCount;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
          </p>
        </div>
        <Link
          href="/dashboard/websites/new"
          className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          New SEO audit — KES 500
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { label: "Websites", value: websiteCount },
          { label: "Total audits", value: auditCount },
          { label: "Completed", value: completedCount },
          { label: "Pending", value: pendingCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {websiteCount === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No websites yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
            Run your first KES 500 SEO audit to start measuring your website.
            You will get a detailed score, issues list, and a professional PDF
            report.
          </p>
          <Link
            href="/dashboard/websites/new"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Start first audit
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-medium">Latest audit</h2>
          </div>
          {latestAudit ? (
            <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium">{latestAudit.domain}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  Status: {latestAudit.status.replace(/_/g, " ").toLowerCase()}
                  {latestAudit.overallScore != null &&
                    ` · Score ${latestAudit.overallScore}/100`}
                </p>
              </div>
              <Link
                href={`/dashboard/audits/${latestAudit.publicId}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                View report
              </Link>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-[var(--muted-foreground)] text-center">
              No audits yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
