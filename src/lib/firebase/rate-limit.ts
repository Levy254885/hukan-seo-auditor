import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/types/firestore";
import { FieldValue } from "firebase-admin/firestore";

export async function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.rateLimits).doc(opts.key);
  const now = Date.now();

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { count?: number; windowStart?: number } | undefined;

    let count = data?.count ?? 0;
    let windowStart = data?.windowStart ?? now;

    if (now - windowStart >= opts.windowMs) {
      count = 0;
      windowStart = now;
    }

    if (count >= opts.limit) {
      const retryAfterMs = opts.windowMs - (now - windowStart);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, retryAfterMs),
      };
    }

    count += 1;
    tx.set(
      ref,
      {
        count,
        windowStart,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      allowed: true,
      remaining: Math.max(0, opts.limit - count),
    };
  });

  return result;
}

export const RATE_LIMITS = {
  paymentCreate: { limit: 10, windowMs: 60 * 60 * 1000 },
  auditCreate: { limit: 20, windowMs: 60 * 60 * 1000 },
  authIp: { limit: 30, windowMs: 15 * 60 * 1000 },
  fixRequest: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;
