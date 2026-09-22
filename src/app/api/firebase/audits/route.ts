import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase/auth";
import { createAudit, getAuditByPublicId } from "@/lib/firebase/repos";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/types/firestore";
import { checkRateLimit, RATE_LIMITS } from "@/lib/firebase/rate-limit";
import { z } from "zod";

const createSchema = z.object({
  websiteId: z.string().min(1),
  crawlLimit: z.number().int().min(1).max(100).default(25),
  crawlDepth: z.number().int().min(0).max(5).default(2),
  excludePaths: z.array(z.string()).max(50).optional(),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireFirebaseUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit({
    key: `auditCreate:${user.uid}`,
    ...RATE_LIMITS.auditCreate,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const siteSnap = await getAdminDb()
    .collection(COLLECTIONS.websites)
    .doc(parsed.data.websiteId)
    .get();
  if (!siteSnap.exists || siteSnap.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  const site = siteSnap.data()!;
  const audit = await createAudit({
    userId: user.uid,
    websiteId: parsed.data.websiteId,
    url: site.url,
    domain: site.domain,
    crawlLimit: parsed.data.crawlLimit,
    crawlDepth: parsed.data.crawlDepth,
    excludePaths: parsed.data.excludePaths,
  });

  return NextResponse.json(
    {
      audit: {
        id: audit.id,
        publicId: audit.publicId,
        status: audit.status,
        domain: audit.domain,
      },
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireFirebaseUser(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicId = req.nextUrl.searchParams.get("publicId");
  if (publicId) {
    const audit = await getAuditByPublicId(publicId, user.uid);
    if (!audit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ audit });
  }

  const snap = await getAdminDb()
    .collection(COLLECTIONS.audits)
    .where("userId", "==", user.uid)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}
