"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import { updateUserDetails } from "@/actions/admin";

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
    balance: number;
    frozenBalance: number;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({ ...user, creditScore: String(user.creditScore) });
  const [pending, startTransition] = useTransition();

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
  );
}
