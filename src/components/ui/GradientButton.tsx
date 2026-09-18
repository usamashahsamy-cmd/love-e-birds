"use client";

interface GradientButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function GradientButton({
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 px-6 rounded-xl text-white font-semibold text-base gradient-primary shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      {children}
    </button>
  );
}