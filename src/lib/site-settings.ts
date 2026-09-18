import { prisma } from "@/lib/prisma";

export type SiteLogo = { url: string | null; fallback: string };

export async function getSiteLogo(): Promise<SiteLogo> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "app_logo" },
    select: { value: true },
  });
  return { url: setting?.value ?? null, fallback: "LB" };
}

export async function getSiteSetting(key: string): Promise<string | null> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return setting?.value ?? null;
}
