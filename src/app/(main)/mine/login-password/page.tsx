import { Lock, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ChangePasswordForm from "./components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function LoginPasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Lock size={20} className="text-primary" /> Login Password
      </h1>
      <div className="bg-card border border-card-border rounded-2xl p-5 mb-5 flex items-center gap-3">
        <ShieldCheck size={28} className="text-success" />
        <div>
          <p className="font-semibold text-sm">Password protection enabled</p>
          <p className="text-xs text-muted-foreground">
            Your account is protected by a password
          </p>
        </div>
      </div>
      <ChangePasswordForm />
    </div>
  );
}