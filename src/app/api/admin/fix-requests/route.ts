import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdmin } from "@/lib/auth/session";
import { z } from "zod";
import { FixRequestStatus } from "@prisma/client";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(FixRequestStatus).optional(),
  quotedAmount: z.number().int().min(0).optional().nullable(),
  agreedAmount: z.number().int().min(0).optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
  contactStatus: z.string().max(200).optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.fixRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true, phone: true } },
      audit: {
        select: {
          publicId: true,
          domain: true,
          overallScore: true,
          criticalCount: true,
          highCount: true,
        },
      },
    },
  });

  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.fixRequest.findUnique({
    where: { id: parsed.data.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    if (parsed.data.status === "COMPLETED" || parsed.data.status === "CLOSED") {
      data.completedAt = new Date();
    }
  }
  if (parsed.data.quotedAmount !== undefined) data.quotedAmount = parsed.data.quotedAmount;
  if (parsed.data.agreedAmount !== undefined) data.agreedAmount = parsed.data.agreedAmount;
  if (parsed.data.internalNotes !== undefined) data.internalNotes = parsed.data.internalNotes;
  if (parsed.data.contactStatus !== undefined) data.contactStatus = parsed.data.contactStatus;

  const updated = await prisma.fixRequest.update({
    where: { id: parsed.data.id },
    data,
  });

  if (parsed.data.status && parsed.data.status !== existing.status) {
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        title: "Fix request updated",
        body: `Your SEO fix request is now: ${parsed.data.status.replace(/_/g, " ").toLowerCase()}.`,
        link: "/dashboard/fix-requests",
      },
    });
  }

  return NextResponse.json({ ok: true, item: updated });
}
