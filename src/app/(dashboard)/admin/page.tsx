import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminOverviewPage() {
  const session = await getSession();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const [
    usersCount,
    auditsCount,
    completedAudits,
    paymentsCompleted,
    revenue,
    fixNew,
    fixOpen,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.audit.count(),
    prisma.audit.count({ where: { status: "COMPLETED" } }),
    prisma.payment.count({ where: { status: "COMPLETED" } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.fixRequest.count({ where: { status: "NEW" } }),
    prisma.fixRequest.count({
      where: {
        status: {
          in: ["NEW", "CONTACTED", "QUOTED", "APPROVED", "IN_PROGRESS"],
        },
      },
    }),
  ]);

  const recentPayments = await prisma.payment.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 8,
    include: {
      user: { select: { email: true, name: true } },
      audit: { select: { domain: true, publicId: true } },
    },
  });

  const recentFixes = await prisma.fixRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      user: { select: { email: true } },
      audit: { select: { domain: true, publicId: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Operations CRM for Hukan SEO Auditor.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Customers", usersCount, "/admin/customers"],
          ["Completed audits", completedAudits, "/admin"],
          ["Paid payments", paymentsCompleted, "/admin/payments"],
          ["Revenue (KES)", revenue._sum.amount ?? 0, "/admin/payments"],
          ["New fix requests", fixNew, "/admin/fix-requests"],
          ["Open fix pipeline", fixOpen, "/admin/fix-requests"],
          ["All audits", auditsCount, "/admin"],
        ].map(([label, value, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="rounded-lg border border-[var(--border)] p-5 hover:bg-[var(--muted)]/40 transition-colors"
          >
            <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent payments</h2>
          <Link href="/admin/payments" className="text-sm text-[var(--muted-foreground)] hover:underline">
            View all
          </Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">{p.user.email}</td>
                    <td className="px-4 py-3">{p.audit?.domain ?? "—"}</td>
                    <td className="px-4 py-3">{p.currency} {p.amount}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {p.completedAt ? p.completedAt.toLocaleString("en-KE") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent fix requests</h2>
          <Link href="/admin/fix-requests" className="text-sm text-[var(--muted-foreground)] hover:underline">
            View all
          </Link>
        </div>
        {recentFixes.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No fix requests yet.</p>
        ) : (
          <div className="space-y-2">
            {recentFixes.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm flex flex-wrap gap-x-4 gap-y-1"
              >
                <span className="font-medium uppercase text-xs tracking-wide text-[var(--muted-foreground)]">
                  {f.status}
                </span>
                <span>{f.audit.domain}</span>
                <span className="text-[var(--muted-foreground)]">{f.email}</span>
                <span className="text-[var(--muted-foreground)]">
                  {f.createdAt.toLocaleDateString("en-KE")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
