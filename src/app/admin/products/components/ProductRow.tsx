"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Power, Package, UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { saveProduct } from "@/actions/products-admin";

interface ProductData {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  ticketCost: number;
  active: boolean;
  categoryId: string | null;
  categoryName: string | null;
  usedIn: number;
}

export default function ProductRow({
  product,
  categories,
}: {
  product: ProductData;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [ticketCost, setTicketCost] = useState(String(product.ticketCost));
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [uploading, setUploading] = useState(false);

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

  function toggle() {
    startTransition(async () => {
      const res = await saveProduct(product.id, {
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        ticketCost: product.ticketCost,
        categoryId: product.categoryId,
        active: !product.active,
      });
      if (res.success) {
        toast(product.active ? "Product deactivated" : "Product activated", "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  function save() {
    const cost = Number(ticketCost);
    if (!name.trim() || !(Number.isInteger(cost) && cost >= 1)) {
      toast("Enter a name and valid ticket cost", "error");
      return;
    }
    startTransition(async () => {
      const res = await saveProduct(product.id, {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        ticketCost: cost,
        categoryId: categoryId || null,
        active: product.active,
      });
      if (res.success) {
        toast("Product updated", "success");
        setEditing(false);
        router.refresh();
      } else {
        toast(res.error ?? "Failed to update", "error");
      }
    });
  }

  if (!editing) {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={18} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{product.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {product.ticketCost} ticket{product.ticketCost !== 1 ? "s" : ""}
            {product.categoryName ? ` · ${product.categoryName}` : ""}
            {product.usedIn > 0 ? ` · in ${product.usedIn} activit${product.usedIn !== 1 ? "ies" : "y"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={toggle}
            disabled={pending}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              product.active ? "bg-success/10 text-success hover:bg-success/20" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Power size={13} /> {product.active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <p className="text-sm font-semibold mb-3">Edit product</p>
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
            id={`product-image-input-${product.id}`}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <label
            htmlFor={`product-image-input-${product.id}`}
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
                <Image
                  src={imageUrl}
                  alt="preview"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
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
          placeholder="Description"
          aria-label="Description"
          className="col-span-2 px-3 py-2 text-xs rounded-lg border border-card-border bg-background focus:border-primary outline-none"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={pending}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
