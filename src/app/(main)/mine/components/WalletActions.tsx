"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WalletActions() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 600);
  }

  return (
    <button
      onClick={handleRefresh}
      className="p-1.5 rounded-full hover:bg-muted transition-colors"
      title="Refresh balance"
    >
      <RefreshCw size={16} className={`text-muted-foreground ${spinning ? "animate-spin" : ""}`} />
    </button>
  );
}