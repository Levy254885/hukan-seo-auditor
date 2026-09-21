import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function UserFixRequestsPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const items = await prisma.fixRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      audit: {
        select: {
          publicId: true,
          domain: true,
          overallScore: true,
        },
      },
    },
  });

  const completedAudits = await prisma.audit.findMany({
    where: { userId: session.user.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: { publicId: true, domain: true, overallScore: true },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Fix requests</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Ask Hukan to implement the fixes from a completed audit. Pricing is quoted per site after review.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No fix requests yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Open a completed audit and use &quot;Request SEO fixes&quot;.
          </p>
          {completedAudits.length > 0 && (
            <ul className="mt-6 space-y-2 text-sm">
              {completedAudits.map((a) => (
                <li key={a.publicId}>
                  <Link
                    href={`/dashboard/audits/${a.publicId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {a.domain}
                    {a.overallScore != null ? ` · score ${a.overallScore}` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
                <span className="font-medium uppercase tracking-wide text-[var(--foreground)]">
                  {item.status.replace(/_/g, " ")}
                </span>
                <span>·</span>
                <span>{item.createdAt.toLocaleString("en-KE")}</span>
              </div>
              <h3 className="mt-1 font-medium">
                <Link
                  href={`/dashboard/audits/${item.audit.publicId}`}
                  className="underline-offset-4 hover:underline"
                >
                  {item.audit.domain}
                </Link>
              </h3>
              {item.message && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.message}</p>
              )}
              {(item.quotedAmount != null || item.agreedAmount != null) && (
                <p className="mt-2 text-sm">
                  {item.quotedAmount != null && <span>Quoted: KES {item.quotedAmount} </span>}
                  {item.agreedAmount != null && <span>· Agreed: KES {item.agreedAmount}</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
