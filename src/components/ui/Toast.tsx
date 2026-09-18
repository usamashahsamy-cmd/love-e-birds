"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type ToastHandler = (message: string, type?: ToastType) => void;

let pushToast: ToastHandler | null = null;
let toastId = 0;

export function toast(message: string, type: ToastType = "info") {
  pushToast?.(message, type);
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-destructive" />,
  info: <Info size={16} className="text-primary" />,
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    pushToast = (message, type = "info") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3000);
    };
    return () => {
      pushToast = null;
    };
  }, [dismiss]);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[400px] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2 bg-card border border-card-border shadow-lg rounded-xl px-3.5 py-2.5 animate-in slide-in-from-top duration-200"
        >
          {icons[t.type]}
          <span className="text-sm text-foreground flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}