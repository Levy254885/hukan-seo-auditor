import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const session = await getSession();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          websites: true,
          audits: true,
          payments: true,
          fixRequests: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Registered accounts and activity counts.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Sites</th>
              <th className="px-4 py-3 font-medium">Audits</th>
              <th className="px-4 py-3 font-medium">Payments</th>
              <th className="px-4 py-3 font-medium">Fixes</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.name || "—"}</td>
                <td className="px-4 py-3">{c.role}</td>
                <td className="px-4 py-3">{c._count.websites}</td>
                <td className="px-4 py-3">{c._count.audits}</td>
                <td className="px-4 py-3">{c._count.payments}</td>
                <td className="px-4 py-3">{c._count.fixRequests}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {c.createdAt.toLocaleDateString("en-KE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
