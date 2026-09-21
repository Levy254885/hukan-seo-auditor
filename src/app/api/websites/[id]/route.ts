import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const patchSchema = z.object({
  name: z.string().min(1).max(120),
});

async function getOwnedWebsite(userId: string, id: string) {
  return prisma.website.findFirst({
    where: { id, userId },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const website = await prisma.website.findFirst({
    where: { id, userId: session.user.id },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          publicId: true,
          status: true,
          overallScore: true,
          createdAt: true,
          completedAt: true,
          pagesCrawled: true,
          issuesCount: true,
        },
      },
    },
  });

  if (!website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  return NextResponse.json({ website });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await getOwnedWebsite(session.user.id, id);
  if (!owned) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const website = await prisma.website.update({
    where: { id },
    data: { name: parsed.data.name.trim() },
  });

  return NextResponse.json({ website });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const owned = await getOwnedWebsite(session.user.id, id);
  if (!owned) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  await prisma.website.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
