import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import Link from "next/link";
import WalletActions from "./WalletActions";

interface BalanceCardProps {
  wallet: {
    balance: unknown;
    frozenBalance: unknown;
    currency: string;
  } | null;
}

function formatINR(value: unknown): string {
  const num = typeof value === "object" && value !== null && "toString" in value
    ? Number(value.toString())
    : Number(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
  return formatted;
}

export default function BalanceCard({ wallet }: BalanceCardProps) {
  const available = formatINR(wallet?.balance);
  const frozen = formatINR(wallet?.frozenBalance);

  return (
    <div className="px-5 -mt-20 relative z-20">
      <div className="bg-card border border-card-border rounded-2xl shadow-md overflow-hidden">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Account Balance</h3>
            <WalletActions />
          </div>

          <div className="flex gap-5">
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground mb-0.5">Available Balance</p>
              <p className="text-xl font-bold text-foreground">{available}</p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground mb-0.5">Frozen Balance</p>
              <p className="text-xl font-bold text-muted-foreground">{frozen}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-card-border">
          <Link
            href="/mine/recharge"
            className="flex items-center justify-center gap-2 py-3.5 font-semibold text-sm text-primary hover:bg-muted transition-colors border-r border-card-border"
          >
            <ArrowDownToLine size={18} /> RECHARGE
          </Link>
          <Link
            href="/mine/withdraw"
            className="flex items-center justify-center gap-2 py-3.5 font-semibold text-sm text-accent-dark hover:bg-muted transition-colors"
          >
            <ArrowUpFromLine size={18} /> WITHDRAW
          </Link>
        </div>
      </div>
    </div>
  );
}