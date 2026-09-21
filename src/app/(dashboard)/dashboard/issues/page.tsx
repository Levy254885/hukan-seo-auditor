import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ severity?: string; category?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const severity = params.severity?.toUpperCase();
  const category = params.category?.toLowerCase();

  const issues = await prisma.auditIssue.findMany({
    where: {
      audit: { userId: session.user.id },
      ...(severity
        ? { severity: severity as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" }
        : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: {
      audit: {
        select: { publicId: true, domain: true, completedAt: true },
      },
    },
  });

  const filters = [
    { label: "All", href: "/dashboard/issues" },
    { label: "Critical", href: "/dashboard/issues?severity=CRITICAL" },
    { label: "High", href: "/dashboard/issues?severity=HIGH" },
    { label: "Medium", href: "/dashboard/issues?severity=MEDIUM" },
    { label: "Technical", href: "/dashboard/issues?category=technical" },
    { label: "On-page", href: "/dashboard/issues?category=onpage" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Issues found across your completed audits. Filter by severity or category.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <Link key={f.href} href={f.href} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]">
            {f.label}
          </Link>
        ))}
      </div>

      {issues.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No issues yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Issues appear after an audit completes successfully.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span className="font-medium uppercase tracking-wide">{issue.severity}</span>
                <span>{issue.category}</span>
                <span>·</span>
                <Link href={`/dashboard/audits/${issue.audit.publicId}`} className="underline-offset-4 hover:underline">
                  {issue.audit.domain}
                </Link>
              </div>
              <h3 className="mt-1 font-medium">{issue.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{issue.description}</p>
              {issue.affectedUrl && (
                <p className="mt-1 text-xs break-all text-[var(--muted-foreground)]">{issue.affectedUrl}</p>
              )}
              <p className="mt-2 text-sm"><span className="font-medium">How to fix: </span>{issue.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
