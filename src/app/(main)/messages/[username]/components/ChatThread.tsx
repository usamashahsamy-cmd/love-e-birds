"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { sendMessage, markConversationRead } from "@/actions/messages";

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function ChatThread({
  conversationId,
  myId,
  other,
  initialMessages,
  lastReadAt,
}: {
  conversationId: string | null;
  myId: string;
  other: { username: string; displayName: string; avatar: string | null };
  initialMessages: ChatMessage[];
  lastReadAt: string | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLengthRef = useRef(initialMessages.length);

  useEffect(() => {
    if (conversationId) {
      markConversationRead(conversationId).catch(() => {});
    }
  }, [conversationId, initialMessages.length, lastReadAt]);

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (initialMessages.length !== lastLengthRef.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      lastLengthRef.current = initialMessages.length;
    }
  }, [initialMessages.length]);

  function handleSend() {
    const content = draft.trim();
    if (!content || pending) return;
    setDraft("");
    startTransition(async () => {
      const res = await sendMessage({ toUsername: other.username, content });
      if (res.success) {
        router.refresh();
      } else {
        toast(res.error ?? "Failed to send message", "error");
        setDraft(content);
      }
    });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
        {initialMessages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            Send the first message to start chatting 💬
          </p>
        )}
        {initialMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} mine={msg.senderId === myId} other={other} />
        ))}
      </div>

      <div className="px-3 py-2.5 bg-card border-t border-card-border flex items-center gap-2 flex-shrink-0 safe-area-bottom">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 px-3.5 py-2.5 text-sm rounded-full border border-card-border bg-background focus:border-primary outline-none"
        />
        <button
          onClick={handleSend}
          disabled={pending || !draft.trim()}
          aria-label="Send"
          className="w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  mine,
  other,
}: {
  msg: ChatMessage;
  mine: boolean;
  other: { displayName: string; avatar: string | null };
}) {
  const t = new Date(msg.createdAt);
  return (
    <div className={`flex items-end gap-1.5 ${mine ? "justify-end" : ""}`}>
      {!mine && (
        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-0.5">
          {other.avatar ? (
            <Image src={other.avatar} alt="" width={24} height={24} className="object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              {other.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
      <div
        className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm break-words ${
          mine ? "gradient-primary text-white rounded-br-sm" : "bg-card border border-card-border rounded-bl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-[9px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>
          {t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}