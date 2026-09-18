"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Menu,
  Clock,
  Ticket,
  Wallet,
  History,
  FileText,
  X,
  Minus,
  Plus,
  Check,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { saveSelection, participate } from "@/actions/activities";

export interface ActivityProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  ticketCost: number;
  displayOrder: number;
  isFeatured: boolean;
}

export interface ActivityData {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt: string;
  maxQuantity: number;
  active: boolean;
  status: "UPCOMING" | "ACTIVE" | "ENDING" | "ENDED";
}

interface Props {
  activity: ActivityData;
  user: { id: string; username: string; displayName: string; avatar: string | null; balance: number };
  products: ActivityProduct[];
  initialSelection: { productId: string; quantity: number } | null;
  alreadyParticipated: boolean;
}

const STATUS_STYLES: Record<ActivityData["status"], string> = {
  UPCOMING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ENDING: "bg-amber-100 text-amber-700",
  ENDED: "bg-red-100 text-red-700",
};

export default function ActivityClient({
  activity,
  user,
  products,
  initialSelection,
  alreadyParticipated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [now, setNow] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelection?.productId ?? null);
  const [quantity, setQuantity] = useState(initialSelection?.quantity ?? 1);
  const [customBalance, setCustomBalance] = useState(() => {
    const initialProduct = products.find((p) => p.id === initialSelection?.productId);
    return initialProduct ? initialProduct.ticketCost * (initialSelection?.quantity ?? 1) : 0;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [participated, setParticipated] = useState(alreadyParticipated);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const endMs = new Date(activity.endAt).getTime();
  const startMs = new Date(activity.startAt).getTime();
  const remainingMs = Math.max(0, endMs - now);
  const ended = remainingMs <= 0 || now >= endMs;
  const started = now >= startMs;

  const derivedStatus: ActivityData["status"] = !activity.active
    ? "ENDED"
    : !started
      ? "UPCOMING"
      : ended
        ? "ENDED"
        : remainingMs <= 30 * 60 * 1000
          ? "ENDING"
          : "ACTIVE";

  const canSelect = derivedStatus === "ACTIVE" && !participated;

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId]
  );
  const total = selected ? selected.ticketCost * quantity : 0;

  const featured = products.filter((p) => p.isFeatured).slice(0, 4);
  const gridProducts = featured.length > 0 ? featured : products.slice(0, 4);
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.name, p.name));
    return ["All products", ...Array.from(map.values())];
  }, [products]);
  const [category, setCategory] = useState("All products");

  function fmt(ms: number) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
  }

  function selectProduct(id: string) {
    if (!canSelect) {
      toast(participated ? "You already participated" : "Activity is not active", "error");
      return;
    }
    setSelectedId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setCustomBalance(product.ticketCost * quantity);
    }
    startTransition(async () => {
      await saveSelection({ activityId: activity.id, productId: id, quantity });
    });
  }

  function changeQuantity(delta: number) {
    const next = Math.min(activity.maxQuantity, Math.max(1, quantity + delta));
    if (next === quantity) return;
    setQuantity(next);
    if (selected) {
      setCustomBalance(selected.ticketCost * next);
    }
    if (selectedId) {
      startTransition(async () => {
        await saveSelection({ activityId: activity.id, productId: selectedId, quantity: next });
      });
    }
  }

  function confirmParticipation() {
    if (!selected) {
      toast("Select a product first", "error");
      return;
    }
    if (total > user.balance) {
      toast("Insufficient balance. Recharge your wallet first.", "error");
      return;
    }
    setConfirmOpen(true);
  }

  function doParticipate() {
    if (!selected) return;
    startTransition(async () => {
      const res = await participate({
        activityId: activity.id,
        productId: selected.id,
        quantity,
      });
      if (res.success) {
        toast("Participation confirmed!", "success");
        setParticipated(true);
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast(res.error ?? "Failed to participate", "error");
        setConfirmOpen(false);
      }
    });
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-40">
      <header className="sticky top-0 z-30 gradient-primary text-white">
        <div className="flex items-center justify-between px-4 h-12">
          <Link href="/home" className="p-1 -ml-1 rounded-full hover:bg-white/15">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-sm font-bold truncate">{activity.title}</h1>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="p-1 -mr-1 rounded-full hover:bg-white/15"
            >
              <Menu size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 bg-card text-foreground border border-card-border rounded-xl shadow-xl overflow-hidden">
                <button
                  onClick={() => { setRulesOpen(true); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted"
                >
                  <FileText size={14} /> Activity Rules
                </button>
                <Link
                  href="/activities/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted"
                >
                  <History size={14} /> My Participation
                </Link>
                <Link
                  href="/activities/history"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted"
                >
                  <History size={14} /> Activity History
                </Link>
                <Link
                  href="/mine/my-bank"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted"
                >
                  <Wallet size={14} /> Wallet
                </Link>
                <Link
                  href="/mine/essential-information"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted"
                >
                  <FileText size={14} /> Help
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex-shrink-0 border border-white/30">
            {user.avatar ? (
              <Image src={user.avatar} alt="" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user.displayName}</p>
            <p className="text-[10px] text-white/80">@{user.username}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_STYLES[derivedStatus]}`}>
            {derivedStatus}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 pb-3 text-white/90">
          <Clock size={14} />
          <span className="text-[11px]">Remaining time:</span>
          <span className="text-xs font-mono font-bold tracking-wider">
            {ended ? "00:00:00" : fmt(remainingMs)}
          </span>
          {ended && <span className="text-[10px] font-semibold">Activity Ended</span>}
        </div>
      </header>

      <div className="gradient-primary text-white px-4 py-2.5 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="More products"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setRulesOpen(true)}
            aria-label="Rules"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <FileText size={16} />
          </button>
          <Link
            href="/activities/history"
            aria-label="History"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <History size={16} />
          </Link>
        </div>
        <div className="relative">
          <button
            onClick={() => setCatOpen((v) => !v)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-[11px] font-semibold"
          >
            {category} <ChevronDown size={13} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
          </button>
          {catOpen && (
            <div className="absolute right-0 top-9 w-40 bg-card text-foreground border border-card-border rounded-xl shadow-xl overflow-hidden z-20">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setCatOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
                >
                  {c === category && <Check size={13} className="text-primary" />}
                  <span className={c === category ? "font-semibold" : ""}>{c}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="px-4 pt-4">
        {participated && (
          <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl px-3 py-2.5 font-medium">
            You have already participated in this activity. See your{" "}
            <Link href="/activities/history" className="underline font-semibold">history</Link>.
          </div>
        )}

        {derivedStatus === "UPCOMING" && (
          <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-xl px-3 py-2.5 font-medium">
            This activity has not started yet. Selection opens when it goes live.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {gridProducts.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectProduct(p.id)}
                disabled={!canSelect}
                className={`bg-card border rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97] ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-md"
                    : "border-card-border hover:border-primary/40 hover:shadow-sm"
                } ${!canSelect ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="relative aspect-square bg-muted">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>
                  <p className="text-[11px] font-bold text-primary mt-1 flex items-center gap-1">
                    <Ticket size={11} /> {p.ticketCost} ticket{p.ticketCost !== 1 ? "s" : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-semibold hover:bg-primary/5"
        >
          More Products
        </button>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[565px] bg-card border-t border-card-border z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Current Selection:</span>
            <span className="font-semibold truncate max-w-[55%]">{selected ? selected.name : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Quantity:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeQuantity(-1)}
                disabled={!canSelect || quantity <= 1}
                aria-label="Decrease"
                className="w-7 h-7 rounded-full border border-card-border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
              >
                <Minus size={13} />
              </button>
              <input
                type="number"
                min={1}
                max={activity.maxQuantity}
                value={quantity}
                disabled={!canSelect}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isNaN(value)) return;
                  const next = Math.min(activity.maxQuantity, Math.max(1, Math.floor(value)));
                  setQuantity(next);
                  if (selectedId) {
                    startTransition(async () => {
                      await saveSelection({ activityId: activity.id, productId: selectedId, quantity: next });
                    });
                  }
                }}
                className="w-12 text-center font-bold text-xs py-1 rounded border border-card-border bg-background focus:border-primary outline-none disabled:opacity-50"
              />
              <button
                onClick={() => changeQuantity(1)}
                disabled={!canSelect || quantity >= activity.maxQuantity}
                aria-label="Increase"
                className="w-7 h-7 rounded-full border border-card-border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold">{total}</span>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Ticket:</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <Ticket size={12} /> {total}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Use Balance:</span>
            <input
              type="number"
              min={selected ? selected.ticketCost : 1}
              max={user.balance}
              value={customBalance}
              disabled={!canSelect || !selected}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (Number.isNaN(value)) return;
                if (!selected) return;
                const max = Math.min(user.balance, activity.maxQuantity * selected.ticketCost);
                const clamped = Math.min(max, Math.max(0, Math.floor(value)));
                const cost = selected.ticketCost;
                const nextTotal = Math.floor(clamped / cost) * cost;
                const nextQty = Math.max(1, nextTotal / cost);
                setCustomBalance(nextTotal);
                setQuantity(nextQty);
                if (selectedId) {
                  startTransition(async () => {
                    await saveSelection({ activityId: activity.id, productId: selectedId, quantity: nextQty });
                  });
                }
              }}
              className="w-16 text-right font-bold text-xs py-1 px-2 rounded border border-card-border bg-background focus:border-primary outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-muted-foreground">Wallet Balance:</span>
            <span className="font-bold text-success flex items-center gap-1">
              <Wallet size={12} /> ₹{user.balance}
            </span>
          </div>
          <button
            onClick={confirmParticipation}
            disabled={!canSelect || !selected || pending}
            className="w-full py-3 rounded-xl gradient-primary text-white text-sm font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all"
          >
            {participated
              ? "Already Participated"
              : ended
                ? "Activity Ended"
                : !started
                  ? "Not Started"
                  : !selected
                    ? "Select a Product"
                    : total > user.balance
                      ? "Insufficient Balance"
                      : "Confirm Participation"}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[85%] sm:w-[320px] bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
              <h3 className="text-sm font-bold">More Products</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-full hover:bg-muted">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {products.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { selectProduct(p.id); setDrawerOpen(false); }}
                    disabled={!canSelect}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                      isSelected ? "border-primary bg-primary/5" : "border-card-border hover:border-primary/40"
                    } ${!canSelect ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🎁</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>
                    </div>
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1 flex-shrink-0">
                      <Ticket size={11} /> {p.ticketCost}
                    </span>
                    {isSelected && <Check size={14} className="text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Participation">
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden relative flex-shrink-0">
                {selected.imageUrl ? (
                  <Image src={selected.imageUrl} alt={selected.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{selected.name}</p>
                <p className="text-[11px] text-muted-foreground">{selected.ticketCost} ticket(s) each</p>
              </div>
            </div>
            <div className="bg-muted/60 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-semibold">{quantity}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Ticket cost</span><span className="font-semibold">{selected.ticketCost}</span></div>
              <div className="flex justify-between border-t border-card-border pt-1.5"><span className="text-muted-foreground">Total</span><span className="font-bold text-primary">{total} tickets</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Wallet balance</span><span className="font-semibold">₹{user.balance}</span></div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-card-border text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={doParticipate}
                disabled={pending}
                className="flex-1 py-2.5 rounded-lg gradient-primary text-white text-sm font-bold disabled:opacity-50"
              >
                {pending ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title="Activity Rules">
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>1. Select a product and quantity before the activity ends.</p>
          <p>2. Each product costs tickets; total = ticket cost × quantity.</p>
          <p>3. Confirm participation to deduct tickets from your wallet.</p>
          <p>4. Maximum quantity per activity: {activity.maxQuantity}.</p>
          <p>5. One participation per activity per user.</p>
          <p>6. When the timer reaches zero, participation closes.</p>
          <p>7. Tickets are non-refundable once confirmed.</p>
        </div>
      </Modal>
    </div>
  );
}
