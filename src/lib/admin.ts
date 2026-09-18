import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?error=admin_required");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") redirect("/login?error=admin_required");
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
  };
}