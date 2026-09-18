"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";
import { updateUserDetails, updateUserAvatar } from "@/actions/admin";
import { addBalance } from "@/actions/balance-admin";

const STATUSES = ["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"] as const;

export default function UserEditForm({
  user,
}: {
  user: {
    id: string;
    displayName: string;
    username: string;
    email: string;
    phone: string;
    countryCode: string;
    status: string;
    creditScore: number;
    bio: string;
    location: string;
    avatar: string | null;
    balance: number;
    frozenBalance: number;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...user, creditScore: String(user.creditScore) });
  const [pending, startTransition] = useTransition();

  const [addAmount, setAddAmount] = useState("");
  const [addReason, setAddReason] = useState("");
  const [adding, startAdd] = useTransition();

  const [avatarUrl, setAvatarUrl] = useState(user.avatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [avatarPending, startAvatar] = useTransition();

  function handleAddBalance(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(addAmount);
    if (!amount || amount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }

    startAdd(async () => {
      const res = await addBalance(user.id, amount, addReason);
      if (res.success) {
        toast("Balance added", "success");
        setAddAmount("");
        setAddReason("");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to add balance", "error");
      }
    });
  }

  async function handleAvatarFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Only image files are allowed", "error");
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Upload failed");
      }
      const url = json.url as string;
      setAvatarUrl(url);

      startAvatar(async () => {
        const result = await updateUserAvatar(user.id, url);
        if (result.success) {
          toast("Avatar updated", "success");
          router.refresh();
        } else {
          toast(result.error ?? "Failed to update avatar", "error");
        }
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateUserDetails(user.id, {
        displayName: form.displayName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        countryCode: form.countryCode,
        status: form.status as (typeof STATUSES)[number],
        creditScore: Number(form.creditScore),
        bio: form.bio,
        location: form.location,
      });
      if (res.success) {
        toast("User updated", "success");
        router.push("/admin/users");
      } else {
        toast(res.error ?? "Update failed", "error");
      }
    });
  }

  return (
    <>
      <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3 max-w-2xl mb-4">
        <p className="text-xs font-semibold">Avatar</p>
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border border-card-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-bold border border-card-border">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarFile(e.target.files?.[0])}
              disabled={uploading || avatarPending}
            />
            <div className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background hover:bg-muted text-center transition-colors disabled:opacity-50">
              {uploading || avatarPending ? "Uploading..." : "Change Avatar"}
            </div>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-5 space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
          <input
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Country Code</label>
          <input
            name="countryCode"
            value={form.countryCode}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Credit Score</label>
          <input
            name="creditScore"
            value={form.creditScore}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
        <textarea
          name="bio"
          rows={3}
          value={form.bio}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none resize-none"
        />
      </div>

      <div className="bg-muted/50 rounded-xl p-3 text-sm">
        <p className="text-muted-foreground">Current wallet: <span className="font-semibold text-foreground">₹{user.balance.toLocaleString("en-IN")}</span></p>
        <p className="text-muted-foreground">Frozen: <span className="font-semibold text-foreground">₹{user.frozenBalance.toLocaleString("en-IN")}</span></p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="flex-1 py-2.5 rounded-lg border border-card-border text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>

    <form onSubmit={handleAddBalance} className="bg-card border border-card-border rounded-2xl p-4 space-y-3 max-w-2xl mt-4">
      <p className="text-xs font-semibold">Add Balance</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="number"
          min={1}
          placeholder="Amount"
          value={addAmount}
          onChange={(e) => setAddAmount(e.target.value.replace(/[^\d]/g, ""))}
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <input
          type="text"
          placeholder="Reason (optional)"
          value={addReason}
          onChange={(e) => setAddReason(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={adding}
        className="w-full py-2.5 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
      >
        {adding ? "Adding..." : "Add Balance"}
      </button>
    </form>
    </>
  );
}
