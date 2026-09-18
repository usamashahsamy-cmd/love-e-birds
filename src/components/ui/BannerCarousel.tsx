"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
}

interface BannerCarouselProps {
  banners: BannerItem[];
  autoPlayInterval?: number;
}

export default function BannerCarousel({
  banners,
  autoPlayInterval = 4000,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = banners.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count === 0) return;
    timer.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, autoPlayInterval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [count, autoPlayInterval]);

  function handleTouchStart(e: React.TouchEvent) {
    setTouchX(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchX === null) return;
    const diff = e.changedTouches[0].clientX - touchX;
    if (Math.abs(diff) > 40) {
      goTo(current + (diff < 0 ? 1 : -1));
    }
    setTouchX(null);
  }

  if (banners.length === 0) return null;

  const slideCls = (i: number) =>
    `absolute top-0 left-0 w-full h-full transition-opacity duration-500 ${
      i === current ? "opacity-100" : "opacity-0 pointer-events-none"
    }`;

  return (
    <div
      className="relative h-36 sm:h-44 rounded-2xl overflow-hidden mx-4 mt-4 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, i) => {
        const inner = (
          <div className={slideCls(i)}>
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              sizes="(max-width: 565px) 100vw, 565px"
              className="object-cover"
              priority={i === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-white font-bold text-base sm:text-lg leading-tight">
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p className="text-white/80 text-xs mt-0.5 line-clamp-1">
                  {banner.subtitle}
                </p>
              )}
            </div>
          </div>
        );

        return banner.linkUrl ? (
          <Link key={banner.id} href={banner.linkUrl} className={slideCls(i)}>
            {inner}
          </Link>
        ) : (
          <div key={banner.id}>{inner}</div>
        );
      })}

      <div className="absolute bottom-2.5 right-3 flex gap-1.5 z-10">
        {banners.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? "w-4 bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}