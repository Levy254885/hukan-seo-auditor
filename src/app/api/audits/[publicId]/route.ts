import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publicId } = await params;
  const audit = await prisma.audit.findFirst({
    where: { publicId, userId: session.user.id },
    include: {
      pages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          url: true,
          statusCode: true,
          title: true,
          pageScore: true,
          wordCount: true,
          internalLinks: true,
          imagesMissingAlt: true,
        },
      },
      issues: {
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
        take: 200,
      },
    },
  });

  if (!audit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ audit });
}
