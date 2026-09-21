import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paymentId = req.nextUrl.searchParams.get("paymentId");
  const auditPublicId = req.nextUrl.searchParams.get("auditPublicId");

  if (paymentId) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session.user.id },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        provider: true,
        failureReason: true,
        completedAt: true,
      },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ payment });
  }

  if (auditPublicId) {
    const audit = await prisma.audit.findFirst({
      where: { publicId: auditPublicId, userId: session.user.id },
      select: { id: true, status: true },
    });
    if (!audit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const payment = await prisma.payment.findFirst({
      where: { auditId: audit.id, userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        provider: true,
        failureReason: true,
      },
    });
    return NextResponse.json({ auditStatus: audit.status, payment });
  }

  return NextResponse.json({ error: "Missing query" }, { status: 400 });
}
