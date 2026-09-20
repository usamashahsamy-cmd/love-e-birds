"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Star, Landmark, Smartphone, Save } from "lucide-react";
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

const TYPE_OPTIONS = [
  { value: "BANK_ACCOUNT" as const, icon: Landmark, label: "Bank Account" },
  { value: "UPI" as const, icon: Smartphone, label: "UPI" },
];

const TYPE_ICON: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  UPI: Smartphone,
  BANK_ACCOUNT: Landmark,
};

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function PaymentMethods({ methods }: { methods: MethodItem[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<"UPI" | "BANK_ACCOUNT">("UPI");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setType("UPI");
    setUpiId("");
    setBankName("");
    setAccountHolder("");
    setAccountNumber("");
    setIfscCode("");
  }

  function handleAdd() {
    if (type === "UPI") {
      if (!upiId.trim()) {
        toast("Enter your UPI ID", "error");
        return;
      }
      startTransition(async () => {
        const res = await addPaymentMethod({ type: "UPI", upiId: upiId.trim() });
        finishAdd(res.success, res.error);
      });
      return;
    }

    if (!bankName.trim()) {
      toast("Enter bank name", "error");
      return;
    }
    if (!accountHolder.trim()) {
      toast("Enter account holder name", "error");
      return;
    }
    if (!/^[0-9]{9,20}$/.test(accountNumber.trim())) {
      toast("Enter a valid account number (9-20 digits)", "error");
      return;
    }
    if (!IFSC_REGEX.test(ifscCode.trim().toUpperCase())) {
      toast("Enter a valid IFSC code e.g. HDFC0000123", "error");
      return;
    }

    startTransition(async () => {
      const res = await addPaymentMethod({
        type: "BANK_ACCOUNT",
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      finishAdd(res.success, res.error);
    });
  }

  function finishAdd(success: boolean, error?: string) {
    if (success) {
      toast("Payment method added", "success");
      reset();
      setAddOpen(false);
      router.refresh();
    } else {
      toast(error ?? "Failed to add", "error");
    }
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
          const Icon = TYPE_ICON[m.type] ?? TYPE_ICON.UPI;
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
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.maskedDetails}</p>
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
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${
                      type === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-card-border text-muted-foreground"
                    }`}
                  >
                    <Icon size={16} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {type === "BANK_ACCOUNT" ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bank Name</label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank"
                  className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Holder</label>
                <input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Name on bank account"
                  className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="9-20 digits"
                  className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">IFSC Code</label>
                <input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000123"
                  maxLength={11}
                  className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card uppercase focus:border-primary outline-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">UPI ID</label>
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@okhdfc"
                className="w-full px-3 py-2 rounded-lg border border-card-border text-sm bg-card focus:border-primary outline-none"
              />
            </div>
          )}

          <div className="sticky bottom-0 -mx-4 -mb-4 px-4 pt-3 pb-4 bg-card rounded-b-2xl">
            <button
              onClick={handleAdd}
              disabled={pending}
              className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
            >
              <Save size={16} /> {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}