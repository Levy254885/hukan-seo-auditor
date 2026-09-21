import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminPaymentsPage() {
  const session = await getSession();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      audit: { select: { domain: true, publicId: true, status: true } },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          All payment attempts. Only webhook-confirmed rows should be COMPLETED.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-medium">{p.status}</td>
                <td className="px-4 py-3">{p.user.email}</td>
                <td className="px-4 py-3">{p.audit?.domain ?? "—"}</td>
                <td className="px-4 py-3">{p.provider}</td>
                <td className="px-4 py-3">{p.currency} {p.amount}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {p.createdAt.toLocaleString("en-KE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
