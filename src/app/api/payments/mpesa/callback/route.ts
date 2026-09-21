import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { completePaidAudit } from "@/lib/payments/complete";

export async function POST(req: NextRequest) {
  let payload: {
    Body?: {
      stkCallback?: {
        MerchantRequestID?: string;
        CheckoutRequestID?: string;
        ResultCode?: number;
        ResultDesc?: string;
        CallbackMetadata?: {
          Item?: { Name: string; Value?: string | number }[];
        };
      };
    };
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid JSON" });
  }

  const callback = payload.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const payment = await prisma.payment.findFirst({
    where: { checkoutRequestId: callback.CheckoutRequestID },
  });

  if (!payment) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  if (callback.ResultCode !== 0) {
    if (payment.status !== "COMPLETED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: callback.ResultDesc || "Payment cancelled or failed",
        },
      });
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const items = callback.CallbackMetadata?.Item ?? [];
  const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;

  try {
    await completePaidAudit({
      paymentId: payment.id,
      providerReference: String(receipt || callback.CheckoutRequestID),
      metadata: { callback },
    });
  } catch (error) {
    console.error("[mpesa-callback]", error);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
