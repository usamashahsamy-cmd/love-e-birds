import { prisma } from "@/lib/prisma";

const DEFAULT_CODE = "LOVEBIRDS";

export async function ensureDefaultReferralCode() {
  const existing = await prisma.referralCode.findUnique({
    where: { code: DEFAULT_CODE },
  });

  if (existing) return existing;

  // Find any admin to attribute the code to
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return prisma.referralCode.create({
    data: {
      code: DEFAULT_CODE,
      maxUses: 999999,
      active: true,
      createdById: admin?.id ?? "system",
    },
  });
}
