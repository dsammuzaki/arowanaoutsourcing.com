"use client";

import { useState } from "react";
import { MessageCircle, X, ChevronUp } from "lucide-react";
import { ChatClient, type Member } from "./chat-client";

export function ChatWidget({
  me,
  members,
  dbReady = true,
}: {
  me: { id: string; name: string };
  members: Member[];
  dbReady?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Belum login → jangan tampilkan widget.
  if (!me.id) return null;

  // Tersembunyi: zona hover kecil di pojok kanan bawah untuk memunculkan lagi.
  if (hidden) {
    return (
      <button
        type="button"
        onMouseEnter={() => setHidden(false)}
        onClick={() => setHidden(false)}
        aria-label="Tampilkan chat tim"
        title="Arahkan kursor ke sini untuk menampilkan chat"
        className="group fixed bottom-0 right-0 z-40 flex h-16 w-16 items-end justify-end p-1.5"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-tl-xl rounded-br-lg bg-primary/30 text-primary-foreground opacity-40 transition-opacity group-hover:opacity-100">
          <ChevronUp size={14} />
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Panel pop-up */}
      {open && (
        <div
          className="fixed right-4 z-50 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl lg:right-6"
          style={{ bottom: "calc(9.5rem + var(--safe-bottom))", height: "min(70vh, 560px)" }}
          role="dialog"
          aria-label="Chat Tim"
        >
          <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={17} />
              <span className="text-sm font-bold">Chat Tim</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Tutup"
            >
              <X size={17} />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            {dbReady ? (
              <ChatClient me={me} members={members} compact />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Fitur chat belum aktif. Jalankan <span className="mx-1 font-semibold text-foreground">schema-7.sql</span> di
                Supabase.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tombol mengambang (FAB) + tombol sembunyikan */}
      <div
        className="group fixed right-4 z-50 lg:right-6"
        style={{ bottom: "calc(5rem + var(--safe-bottom))" }}
      >
        {/* Sembunyikan (muncul saat hover) */}
        <button
          onClick={() => {
            setHidden(true);
            setOpen(false);
          }}
          aria-label="Sembunyikan chat"
          title="Sembunyikan"
          className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow transition-opacity hover:text-brand-red group-hover:opacity-100"
        >
          <X size={13} />
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Tutup chat" : "Buka chat tim"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(26,125,156,0.7)] transition-transform hover:scale-105 active:scale-95"
        >
          {open ? <X size={22} /> : <MessageCircle size={24} />}
        </button>
      </div>
    </>
  );
}
