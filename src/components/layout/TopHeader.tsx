"use client";

import { useSession } from "next-auth/react";
import { Bell, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SiteLogo from "@/components/ui/SiteLogo";

export default function TopHeader({
  unreadCount = 0,
  messageCount = 0,
  logoUrl,
}: {
  unreadCount?: number;
  messageCount?: number;
  logoUrl?: string | null;
}) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-card-border">
      <div className="flex items-center justify-between px-4 h-12">
        <Link href="/home" className="flex items-center gap-2">
          <SiteLogo url={logoUrl} size={28} className="rounded-full" />
          <span className="font-bold text-sm gradient-primary-text">Love e Birds</span>
        </Link>

        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <Globe size={18} className="text-muted-foreground" />
          </button>
<Link
            href="/messages"
            className="p-1.5 rounded-full hover:bg-muted transition-colors relative"
            aria-label="Messages"
          >
            <MessageCircle size={18} className="text-muted-foreground" />
            {messageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {messageCount > 9 ? "9+" : messageCount}
              </span>
            )}
          </Link>
          <Link
            href="/notifications"
            className="p-1.5 rounded-full hover:bg-muted transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          {user?.avatar ? (
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-card-border">
              <Image
                src={user.avatar}
                alt=""
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}