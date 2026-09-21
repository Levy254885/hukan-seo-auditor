import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type UserRole } from "@/types/firestore";
import { FieldValue } from "firebase-admin/firestore";

export type FirebaseSessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole;
};

export async function verifyIdToken(
  token: string | null | undefined
): Promise<FirebaseSessionUser | null> {
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const snap = await db.collection(COLLECTIONS.users).doc(decoded.uid).get();
    const data = snap.data();
    const role: UserRole = data?.role === "ADMIN" ? "ADMIN" : "USER";

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const email = (decoded.email || data?.email || "").toLowerCase();
    const effectiveRole: UserRole =
      adminEmail && email === adminEmail ? "ADMIN" : role;

    if (!snap.exists) {
      await db.collection(COLLECTIONS.users).doc(decoded.uid).set(
        {
          email: decoded.email || null,
          name: decoded.name || null,
          phone: null,
          role: effectiveRole,
          image: decoded.picture || null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else if (effectiveRole === "ADMIN" && data?.role !== "ADMIN") {
      await db.collection(COLLECTIONS.users).doc(decoded.uid).update({
        role: "ADMIN",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      uid: decoded.uid,
      email: decoded.email || data?.email || null,
      name: (decoded.name as string) || data?.name || null,
      role: effectiveRole,
    };
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export async function requireFirebaseUser(req: Request): Promise<FirebaseSessionUser> {
  const token = getBearerToken(req);
  const user = await verifyIdToken(token);
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireFirebaseAdmin(req: Request): Promise<FirebaseSessionUser> {
  const user = await requireFirebaseUser(req);
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
