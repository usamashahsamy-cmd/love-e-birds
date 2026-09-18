"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface DashboardMenuItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  subtitle?: string;
  badge?: string | number;
}

export default function DashboardMenuItem({
  label,
  href,
  icon: Icon,
  subtitle,
  badge,
}: DashboardMenuItemProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 bg-card border border-card-border rounded-xl p-3.5 hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.97]"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-medium text-foreground leading-tight text-center">
          {label}
        </span>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground leading-tight">{subtitle}</span>
        )}
      </div>
      {badge !== undefined && (
        <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  );
}