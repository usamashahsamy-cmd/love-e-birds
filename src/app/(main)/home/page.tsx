import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteLogo } from "@/lib/site-settings";
import HomeClient from "@/components/home/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [logo, notice] = await Promise.all([
    getSiteLogo(),
    prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, content: true },
    }),
  ]);

  return (
    <HomeClient
      logoUrl={logo.url}
      displayName={session.user.name ?? ""}
      initialStickyNote={notice}
    />
  );
}