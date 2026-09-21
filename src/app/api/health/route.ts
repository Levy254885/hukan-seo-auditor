import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : "db error";
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    service: "hukan-seo-auditor",
    time: new Date().toISOString(),
    latencyMs: Date.now() - started,
    checks: {
      database: dbOk ? "up" : "down",
    },
    ...(dbError && process.env.NODE_ENV !== "production" ? { dbError } : {}),
  };

  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
