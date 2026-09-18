import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MineHeader from "./components/MineHeader";
import BalanceCard from "./components/BalanceCard";
import DashboardMenuItems from "./components/DashboardMenuItems";

export default async function MinePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      wallet: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="pb-6">
      <MineHeader
        username={user.username}
        displayName={user.displayName}
        avatar={user.avatar}
        creditScore={user.creditScore}
        profile={user.profile}
      />
      <BalanceCard wallet={user.wallet} />
      <DashboardMenuItems />
    </div>
  );
}