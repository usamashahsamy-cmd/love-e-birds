"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { createGift } from "@/actions/admin";

const TYPES = ["EMOJI", "ANIMATED", "VIRTUAL_ITEM"] as const;

export default function CreateGiftForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("EMOJI");
  const [value, setValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const num = Number(value);
    if (!name.trim() || !(num > 0)) {
      toast("Enter a name and value (₹)", "error");
      return;
    }
    startTransition(async () => {
      const res = await createGift({ name: name.trim(), type, value: num, imageUrl: imageUrl.trim() || undefined });
      if (res.success) {
        toast("Gift added to store", "success");
        setName("");
        setType("EMOJI");
        setValue("");
        setImageUrl("");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to create gift", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3">Add a new gift</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Gift name (e.g. Teddy)"
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="Value ₹"
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>
      <button
        onClick={submit}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
      >
        <Plus size={13} /> {pending ? "Adding..." : "Add gift"}
      </button>
    </div>
  );
}