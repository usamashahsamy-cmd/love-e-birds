"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { toggleGift } from "@/actions/admin";

export default function GiftRow({
  gift,
}: {
  gift: {
    id: string;
    name: string;
    type: string;
    value: number;
    imageUrl: string | null;
    isActive: boolean;
    sold: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await toggleGift(gift.id, !gift.isActive);
      if (res.success) {
        toast(gift.isActive ? `${gift.name} deactivated` : `${gift.name} activated`, "success");
        router.refresh();
      } else {
        toast(res.error ?? "Action failed", "error");
      }
    });
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        {gift.imageUrl ? (
          <Image
            src={gift.imageUrl}
            alt={gift.name}
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🎁</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{gift.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {gift.type.toLowerCase().replace("_", " ")} · ₹{gift.value} · {gift.sold} sent
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
          gift.isActive
            ? "bg-success/10 text-success hover:bg-success/20"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        <Power size={13} />
        {gift.isActive ? "Active" : "Inactive"}
      </button>
    </div>
  );
}