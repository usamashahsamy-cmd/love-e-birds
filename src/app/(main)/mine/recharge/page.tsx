import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ArrowDownToLine, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RechargePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <ArrowDownToLine size={20} className="text-primary" /> Recharge
      </h1>

      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Info size={20} className="text-warning" />
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            If you want offline charging, please consult customer service. The recharge amount
            of some settlement channels will be randomly recharged to one decimal place. Please
            be sure to confirm during settlement.
          </p>
        </div>
      </div>
    </div>
  );
}