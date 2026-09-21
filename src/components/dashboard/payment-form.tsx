"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentForm({ auditPublicId }: { auditPublicId: string }) {
  const router = useRouter();
  const [provider, setProvider] = useState<"mpesa" | "paystack">("mpesa");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/payments/status?paymentId=${paymentId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.payment?.status === "COMPLETED") {
        router.refresh();
      }
      if (data.payment?.status === "FAILED") {
        setError(data.payment.failureReason || "Payment failed.");
        setLoading(false);
        setPaymentId(null);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [paymentId, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditPublicId,
          provider,
          phone: provider === "mpesa" ? phone : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment.");
        setLoading(false);
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setPaymentId(data.paymentId);
      setMessage(data.message || "Approve the payment on your phone.");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5 max-w-md">
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3 text-sm">{message}</div>}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium mb-1">Pay KES 500 with</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="provider" checked={provider === "mpesa"} onChange={() => setProvider("mpesa")} />
          M-Pesa (STK push)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="provider" checked={provider === "paystack"} onChange={() => setProvider("paystack")} />
          Paystack
        </label>
      </fieldset>
      {provider === "mpesa" && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">M-Pesa phone number</label>
          <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />
        </div>
      )}
      <button type="submit" disabled={loading} className="rounded-md bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
        {loading ? "Starting payment…" : "Pay KES 500"}
      </button>
    </form>
  );
}
