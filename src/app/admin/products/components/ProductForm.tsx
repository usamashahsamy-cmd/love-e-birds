"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";
import { saveProduct } from "@/actions/products-admin";

export default function ProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ticketCost, setTicketCost] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      setImageUrl(json.url);
      toast("Product image uploaded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    const cost = Number(ticketCost);
    if (!name.trim()) {
      toast("Enter a product name", "error");
      return;
    }
    if (!(Number.isInteger(cost) && cost >= 1)) {
      toast("Ticket cost must be at least 1", "error");
      return;
    }
    startTransition(async () => {
      const res = await saveProduct(null, {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        ticketCost: cost,
        categoryId: categoryId || null,
        active: true,
      });
      if (res.success) {
        toast("Product added", "success");
        setName("");
        setDescription("");
        setImageUrl("");
        setTicketCost("1");
        setCategoryId("");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to add product", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3">Add a new product</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          aria-label="Product name"
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-label="Category"
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          value={ticketCost}
          onChange={(e) => setTicketCost(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="Ticket cost"
          aria-label="Ticket cost"
          className="px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
        <div className="col-span-2">
          <input
            type="file"
            accept="image/*"
            hidden
            id="product-image-input"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <label
            htmlFor="product-image-input"
            className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-card-border hover:border-primary/50 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {uploading ? (
                <Loader2 size={15} className="text-muted-foreground animate-spin" />
              ) : imageUrl ? (
                <CheckCircle2 size={15} className="text-success" />
              ) : (
                <UploadCloud size={15} className="text-muted-foreground" />
              )}
            </div>
            <div className="text-left flex-1 min-w-0">
              {imageUrl ? (
                <p className="text-xs font-medium text-success">Image uploaded</p>
              ) : (
                <>
                  <p className="text-xs font-medium">Tap to upload product image</p>
                  <p className="text-[10px] text-muted-foreground">Recommended: 400×400 px</p>
                </>
              )}
            </div>
            {imageUrl && (
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative">
                <Image src={imageUrl} alt="preview" fill className="object-cover" />
              </div>
            )}
          </label>
          {imageUrl && (
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Image URL"
              aria-label="Image URL"
              className="w-full mt-2 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
            />
          )}
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          aria-label="Description"
          className="col-span-2 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>
      <button
        onClick={submit}
        disabled={pending}
        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
      >
        <Plus size={13} /> {pending ? "Adding..." : "Add product"}
      </button>
    </div>
  );
}
