import {
  Heart,
  Sparkles,
  MessageCircle,
  Gift,
  UserPlus,
  Info,
  BadgeCheck,
  CalendarHeart,
  Wallet,
  Megaphone,
} from "lucide-react";

export const NOTIFICATION_ICONS: Record<string, { icon: React.ComponentType<{ size?: number | string; className?: string }>; className: string }> = {
  LIKE: { icon: Heart, className: "text-accent" },
  MATCH: { icon: Sparkles, className: "text-accent-dark" },
  MESSAGE: { icon: MessageCircle, className: "text-primary" },
  GIFT: { icon: Gift, className: "text-accent" },
  FOLLOW: { icon: UserPlus, className: "text-primary" },
  SYSTEM: { icon: Info, className: "text-muted-foreground" },
  VERIFICATION: { icon: BadgeCheck, className: "text-primary" },
  DATE: { icon: CalendarHeart, className: "text-accent" },
  WALLET: { icon: Wallet, className: "text-primary" },
  ANNOUNCEMENT: { icon: Megaphone, className: "text-accent-dark" },
};

export function NotificationIcon({ type, size = 18 }: { type: string; size?: number }) {
  const item = NOTIFICATION_ICONS[type] ?? NOTIFICATION_ICONS.SYSTEM;
  const Icon = item.icon;
  return <Icon size={size} className={item.className} />;
}