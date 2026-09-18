"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/Toast";
import { sendNotification } from "@/actions/notifications-admin";

export default function AdminNotificationsForm({ users }: { users: { id: string; displayName: string; username: string }[] }) {
  const [allUsers, setAllUsers] = useState(false);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await sendNotification({
        allUsers,
        userId: allUsers ? undefined : userId,
        title,
        content,
        link,
      });
      if (res.success) {
        toast(allUsers ? "Notification sent to all users" : "Notification sent", "success");
        setTitle("");
        setContent("");
        setLink("");
        setUserId("");
        setAllUsers(false);
      } else {
        toast(res.error ?? "Failed to send", "error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-5 space-y-4 max-w-2xl">
      <h3 className="text-sm font-bold">Send Notification</h3>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Recipient</label>
        <select
          value={allUsers ? "all" : userId}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "all") {
              setAllUsers(true);
              setUserId("");
            } else {
              setAllUsers(false);
              setUserId(value);
            }
          }}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        >
          <option value="">Select user</option>
          <option value="all">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName} (@{u.username})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Message</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Notification message"
          rows={4}
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Link (optional)</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="e.g. /home"
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !title.trim() || !content.trim() || (!allUsers && !userId)}
        className="w-full py-2.5 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send Notification"}
      </button>
    </form>
  );
}
