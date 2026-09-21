import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function isAdmin(role?: Role | string) {
  return role === Role.ADMIN || role === "ADMIN";
}
