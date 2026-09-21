import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PaymentForm } from "@/components/dashboard/payment-form";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { publicId } = await params;
  const audit = await prisma.audit.findFirst({
    where: { publicId, userId: session.user.id },
  });

  if (!audit) notFound();

  return (
    <div>
      <p className="text-sm text-[var(--muted-foreground)] mb-2">
        <Link href="/dashboard/audits" className="hover:underline">Audits</Link> / {audit.domain}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{audit.domain}</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)] break-all">{audit.url}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Status</p>
          <p className="mt-1 font-medium">{audit.status.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">SEO score</p>
          <p className="mt-1 font-medium">{audit.overallScore != null ? `${audit.overallScore}/100` : "Not scored yet"}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted-foreground)]">Pages crawled</p>
          <p className="mt-1 font-medium">{audit.pagesCrawled}</p>
        </div>
      </div>

      {audit.status === "PENDING_PAYMENT" && (
        <div className="mt-8 rounded-lg border border-[var(--border)] p-6">
          <h2 className="font-medium">Payment required</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            This audit will not start until KES 500 is confirmed by the payment provider webhook. Approving on the client is not enough.
          </p>
          <p className="mt-4 text-sm">Configuration: {audit.crawlLimit} pages · depth {audit.crawlDepth}</p>
          <PaymentForm auditPublicId={audit.publicId} />
        </div>
      )}

      {audit.status === "FAILED" && audit.errorMessage && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">{audit.errorMessage}</div>
      )}

      {audit.progressMessage && audit.status !== "PENDING_PAYMENT" && (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">{audit.progress}% — {audit.progressMessage}</p>
      )}
    </div>
  );
}
