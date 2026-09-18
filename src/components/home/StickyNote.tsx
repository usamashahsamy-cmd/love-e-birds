"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

export interface StickyNoteData {
  id: string;
  title: string;
  content: string;
}

async function loadStickyNote(): Promise<StickyNoteData | null> {
  try {
    const res = await fetch("/api/sticky-note", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.note ?? null;
  } catch {
    return null;
  }
}

export default function StickyNote({ initialNote }: { initialNote?: StickyNoteData | null }) {
  const [note, setNote] = useState<StickyNoteData | null>(initialNote ?? null);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      loadStickyNote().then((next) => {
        if (!cancelled) setNote(next);
      });
    };

    refresh();
    const id = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!note) return null;

  const text = [note.title, note.content].filter(Boolean).join(" · ");

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-r from-primary to-accent text-white text-xs py-2.5 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4">
        <Volume2 size={14} className="flex-shrink-0" />
        <div className="overflow-hidden flex-1">
          <div className="whitespace-nowrap animate-marquee inline-block">
            <span className="mx-4">{text}</span>
            <span className="mx-4 opacity-70">|</span>
            <span className="mx-4">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
