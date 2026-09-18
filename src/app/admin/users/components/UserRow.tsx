"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldBan, ShieldCheck, BadgeCheck, UserX, UploadCloud, Loader2, Pencil } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { setUserStatus, setUserCreditScore, updateUserAvatar } from "@/actions/admin";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  SUSPENDED: "bg-warning/10 text-warning",
  DEACTIVATED: "bg-muted text-muted-foreground",
  BANNED: "bg-destructive/10 text-destructive",
};

const BUTTONS: { status: "ACTIVE" | "SUSPENDED" | "BANNED"; label: string; cls: string }[] = [
  { status: "ACTIVE", label: "Activate", cls: "bg-success/10 text-success hover:bg-success/20" },
  { status: "SUSPENDED", label: "Suspend", cls: "bg-warning/10 text-warning hover:bg-warning/20" },
  { status: "BANNED", label: "Ban", cls: "bg-destructive/10 text-destructive hover:bg-destructive/20" },
];

export default function UserRow({
  user,
  isSelf,
}: {
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatar: string | null;
    role: string;
    status: string;
    creditScore: number;
    isVerified: boolean;
    balance: number;
    frozenBalance: number;
    matches: number;
    reports: number;
    createdAt: string;
  };
  isSelf: boolean;
}) {
  const router = useRouter();
  const [score, setScore] = useState(user.creditScore.toString());
  const [avatarUrl, setAvatarUrl] = useState(user.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleAvatarUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      const saveRes = await updateUserAvatar(user.id, json.url);
      if (saveRes.success) {
        setAvatarUrl(json.url);
        toast("Avatar updated", "success");
        router.refresh();
      } else {
        toast(saveRes.error ?? "Failed to save avatar", "error");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function changeStatus(status: "ACTIVE" | "SUSPENDED" | "BANNED") {
    if (isSelf) return;
    startTransition(async () => {
      const res = await setUserStatus(user.id, status);
      if (res.success) {
        toast(`${user.displayName} → ${status.toLowerCase()}`, "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  function saveScore() {
    startTransition(async () => {
      const res = await setUserCreditScore(user.id, Number(score));
      if (res.success) {
        toast("Credit score updated", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0 group">
          <input
            type="file"
            accept="image/*"
            hidden
            id={`avatar-input-${user.id}`}
            onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
          />
          <label htmlFor={`avatar-input-${user.id}`} className="cursor-pointer">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user.displayName}
                width={42}
                height={42}
                className="w-[42px] h-[42px] rounded-full object-cover"
              />
            ) : (
              <div className="w-[42px] h-[42px] rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-bold text-muted-foreground">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 size={16} className="text-white animate-spin" />
              ) : (
                <UploadCloud size={16} className="text-white" />
              )}
            </div>
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate flex items-center gap-1">
            {user.displayName}
            {user.isVerified && <BadgeCheck size={14} className="text-accent flex-shrink-0" />}
            {user.role === "ADMIN" && (
              <span className="text-[9px] bg-primary/10 text-primary font-bold rounded-full px-1.5 py-0.5 ml-1">
                ADMIN
              </span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            @{user.username} · {user.email}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · Balance ₹{user.balance.toLocaleString("en-IN")}{user.frozenBalance > 0 ? ` · Frozen ₹${user.frozenBalance.toLocaleString("en-IN")}` : ""} · {user.matches} matches · {user.reports} reports
          </p>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 flex-shrink-0 ${STATUS_STYLE[user.status]}`}>
          {user.status}
        </span>
      </div>

      {!isSelf && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-card-border">
          {BUTTONS.map((b) => (
            <button
              key={b.status}
              onClick={() => changeStatus(b.status)}
              disabled={pending}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors ${b.cls}`}
            >
              {b.status === "SUSPENDED" ? <ShieldBan size={13} /> : b.status === "BANNED" ? <UserX size={13} /> : <ShieldCheck size={13} />}
              {b.label}
            </button>
          ))}
          <Link
            href={`/admin/users/${user.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Pencil size={13} /> Edit
          </Link>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-muted-foreground">Score:</span>
            <input
              value={score}
              onChange={(e) => setScore(e.target.value.replace(/\D/g, ""))}
              className="w-16 px-2 py-1 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
            />
            <button
              onClick={saveScore}
              disabled={pending}
              className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg px-2.5 py-1 disabled:opacity-50 transition-colors"
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}