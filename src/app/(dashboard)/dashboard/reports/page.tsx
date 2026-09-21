import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const reports = await prisma.report.findMany({
    where: { audit: { userId: session.user.id } },
    orderBy: { generatedAt: "desc" },
    take: 50,
    include: {
      audit: {
        select: {
          publicId: true,
          domain: true,
          overallScore: true,
          pagesCrawled: true,
          issuesCount: true,
          completedAt: true,
          status: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Snapshot reports for completed audits. Each audit keeps its own score and issue list forever.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No reports yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">A report is created automatically when an audit finishes.</p>
          <Link href="/dashboard/websites/new" className="mt-6 inline-flex rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)]">
            Start an audit
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Pages</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">Generated</th>
                <th className="px-4 py-3 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/audits/${report.audit.publicId}`} className="font-medium underline-offset-4 hover:underline">
                      {report.audit.domain}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{report.audit.overallScore != null ? `${report.audit.overallScore}/100` : "—"}</td>
                  <td className="px-4 py-3">{report.audit.pagesCrawled}</td>
                  <td className="px-4 py-3">{report.audit.issuesCount}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{report.generatedAt.toLocaleString("en-KE")}</td>
                  <td className="px-4 py-3">
                    <a href={`/api/audits/${report.audit.publicId}/pdf`} className="underline-offset-4 hover:underline">Download</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
