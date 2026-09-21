import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AuditConfigForm } from "@/components/dashboard/audit-config-form";

export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const website = await prisma.website.findFirst({
    where: { id, userId: session.user.id },
    include: {
      audits: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!website) notFound();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-[var(--muted-foreground)] mb-2">
          <Link href="/dashboard/websites" className="hover:underline">My Websites</Link> / {website.domain}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{website.name}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)] break-all">{website.url}</p>
      </div>

      <section className="rounded-lg border border-[var(--border)] p-6">
        <h2 className="text-lg font-medium">Configure an audit</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Default KES 500 audit crawls up to 50 pages and 3 levels deep. The audit is created in a pending-payment state. Crawling starts only after payment is confirmed.
        </p>
        <AuditConfigForm websiteId={website.id} />
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Audit history</h2>
        {website.audits.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No audits yet for this website.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Pages</th>
                  <th className="px-4 py-3 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {website.audits.map((audit) => (
                  <tr key={audit.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/audits/${audit.publicId}`} className="underline-offset-4 hover:underline">
                        {audit.createdAt.toLocaleString("en-KE")}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{audit.status.replace(/_/g, " ").toLowerCase()}</td>
                    <td className="px-4 py-3">{audit.overallScore != null ? `${audit.overallScore}` : "—"}</td>
                    <td className="px-4 py-3">{audit.pagesCrawled}</td>
                    <td className="px-4 py-3">{audit.issuesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
