import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function BillingPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { audit: { select: { domain: true, publicId: true } } },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          One-time payments of KES 500 per audit. Records cannot be edited by users.
        </p>
      </div>
      {payments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No payments yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Payments appear here after you start an audit checkout.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{p.createdAt.toLocaleString("en-KE")}</td>
                  <td className="px-4 py-3">{p.audit?.domain ?? "—"}</td>
                  <td className="px-4 py-3">{p.currency} {p.amount}</td>
                  <td className="px-4 py-3">{p.provider}</td>
                  <td className="px-4 py-3">{p.status.toLowerCase()}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] break-all">{p.providerReference ?? p.checkoutRequestId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
