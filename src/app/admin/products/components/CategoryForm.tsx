"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { saveCategory } from "@/actions/products-admin";

export default function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim() || !slug.trim()) {
      toast("Enter a name and slug", "error");
      return;
    }
    startTransition(async () => {
      const res = await saveCategory({ name: name.trim(), slug: slug.trim() });
      if (res.success) {
        toast("Category saved", "success");
        setName("");
        setSlug("");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to save category", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 h-fit">
      <p className="text-sm font-semibold mb-3">Add category</p>
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
          }}
          placeholder="Category name"
          aria-label="Category name"
          className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="slug"
          aria-label="Category slug"
          className="w-full px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>
      <button
        onClick={submit}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
      >
        <Plus size={13} /> {pending ? "Saving..." : "Add category"}
      </button>
    </div>
  );
}
