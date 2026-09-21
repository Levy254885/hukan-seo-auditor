import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/firebase/auth";
import { createWebsite, listWebsitesForUser } from "@/lib/firebase/repos";
import { checkRateLimit, RATE_LIMITS } from "@/lib/firebase/rate-limit";
import { parsePublicHttpUrl, getDomainFromUrl } from "@/lib/seo/url";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const user = await requireFirebaseUser(req);
    const items = await listWebsitesForUser(user.uid);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const createSchema = z.object({
  url: z.string().min(3).max(2048),
  label: z.string().max(120).optional().nullable(),
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

  const url = parsePublicHttpUrl(parsed.data.url);
  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const domain = getDomainFromUrl(url);
  const site = await createWebsite({
    userId: user.uid,
    url: url.toString(),
    domain,
    label: parsed.data.label,
  });

  return NextResponse.json(
    { website: { id: site.id, domain, url: url.toString() } },
    { status: 201 }
  );
}
