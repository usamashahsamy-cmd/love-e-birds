"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, BellOff } from "lucide-react";
import { NotificationIcon } from "./NotificationIcon";
import { toast } from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { markNotificationRead, markAllNotificationsRead } from "@/actions/notifications";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationList({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleOpen(item: NotificationItem) {
    if (!item.read) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        router.refresh();
      });
    }
    if (item.link) router.push(item.link);
  }

  function handleMarkAll() {
    if (pending || unreadCount === 0) return;
    startTransition(async () => {
      await markAllNotificationsRead();
      toast("All notifications marked as read");
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="No notifications yet"
        description="You'll see likes, matches, gifts and updates here."
      />
    );
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="text-[11px] text-muted-foreground">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </span>
          <button
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        </div>
      )}

      <div className="px-4 pt-3 space-y-2 pb-2">
        {notifications.map((item) => {
          const content = (
            <div
              className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                item.read
                  ? "bg-card border-card-border"
                  : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center mt-0.5">
                <NotificationIcon type={item.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatTime(item.createdAt)}
                  </span>
                </div>
                {item.content && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.content}</p>
                )}
              </div>
              {!item.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
            </div>
          );

          return item.link && item.link.startsWith("/") ? (
            <Link key={item.id} href={item.link} onClick={() => handleOpen(item)}>
              {content}
            </Link>
          ) : (
            <button
              key={item.id}
              onClick={() => handleOpen(item)}
              className="w-full text-left"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}