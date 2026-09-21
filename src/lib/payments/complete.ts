import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email/send";
import { paymentConfirmedEmail } from "@/lib/email/templates";

/**
 * Mark payment completed and queue the audit.
 * Idempotent: duplicate webhooks will not re-queue or double-complete.
 */
export async function completePaidAudit(params: {
  paymentId: string;
  providerReference: string;
  metadata?: Record<string, unknown>;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return { payment, alreadyCompleted: true };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        providerReference: params.providerReference,
        completedAt: new Date(),
        metadata: params.metadata as object | undefined,
      },
    });

    if (payment.auditId) {
      await tx.audit.update({
        where: { id: payment.auditId },
        data: {
          status: "QUEUED",
          progress: 5,
          progressMessage: "Payment confirmed. Audit queued.",
        },
      });

      await tx.auditJob.create({
        data: {
          auditId: payment.auditId,
          stage: "crawl",
          status: "pending",
        },
      });
    }

    return paid;
  });

  if (payment.auditId) {
    try {
      const [user, audit] = await Promise.all([
        prisma.user.findUnique({
          where: { id: payment.userId },
          select: { email: true, name: true },
        }),
        prisma.audit.findUnique({
          where: { id: payment.auditId },
          select: { domain: true, publicId: true },
        }),
      ]);
      if (user?.email && audit) {
        const tpl = paymentConfirmedEmail({
          name: user.name,
          domain: audit.domain,
          amount: payment.amount,
          currency: payment.currency,
          auditPublicId: audit.publicId,
        });
        await sendEmail({ to: user.email, subject: tpl.subject, text: tpl.text });
      }
    } catch (e) {
      console.error("[email] payment confirmed failed", e);
    }
  }

  return { payment: updated, alreadyCompleted: false };
}
