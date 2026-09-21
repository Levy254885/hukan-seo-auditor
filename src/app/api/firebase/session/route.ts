import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getBearerToken } from "@/lib/firebase/auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/types/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { checkRateLimit, RATE_LIMITS } from "@/lib/firebase/rate-limit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await checkRateLimit({
    key: `authIp:${ip}`,
    ...RATE_LIMITS.authIp,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.retryAfterMs || 0) / 1000)),
        },
      }
    );
  }

  const token = getBearerToken(req);
  const session = await verifyIdToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.users).doc(session.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      email: session.email,
      name: body.name || session.name || null,
      phone: null,
      role: session.role,
      image: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else if (body.name) {
    await ref.update({
      name: body.name,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({
    user: {
      uid: session.uid,
      email: session.email,
      name: body.name || session.name,
      role: session.role,
    },
  });
}

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  const session = await verifyIdToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
