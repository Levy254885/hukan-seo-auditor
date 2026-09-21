import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { compareAudits } from "@/lib/seo/compare/compare";

export default async function CompareAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { publicId } = await params;
  const { with: withId } = await searchParams;

  const current = await prisma.audit.findFirst({
    where: { publicId, userId: session.user.id },
  });
  if (!current) notFound();

  const siblings = await prisma.audit.findMany({
    where: {
      userId: session.user.id,
      websiteId: current.websiteId,
      status: "COMPLETED",
      NOT: { id: current.id },
    },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  const previous =
    (withId ? siblings.find((s) => s.publicId === withId) : siblings[0]) || null;

  const comparison =
    previous && current.status === "COMPLETED"
      ? compareAudits(previous, current)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          <Link href={`/dashboard/audits/${current.publicId}`} className="hover:underline">
            Audit
          </Link>{" "}/ Compare
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Compare audits — {current.domain}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Each audit is a frozen snapshot. Comparison never overwrites either report.
        </p>
      </div>

      {siblings.length === 0 || current.status !== "COMPLETED" ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          You need at least two completed audits for this website to compare progress.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-[var(--muted-foreground)] self-center">Compare current with:</span>
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/audits/${current.publicId}/compare?with=${s.publicId}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  previous?.id === s.id
                    ? "border-[var(--foreground)] bg-[var(--muted)]"
                    : "border-[var(--border)]"
                }`}
              >
                {s.completedAt ? s.completedAt.toLocaleDateString("en-KE") : s.publicId.slice(0, 8)}
                {s.overallScore != null ? ` · ${s.overallScore}` : ""}
              </Link>
            ))}
          </div>

          {comparison && previous && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted-foreground)]">Overall delta</p>
                  <p className="mt-1 text-xl font-semibold">{formatDelta(comparison.scoreDeltas[0]?.delta)}</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted-foreground)]">Issues delta</p>
                  <p className="mt-1 text-xl font-semibold">{formatDelta(comparison.issuesDelta)}</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted-foreground)]">Categories improved</p>
                  <p className="mt-1 text-xl font-semibold">{comparison.improved}</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <p className="text-xs text-[var(--muted-foreground)]">Categories declined</p>
                  <p className="mt-1 text-xl font-semibold">{comparison.declined}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Previous</th>
                      <th className="px-4 py-3 font-medium">Current</th>
                      <th className="px-4 py-3 font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.scoreDeltas.map((row) => (
                      <tr key={row.key} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">{row.label}</td>
                        <td className="px-4 py-3">{row.before ?? "—"}</td>
                        <td className="px-4 py-3">{row.after ?? "—"}</td>
                        <td className="px-4 py-3">{formatDelta(row.delta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function formatDelta(n: number | null | undefined) {
  if (n == null) return "—";
  if (n === 0) return "0";
  return `${n > 0 ? "+" : ""}${n}`;
}
