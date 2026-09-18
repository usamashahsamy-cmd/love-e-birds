"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { changePassword } from "@/actions/settings";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!current || !next) {
      toast("Fill in all fields", "error");
      return;
    }
    if (next !== confirm) {
      toast("New passwords do not match", "error");
      return;
    }
    startTransition(async () => {
      const res = await changePassword({ currentPassword: current, newPassword: next, confirmPassword: confirm });
      if (res.success) {
        toast("Password updated", "success");
        setCurrent("");
        setNext("");
        setConfirm("");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to change password", "error");
      }
    });
  }

  const inputCls =
    "w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-card-border bg-card focus:border-primary outline-none";

  return (
    <div className="space-y-3.5">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Current password</label>
        <div className="relative">
          <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">New password</label>
        <div className="relative">
          <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputCls}
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            aria-label="Toggle visibility"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Confirm new password</label>
        <div className="relative">
          <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="Re-enter new password"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold gradient-primary hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {pending ? "Updating..." : "Update password"}
      </button>
    </div>
  );
}