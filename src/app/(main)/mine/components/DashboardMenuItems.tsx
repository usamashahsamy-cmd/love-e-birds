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
  LogOut,
} from "lucide-react";
import DashboardMenuItem from "@/components/ui/DashboardMenuItem";
import GradientButton from "@/components/ui/GradientButton";
import { signOut } from "next-auth/react";

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
  return (
    <div className="px-5 mt-6">
      <div className="grid grid-cols-4 gap-2.5">
        {menuItems.map((item) => (
          <DashboardMenuItem key={item.id} {...item} />
        ))}
      </div>

      <div className="mt-5">
        <GradientButton
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-none from-grape to-berry bg-gradient-to-r"
        >
          <span className="flex items-center justify-center gap-2">
            <LogOut size={18} />
            Logout
          </span>
        </GradientButton>
      </div>
    </div>
  );
}