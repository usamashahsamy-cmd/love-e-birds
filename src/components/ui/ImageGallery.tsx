"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGalleryProps {
  images: { url: string; caption?: string | null }[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, goTo]);

  if (images.length === 0) return null;

  function handleTouchStart(e: React.TouchEvent) {
    setTouchX(e.touches[0].clientX);
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchX === null) return;
    const diff = e.changedTouches[0].clientX - touchX;
    if (Math.abs(diff) > 40) goTo(current + (diff < 0 ? 1 : -1));
    setTouchX(null);
  }

  return (
    <div
      className="relative bg-black aspect-[4/5] overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((img, i) => (
        <div
          key={img.url}
          className={`absolute inset-0 transition-opacity duration-300 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={img.url}
            alt={img.caption || `Photo ${i + 1}`}
            fill
            sizes="(max-width: 565px) 100vw, 565px"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? "w-4 bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
          <span className="absolute top-3 right-3 text-white text-xs bg-black/40 rounded-full px-2 py-0.5">
            {current + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
      aria-label="Close"
    >
      <X size={18} />
    </button>
  );
}