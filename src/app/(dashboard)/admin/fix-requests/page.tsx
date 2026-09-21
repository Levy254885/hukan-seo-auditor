import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminFixStatusForm } from "@/components/dashboard/admin-fix-status";

export default async function AdminFixRequestsPage() {
  const session = await getSession();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const items = await prisma.fixRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      audit: {
        select: {
          publicId: true,
          domain: true,
          overallScore: true,
          criticalCount: true,
          highCount: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Fix requests</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          CRM pipeline for paid audit customers requesting implementation help.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">No fix requests yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-[var(--border)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span className="font-medium uppercase tracking-wide text-[var(--foreground)]">
                      {item.status}
                    </span>
                    <span>·</span>
                    <span>{item.createdAt.toLocaleString("en-KE")}</span>
                  </div>
                  <h2 className="mt-1 font-medium">{item.audit.domain}</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {item.name} · {item.email}
                    {item.phone ? ` · ${item.phone}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Prefer: {item.preferredContact || "—"} · Score:{" "}
                    {item.audit.overallScore ?? "—"} · Critical:{" "}
                    {item.audit.criticalCount} · High: {item.audit.highCount}
                  </p>
                  <Link
                    href={`/dashboard/audits/${item.audit.publicId}`}
                    className="text-sm underline-offset-4 hover:underline mt-1 inline-block"
                  >
                    Open audit
                  </Link>
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {item.quotedAmount != null && <p>Quoted: KES {item.quotedAmount}</p>}
                  {item.agreedAmount != null && <p>Agreed: KES {item.agreedAmount}</p>}
                </div>
              </div>
              {item.message && (
                <p className="mt-3 text-sm border-l-2 border-[var(--border)] pl-3">{item.message}</p>
              )}
              <AdminFixStatusForm
                id={item.id}
                status={item.status}
                quotedAmount={item.quotedAmount}
                agreedAmount={item.agreedAmount}
                internalNotes={item.internalNotes}
                contactStatus={item.contactStatus}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
