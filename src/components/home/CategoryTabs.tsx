"use client";

import { useRef } from "react";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
}

export default function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 px-4 mt-4 overflow-x-auto hide-scrollbar -mx-4 px-4"
    >
      {categories.map((cat) => {
        const isActive = active === cat.slug;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.slug)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isActive
                ? "gradient-primary text-white border-transparent shadow-sm"
                : "bg-card text-muted-foreground border-card-border hover:border-primary/40"
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}