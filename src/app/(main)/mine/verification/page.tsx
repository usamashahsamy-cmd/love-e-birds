import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteLogo } from "@/lib/site-settings";
import VerificationForm from "@/components/verification/VerificationForm";
import { ShieldCheck, ShieldX, ShieldAlert, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MineVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [verification, profile, vipBanner, logo] = await Promise.all([
    prisma.verification.findUnique({ where: { userId: session.user.id } }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.banner.findUnique({ where: { slug: "verification-vip" } }),
    getSiteLogo(),
  ]);

  return (
    <div className="px-4 pt-4 pb-8">
      <Link
        href="/activities/airborne-activities"
        className="block mb-5 rounded-2xl overflow-hidden relative aspect-[3/1] sm:aspect-[4/1] shadow-lg shadow-primary/20 active:scale-[0.99] transition-transform"
      >
        {vipBanner?.imageUrl ? (
          <Image
            src={vipBanner.imageUrl}
            alt={vipBanner.title}
            fill
            className="object-cover"
            sizes="(max-width: 565px) 100vw, 565px"
          />
        ) : (
          <div className="absolute inset-0 gradient-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative h-full flex items-center gap-3 px-5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0">
            {logo.url ? (
              <Image src={logo.url} alt="Love e Birds" width={40} height={40} className="object-contain p-1.5" />
            ) : (
              <span className="text-xl font-bold text-white">LB</span>
            )}
          </div>
          <div className="text-white">
            <p className="text-base font-bold">{vipBanner?.title ?? "Love E Birds"}</p>
            <p className="text-xs text-white/80">
              {vipBanner?.subtitle ?? "Unlock VIP benefits and exclusive rewards"}
            </p>
          </div>
          <span className="ml-auto text-xs font-semibold bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
            VIP Benefits
          </span>
        </div>
      </Link>

      <h1 className="text-lg font-bold mb-1 flex items-center gap-2">
        <ShieldCheck size={20} className="text-accent" /> Verification
      </h1>

      {verification?.status === "APPROVED" || profile?.isVerified ? (
        <div className="bg-card border border-success/30 rounded-2xl p-5 mt-4 flex items-start gap-3">
          <ShieldCheck size={28} className="text-success flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-success">You&apos;re verified!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your identity has been approved. The verified badge now shows on your profile.
            </p>
          </div>
        </div>
      ) : verification?.status === "PENDING" ? (
        <div className="bg-card border border-warning/30 rounded-2xl p-5 mt-4 flex items-start gap-3">
          <Clock size={28} className="text-warning flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-warning">Under review</p>
            <p className="text-xs text-muted-foreground mt-1">
              We&apos;re reviewing your documents. You&apos;ll be notified once it&apos;s done —
              usually within 24 hours.
            </p>
          </div>
        </div>
      ) : verification?.status === "REJECTED" ? (
        <div className="bg-card border border-destructive/30 rounded-2xl p-5 mt-4 flex items-start gap-3">
          <ShieldX size={28} className="text-destructive flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-destructive">Verification rejected</p>
            <p className="text-xs text-muted-foreground mt-1">
              {verification.notes
                ? `Reason: ${verification.notes}`
                : "Your documents could not be verified. Please resubmit with clear photos."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-2xl p-5 mt-4 flex items-start gap-3">
          <ShieldAlert size={28} className="text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Not verified yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verify your identity to unlock trust features and show the verified badge on your
              profile.
            </p>
          </div>
        </div>
      )}

      {(verification?.status === "REJECTED" || !verification) && (
        <div className="mt-5">
          <VerificationForm defaultFullName={verification?.fullName} />
        </div>
      )}
    </div>
  );
}
