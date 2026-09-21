import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AUDIT_AMOUNT_KES, AUDIT_CURRENCY } from "@/lib/payments/constants";
import { initiateStkPush, isMpesaConfigured, normalizeMpesaPhone } from "@/lib/payments/mpesa";
import { initializePaystackTransaction, isPaystackConfigured } from "@/lib/payments/paystack";

const schema = z.object({
  auditPublicId: z.string().min(1),
  provider: z.enum(["mpesa", "paystack"]),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
  }

  const audit = await prisma.audit.findFirst({
    where: { publicId: parsed.data.auditPublicId, userId: session.user.id },
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  if (audit.status !== "PENDING_PAYMENT") {
    return NextResponse.json(
      { error: "This audit is not awaiting payment." },
      { status: 409 }
    );
  }

  const existingPaid = await prisma.payment.findFirst({
    where: { auditId: audit.id, status: "COMPLETED" },
  });
  if (existingPaid) {
    return NextResponse.json({ error: "This audit is already paid." }, { status: 409 });
  }

  if (parsed.data.provider === "mpesa") {
    if (!isMpesaConfigured()) {
      return NextResponse.json(
        { error: "M-Pesa is not configured on this server." },
        { status: 503 }
      );
    }
    const phone = normalizeMpesaPhone(parsed.data.phone || "");
    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan mobile number (e.g. 07XXXXXXXX)." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        auditId: audit.id,
        amount: AUDIT_AMOUNT_KES,
        currency: AUDIT_CURRENCY,
        provider: "mpesa",
        status: "PENDING",
        phone,
      },
    });

    try {
      const stk = await initiateStkPush({
        phone,
        amount: AUDIT_AMOUNT_KES,
        accountReference: `HUKAN${audit.publicId.slice(0, 6).toUpperCase()}`,
        description: "SEO audit",
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PROCESSING",
          checkoutRequestId: stk.CheckoutRequestID,
          merchantRequestID: stk.MerchantRequestID,
        },
      });

      return NextResponse.json({
        provider: "mpesa",
        paymentId: payment.id,
        message: "STK push sent. Approve the prompt on your phone.",
      });
    } catch (error) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: error instanceof Error ? error.message : "STK push failed",
        },
      });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "M-Pesa request failed." },
        { status: 502 }
      );
    }
  }

  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: "Paystack is not configured on this server." },
      { status: 503 }
    );
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.user.id,
      auditId: audit.id,
      amount: AUDIT_AMOUNT_KES,
      currency: AUDIT_CURRENCY,
      provider: "paystack",
      status: "PENDING",
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const init = await initializePaystackTransaction({
      email: session.user.email,
      amountKes: AUDIT_AMOUNT_KES,
      reference: payment.id,
      callbackUrl: `${appUrl}/dashboard/audits/${audit.publicId}`,
      metadata: {
        auditId: audit.id,
        userId: session.user.id,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PROCESSING",
        providerReference: init.reference,
      },
    });

    return NextResponse.json({
      provider: "paystack",
      paymentId: payment.id,
      authorizationUrl: init.authorization_url,
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Paystack init failed",
      },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Paystack request failed." },
      { status: 502 }
    );
  }
}
