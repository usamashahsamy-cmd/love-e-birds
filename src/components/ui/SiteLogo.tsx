"use client";

import Image from "next/image";

export default function SiteLogo({
  url,
  fallback = "LB",
  size = 28,
  className = "",
}: {
  url: string | null | undefined;
  fallback?: string;
  size?: number;
  className?: string;
}) {
  if (url) {
    return (
      <div
        className={`relative flex-shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={url}
          alt="Love e Birds"
          fill
          className="object-contain"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 rounded-full gradient-primary flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
        {fallback}
      </span>
    </div>
  );
}
