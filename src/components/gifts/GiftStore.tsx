"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Send, UserCircle2, Gift } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { sendGift } from "@/actions/gifts";

export interface GiftCatalogItem {
  id: string;
  name: string;
  type: "EMOJI" | "ANIMATED" | "VIRTUAL_ITEM";
  imageUrl: string | null;
  value: number;
}

export interface GiftRecipient {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export default function GiftStore({
  gifts,
  balance,
  myPoints,
  recipients,
  prefillRecipient,
}: {
  gifts: GiftCatalogItem[];
  balance: number;
  myPoints: number;
  recipients: GiftRecipient[];
  prefillRecipient: GiftRecipient | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<GiftCatalogItem | null>(null);
  const [recipientId, setRecipientId] = useState(prefillRecipient?.id ?? "");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredRecipients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) => r.displayName.toLowerCase().includes(q) || r.username.toLowerCase().includes(q)
    );
  }, [recipients, search]);

  const selectedRecipient = recipients.find((r) => r.id === recipientId);

  function handleSend() {
    if (!selected) return;
    if (!recipientId) {
      toast("Choose a person to send the gift", "error");
      return;
    }
    if (balance < selected.value) {
      toast("Insufficient balance. Please recharge first.", "error");
      return;
    }

    startTransition(async () => {
      const res = await sendGift({
        giftId: selected.id,
        receiverId: recipientId,
        message,
      });
      if (res.success) {
        toast(`${selected.name} sent to ${selectedRecipient?.displayName}! 🎁`, "success");
        setSelected(null);
        setMessage("");
        router.refresh();
      } else {
        toast(res.error ?? "Failed to send gift", "error");
      }
    });
  }

  if (gifts.length === 0) {
    return (
      <EmptyState
        icon={Gift}
        title="Store is empty"
        description="Gifts will be available here soon."
      />
    );
  }

  const typeLabel = (t: string) =>
    t === "ANIMATED" ? "Animated" : t === "VIRTUAL_ITEM" ? "Premium" : "Classic";

  return (
    <div>
      <div className="flex gap-3 px-4 mt-3">
        <div className="flex-1 bg-card border border-card-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">Wallet Balance</p>
          <p className="text-sm font-bold">₹{balance.toLocaleString("en-IN")}</p>
        </div>
        <div className="flex-1 bg-card border border-card-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground">My Points</p>
          <p className="text-sm font-bold">{myPoints.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 px-4 mt-4">
        {gifts.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelected(g)}
            className="bg-card border border-card-border rounded-2xl p-2.5 flex flex-col items-center hover:border-accent/50 active:scale-[0.97] transition-all"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted mb-2">
              {g.imageUrl ? (
                <Image src={g.imageUrl} alt={g.name} fill sizes="100px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gift size={28} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs font-semibold">{g.name}</p>
            <p className="text-[10px] text-muted-foreground">{typeLabel(g.type)}</p>
            <p className="text-xs font-bold text-accent-dark mt-0.5">₹{g.value}</p>
          </button>
        ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Send ${selected?.name ?? "Gift"}`}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center overflow-hidden">
                {selected.imageUrl ? (
                  <Image
                    src={selected.imageUrl}
                    alt={selected.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                ) : (
                  <Gift size={24} className="text-accent" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  Costs <span className="font-bold text-accent-dark">₹{selected.value}</span> ·{" "}
                  <span className="font-semibold text-success">+{selected.value} pts</span> for receiver
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Send to</label>
              {recipients.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  No one available yet. Match or follow people to send them gifts.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search people..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
                    />
                  </div>
                  <div className="max-h-40 overflow-auto space-y-1">
                    {filteredRecipients.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRecipientId(r.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                          recipientId === r.id
                            ? "border-primary bg-primary/5"
                            : "border-card-border"
                        }`}
                      >
                        {r.avatar ? (
                          <Image
                            src={r.avatar}
                            alt={r.displayName}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle2 size={28} className="text-muted-foreground" />
                        )}
                        <span className="text-sm truncate">
                          {r.displayName}
                          <span className="block text-[10px] text-muted-foreground">@{r.username}</span>
                        </span>
                      </button>
                    ))}
                    {filteredRecipients.length === 0 && (
                      <p className="text-xs text-muted-foreground px-3 py-2">No results</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Message (optional)</label>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={120}
                placeholder="Say something sweet..."
                className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={pending || recipients.length === 0}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold gradient-primary hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <Send size={15} />
              {pending ? "Sending..." : `Send ${selected.name} · ₹${selected.value}`}
            </button>
            {recipients.length === 0 && (
              <Link
                href="/home"
                className="block text-center text-xs text-primary font-medium"
              >
                Discover people to gift →
              </Link>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}