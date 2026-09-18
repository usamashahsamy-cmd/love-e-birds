"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { createAnnouncement } from "@/actions/admin";

const TARGETS = ["ALL", "USER", "ADMIN"] as const;

export default function CreateAnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<(typeof TARGETS)[number]>("ALL");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!title.trim() || !content.trim()) {
      toast("Title and content are required", "error");
      return;
    }
    startTransition(async () => {
      const res = await createAnnouncement({ title: title.trim(), content: content.trim(), target });
      if (res.success) {
        toast("Announcement published", "success");
        setTitle("");
        setContent("");
        setTarget("ALL");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to create announcement", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-2.5">
      <p className="text-sm font-semibold">New announcement</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Content"
        className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as (typeof TARGETS)[number])}
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        >
          {TARGETS.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "Everyone" : t === "USER" ? "Users only" : "Admins only"}
            </option>
          ))}
        </select>
        <button
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          <Plus size={13} /> {pending ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}