"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  UserPlus,
  UserCheck,
  CalendarHeart,
  MessageCircle,
  Ban,
  Flag,
  Gift,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import {
  likeProfile,
  unlikeProfile,
  followProfile,
  unfollowProfile,
  blockProfile,
  unblockProfile,
  applyForDate,
  reportProfile,
} from "@/actions/social";

interface ProfileActionsProps {
  targetUserId: string;
  targetUsername: string;
  isLiked: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
}

export default function ProfileActions({
  targetUserId,
  targetUsername,
  isLiked: initialLiked,
  isFollowing: initialFollowing,
  isBlocked: initialBlocked,
}: ProfileActionsProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isBlocked, setIsBlocked] = useState(initialBlocked);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportType, setReportType] = useState("OTHER");
  const [pending, startTransition] = useTransition();

  function handleLike() {
    if (pending) return;
    setIsLiked((v) => !v);
    startTransition(async () => {
      const res = isLiked ? await unlikeProfile(targetUserId) : await likeProfile(targetUserId);
      if (!res.success) {
        setIsLiked(isLiked);
      } else if ("matched" in res && res.matched) {
        toast("It's a match! 🎉", "success");
      }
    });
  }

  function handleFollow() {
    if (pending) return;
    setIsFollowing((v) => !v);
    startTransition(async () => {
      const res = isFollowing
        ? await unfollowProfile(targetUserId)
        : await followProfile(targetUserId);
      if (!res.success) setIsFollowing(isFollowing);
    });
  }

  function handleDate() {
    if (pending) return;
    startTransition(async () => {
      const res = await applyForDate(targetUserId);
      if (res.success) toast("Date request sent!", "success");
    });
  }

  function handleBlock() {
    setBlockOpen(false);
    setIsBlocked(true);
    startTransition(async () => {
      await blockProfile(targetUserId);
      toast("Profile blocked");
    });
  }

  function handleUnblock() {
    setIsBlocked(false);
    startTransition(async () => {
      await unblockProfile(targetUserId);
      toast("Profile unblocked");
    });
  }

  function handleReport() {
    if (!reportReason.trim()) {
      toast("Please describe the issue", "error");
      return;
    }
    setReportOpen(false);
    startTransition(async () => {
      const res = await reportProfile(targetUserId, {
        type: reportType as "SPAM" | "HARASSMENT" | "FAKE_PROFILE" | "INAPPROPRIATE" | "OTHER",
        reason: reportReason,
      });
      if (res.success) toast("Report submitted. Thank you!", "success");
      else toast(res.error || "Report failed", "error");
    });
    setReportReason("");
  }

  if (isBlocked) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Ban size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">You have blocked this profile.</p>
        <button
          onClick={handleUnblock}
          className="px-5 py-2 rounded-lg border border-card-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Unblock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleLike}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            isLiked
              ? "bg-accent text-white shadow-sm"
              : "bg-accent/10 text-accent-dark hover:bg-accent/20"
          }`}
        >
          <Heart size={16} className={isLiked ? "fill-current" : ""} />
          {isLiked ? "Liked" : "Like"}
        </button>
        <button
          onClick={handleFollow}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            isFollowing
              ? "bg-muted text-foreground border border-card-border"
              : "bg-primary text-white shadow-sm"
          }`}
        >
          {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDate}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary hover:opacity-90 transition-all active:scale-[0.98]"
        >
          <CalendarHeart size={16} /> Apply for a date
        </button>
        <Link
          href={`/messages/${targetUsername}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-foreground border border-card-border hover:bg-muted transition-all"
        >
          <MessageCircle size={16} /> Message
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link
          href={`/gifts?to=${targetUsername}`}
          className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground border border-card-border hover:text-accent hover:border-accent/40 transition-colors"
        >
          <Gift size={14} /> Gift
        </Link>
        <button
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground border border-card-border hover:text-destructive hover:border-destructive/40 transition-colors"
        >
          <Flag size={14} /> Report
        </button>
        <button
          onClick={() => setBlockOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground border border-card-border hover:text-destructive hover:border-destructive/40 transition-colors"
        >
          <Ban size={14} /> Block
        </button>
      </div>

      <Modal open={blockOpen} onClose={() => setBlockOpen(false)} title="Block Profile">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Block @{targetUsername}? You will no longer see each other&apos;s profiles, likes or
            matches.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setBlockOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-card-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              className="flex-1 py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Block
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Profile">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Issue type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary"
            >
              <option value="SPAM">Spam</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="FAKE_PROFILE">Fake profile</option>
              <option value="INAPPROPRIATE">Inappropriate content</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Describe the issue (min 10 characters)
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              placeholder="Tell us what happened..."
              className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary"
            />
          </div>
          <button
            onClick={handleReport}
            className="w-full py-2.5 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Submit Report
          </button>
        </div>
      </Modal>
    </div>
  );
}