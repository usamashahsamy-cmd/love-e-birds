"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShieldCheck, User } from "lucide-react";

const navItems = [
  { label: "Home", href: "/home", icon: Home, activeIcon: Home },
  { label: "Match", href: "/match", icon: Heart, activeIcon: Heart },
  { label: "Verification", href: "/mine/verification", icon: ShieldCheck, activeIcon: ShieldCheck },
  { label: "Mine", href: "/mine", icon: User, activeIcon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[565px] bg-card border-t border-card-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon
                size={22}
                className={isActive ? "fill-primary/10" : ""}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}