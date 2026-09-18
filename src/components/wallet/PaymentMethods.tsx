"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Star, CreditCard, Landmark, Wallet, Smartphone } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from "@/actions/wallet";

interface MethodItem {
  id: string;
  type: string;
  label: string;
  maskedDetails: string;
  isDefault: boolean;
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ size?: number | string; className?: string }>; placeholder: string }> = {
  UPI: { icon: Smartphone, placeholder: "e.g. name@upi" },
  BANK_CARD: { icon: CreditCard, placeholder: "e.g. 4111 1111 1111 1234" },
  BANK_ACCOUNT: { icon: Landmark, placeholder: "e.g. 12345678901" },
  WALLET: { icon: Wallet, placeholder: "e.g. Paytm Number" },
};

export default function PaymentMethods({ methods }: { methods: MethodItem[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<"UPI" | "BANK_CARD" | "BANK_ACCOUNT" | "WALLET">("UPI");
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setLabel("");
    setDetails("");
    setType("UPI");
  }

  function handleAdd() {
    if (!label.trim()) {
      toast("Enter a label", "error");
      return;
    }
    if (details.trim().length < 5) {
      toast("Enter valid payment details", "error");
      return;
    }
    startTransition(async () => {
      const res = await addPaymentMethod({ type, label: label.trim(), details: details.trim() });
      if (res.success) {
        toast("Payment method added", "success");
        reset();
        setAddOpen(false);
        router.refresh();
      } else {
        toast(res.error ?? "Failed to add", "error");
      }
    });
  }

  function handleDelete(id: string, methodLabel: string) {
    startTransition(async () => {
      const res = await deletePaymentMethod(id);
      if (res.success) {
        toast(`${methodLabel} removed`);
        router.refresh();
      } else {
        toast(res.error ?? "Failed to remove", "error");
      }
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      await setDefaultPaymentMethod(id);
      toast("Default method updated", "success");
      router.refresh();
    });
  }

  return (
    <div>
      {methods.length > 0 && (
        <button
          onClick={() => setAddOpen(true)}
          className="w-full mb-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={16} /> Add Payment Method
        </button>
      )}

      <div className="space-y-3">
        {methods.map((m) => {
          const meta = TYPE_META[m.type] ?? TYPE_META.UPI;
          const Icon = meta.icon;
          return (
            <div
              key={m.id}
              className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{m.label}</p>
                  {m.isDefault && (
                    <span className="text-[10px] bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.maskedDetails}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {!m.isDefault && (
                  <button
                    onClick={() => handleSetDefault(m.id)}
                    title="Set as default"
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id, m.label)}
                  title="Remove"
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {methods.length === 0 && (
        <button
          onClick={() => setAddOpen(true)}
          className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={16} /> Add your first payment method
        </button>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Payment Method">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t as typeof type)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    type === t ? "border-primary bg-primary/5 text-primary" : "border-card-border"
                  }`}
                >
                  {t === "BANK_CARD" ? "Bank Card" : t === "BANK_ACCOUNT" ? "Bank Account" : t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My UPI / Salary Account"
              className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Details</label>
            <input
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={TYPE_META[type].placeholder}
              className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={pending}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}