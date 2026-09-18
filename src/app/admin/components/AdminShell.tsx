"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Gift,
  LogOut,
  Menu,
  X,
  CalendarDays,
  Package,
  TicketsPlane,
  Wallet,
  ChevronDown,
  Settings,
  Bell,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import SiteLogo from "@/components/ui/SiteLogo";

type NavItem = { href: string; label: string };
type NavGroup = {
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  { label: "Dashboard", icon: LayoutDashboard, items: [{ href: "/admin", label: "Dashboard" }] },
  {
    label: "Balance",
    icon: Wallet,
    items: [
      { href: "/admin/balances", label: "Balances" },
      { href: "/admin/recharges", label: "Recharges" },
      { href: "/admin/withdrawals", label: "Withdrawals" },
    ],
  },
  { label: "Users", icon: Users, items: [{ href: "/admin/users", label: "Users" }] },
  {
    label: "Verifications",
    icon: ShieldCheck,
    items: [
      { href: "/admin/verifications", label: "Verifications" },
      { href: "/admin/reports", label: "Reports" },
    ],
  },
  { label: "Activities", icon: CalendarDays, items: [{ href: "/admin/activities", label: "Activities" }] },
  { label: "Products", icon: Package, items: [{ href: "/admin/products", label: "Products" }] },
  { label: "Gifts", icon: Gift, items: [{ href: "/admin/gifts", label: "Gifts" }] },
  { label: "Participations", icon: TicketsPlane, items: [{ href: "/admin/activity-participations", label: "Participations" }] },
  { label: "Featured Users", icon: Sparkles, items: [{ href: "/admin/featured-users", label: "Featured Users" }] },
  { label: "Notifications", icon: Bell, items: [{ href: "/admin/notifications", label: "Send Notification" }] },
  {
    label: "Branding",
    icon: ImageIcon,
    items: [{ href: "/admin/branding", label: "App Logo" }],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/banners", label: "Banners" },
      { href: "/admin/referral-codes", label: "Referral Codes" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  admin,
  logoUrl,
  children,
}: {
  admin: { username: string; displayName: string; email: string };
  logoUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      initial[g.label] = g.items.some((i) => isActive(pathname, i.href));
    });
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-card border-r border-card-border flex flex-col transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-card-border">
          <SiteLogo url={logoUrl} size={32} className="rounded-full" />
          <span className="font-bold text-sm gradient-primary-text">Love e Birds Admin</span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="ml-auto p-1 rounded-lg hover:bg-muted lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navGroups.map((group) => {
            const Icon = group.icon;
            const active = group.items.some((i) => isActive(pathname, i.href));
            const hasSubmenu = group.items.length > 1;
            const expanded = openGroups[group.label] ?? active;

            return (
              <div key={group.label}>
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon size={18} />
                        {group.label}
                      </span>
                      <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded && (
                      <div className="pl-10 pr-1 mt-0.5 space-y-0.5">
                        {group.items.map((item) => {
                          const itemActive = isActive(pathname, item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                itemActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={group.items[0].href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={18} />
                    {group.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-card-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-muted-foreground">
                {admin.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{admin.displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">@{admin.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/home"
              className="flex-1 text-center py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              View app
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-card/80 backdrop-blur border-b border-card-border flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-1.5 rounded-lg hover:bg-muted lg:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-semibold text-muted-foreground lg:hidden">Admin</h1>
        </header>
        <main className="max-w-5xl mx-auto px-4 lg:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
