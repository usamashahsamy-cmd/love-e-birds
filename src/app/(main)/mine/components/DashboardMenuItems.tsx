"use client";

import {
  UserCircle,
  History,
  Banknote,
  Gift,
  ShoppingBag,
  Megaphone,
  Clock,
  Lock,
  Landmark,
  Gamepad2,
  ShieldCheck,
} from "lucide-react";
import DashboardMenuItem from "@/components/ui/DashboardMenuItem";
import { useState, useTransition } from "react";
import GradientButton from "@/components/ui/GradientButton";
import Modal from "@/components/ui/Modal";
import { signOut } from "next-auth/react";
import { toast } from "@/components/ui/Toast";
import { deactivateAccount } from "@/actions/settings";

const menuItems = [
  { id: "essential-information", label: "Essential Information", href: "/mine/essential-information", icon: UserCircle },
  { id: "verification", label: "Verification", href: "/mine/verification", icon: ShieldCheck },
  { id: "points-history", label: "Points History", href: "/mine/points-history", icon: History },
  { id: "withdraw-details", label: "Withdraw Details", href: "/mine/withdraw-details", icon: Banknote },
  { id: "gift-store", label: "Gift Store", href: "/gifts", icon: ShoppingBag },
  { id: "gift-record", label: "Gift Record", href: "/mine/gift-record", icon: Gift },
  { id: "announcements", label: "Announcement Matters", href: "/mine/announcements", icon: Megaphone },
  { id: "watch-history", label: "Watch History", href: "/mine/watch-history", icon: Clock },
  { id: "activities", label: "Activities", href: "/activities/airborne-activities", icon: Gamepad2 },
  { id: "login-password", label: "Login Password", href: "/mine/login-password", icon: Lock },
  { id: "my-bank", label: "My Bank", href: "/mine/my-bank", icon: Landmark },
];

export default function DashboardMenuItems() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDeactivate() {
    startTransition(async () => {
      const res = await deactivateAccount();
      if (res.success) {
        toast("Account deactivated", "success");
        await signOut({ callbackUrl: "/login" });
      } else {
        toast("Failed to deactivate account", "error");
      }
    });
  }

  return (
    <div className="px-5 mt-6">
      <div className="grid grid-cols-4 gap-2.5">
        {menuItems.map((item) => (
          <DashboardMenuItem key={item.id} {...item} />
        ))}
      </div>

      <div className="mt-5">
        <GradientButton onClick={() => setConfirmOpen(true)} className="bg-none from-grape to-berry bg-gradient-to-r">
          Cancellation
        </GradientButton>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Cancellation">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to deactivate your account? Your profile will be hidden and you
            won&apos;t be able to log in. This action can be reversed by contacting support.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-card-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Keep Account
            </button>
            <button
              onClick={handleDeactivate}
              disabled={pending}
              className="flex-1 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {pending ? "Deactivating..." : "Deactivate"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}