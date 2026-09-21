import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

const bodySchema = z.object({
  auditPublicId: z.string().min(8),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().nullable(),
  preferredContact: z.enum(["email", "whatsapp", "phone"]).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const audit = await prisma.audit.findFirst({
    where: {
      publicId: parsed.data.auditPublicId,
      userId: session.user.id,
      status: "COMPLETED",
    },
  });

  if (!audit) {
    return NextResponse.json(
      { error: "Completed audit not found" },
      { status: 404 }
    );
  }

  const existing = await prisma.fixRequest.findFirst({
    where: {
      auditId: audit.id,
      userId: session.user.id,
      status: {
        in: ["NEW", "CONTACTED", "QUOTED", "APPROVED", "IN_PROGRESS"],
      },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have an open fix request for this audit." },
      { status: 409 }
    );
  }

  const fix = await prisma.fixRequest.create({
    data: {
      userId: session.user.id,
      auditId: audit.id,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone || null,
      preferredContact: parsed.data.preferredContact || null,
      message: parsed.data.message || null,
      status: "NEW",
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Fix request received",
      body: `We received your request for ${audit.domain}. Our team will contact you.`,
      link: "/dashboard/fix-requests",
    },
  });

  return NextResponse.json({ ok: true, id: fix.id }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.fixRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      audit: {
        select: {
          publicId: true,
          domain: true,
          overallScore: true,
        },
      },
    },
  });

  return NextResponse.json({ items });
}
