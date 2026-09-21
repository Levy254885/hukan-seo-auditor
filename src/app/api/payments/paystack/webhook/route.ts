import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { completePaidAudit } from "@/lib/payments/complete";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };
  };

  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event !== "charge.success" || event.data?.status !== "success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;
  if (!reference) {
    return NextResponse.json({ received: true });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ id: reference }, { providerReference: reference }],
      provider: "paystack",
    },
  });

  if (!payment) {
    return NextResponse.json({ received: true });
  }

  try {
    await completePaidAudit({
      paymentId: payment.id,
      providerReference: reference,
      metadata: event.data as Record<string, unknown>,
    });
  } catch (error) {
    console.error("[paystack-webhook]", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
