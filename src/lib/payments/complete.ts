import { prisma } from "@/lib/db";
import { PaymentStatus } from "@prisma/client";

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

  return { payment: updated, alreadyCompleted: false };
}
