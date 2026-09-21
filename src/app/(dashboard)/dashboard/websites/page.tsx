import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function WebsitesPage() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { audits: true } } },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Websites</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Add a site, then run a KES 500 SEO audit.
          </p>
        </div>
        <Link
          href="/dashboard/websites/new"
          className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Add website
        </Link>
      </div>

      {websites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center">
          <h2 className="text-lg font-medium">No websites yet</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
            Add the website you want to audit. URLs are validated and private
            network targets are blocked.
          </p>
          <Link
            href="/dashboard/websites/new"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            Add your first website
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]/50 text-left text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3 font-medium">Website</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Latest score</th>
                <th className="px-4 py-3 font-medium">Audits</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((site) => (
                <tr key={site.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/websites/${site.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {site.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {site.domain}
                  </td>
                  <td className="px-4 py-3">
                    {site.latestScore != null ? `${site.latestScore}/100` : "—"}
                  </td>
                  <td className="px-4 py-3">{site._count.audits}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {site.createdAt.toLocaleDateString("en-KE")}
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
