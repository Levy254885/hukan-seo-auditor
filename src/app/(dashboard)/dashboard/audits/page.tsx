import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AuditsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const audits = await prisma.audit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Audits</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Every audit is stored as a snapshot and is never overwritten.
        </p>
      </div>

      {audits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No audits yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Add a website and run your first KES 500 audit.</p>
          <Link href="/dashboard/websites/new" className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">Add website</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/audits/${audit.publicId}`} className="font-medium underline-offset-4 hover:underline">{audit.domain}</Link>
                  </td>
                  <td className="px-4 py-3">{audit.status.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="px-4 py-3">{audit.overallScore != null ? `${audit.overallScore}/100` : "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{audit.createdAt.toLocaleString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
