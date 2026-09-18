import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserCircle } from "lucide-react";
import EssentialInfoForm from "./components/EssentialInfoForm";

export const dynamic = "force-dynamic";

export default async function EssentialInformationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <UserCircle size={20} className="text-primary" /> Essential Information
      </h1>
      <EssentialInfoForm
        displayName={user.displayName}
        bio={user.profile?.bio ?? ""}
        location={user.profile?.location ?? ""}
        gender={user.profile?.gender ?? "OTHER"}
        dateOfBirth={user.profile?.dateOfBirth?.toISOString().slice(0, 10) ?? ""}
      />
    </div>
  );
}