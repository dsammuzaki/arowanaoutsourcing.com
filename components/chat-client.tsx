"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Search, ArrowLeft, MessageSquare } from "lucide-react";
import { Card, Avatar } from "@/components/ui";
import { createClient } from "@/utils/supabase/client";
import { sendMessage, markRead } from "@/app/(app)/chat/actions";

export type Member = { id: string; name: string; role: string };
type Msg = { id: string; from_id: string; to_id: string; body: string; created_at: string };

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  operation: "Operation",
  director: "Director",
  finance: "Finance",
  hr_pic: "HR / PIC",
  customer: "Customer",
};

function fmt(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function ChatClient({ me, members }: { me: { id: string; name: string }; members: Member[] }) {
  const [active, setActive] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastByPeer, setLastByPeer] = useState<Record<string, string>>({});
  const activeRef = useRef<Member | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  activeRef.current = active;

  const filtered = members.filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()));

  // Realtime: dengarkan pesan yang melibatkan saya
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("chat-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.from_id !== me.id && m.to_id !== me.id) return;
        const peer = m.from_id === me.id ? m.to_id : m.from_id;
        setLastByPeer((s) => ({ ...s, [peer]: m.body }));
        if (activeRef.current && peer === activeRef.current.id) {
          setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
          if (m.to_id === me.id) markRead(peer);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Muat percakapan saat memilih anggota
  useEffect(() => {
    if (!active) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("messages")
      .select("id, from_id, to_id, body, created_at")
      .or(`from_id.eq.${active.id},to_id.eq.${active.id}`)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        setMessages((data as Msg[]) ?? []);
        setLoading(false);
        markRead(active.id);
      });
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !text.trim() || sending) return;
    const body = text.trim();
    setText("");
    setSending(true);
    const temp: Msg = { id: `temp-${Date.now()}`, from_id: me.id, to_id: active.id, body, created_at: new Date().toISOString() };
    setMessages((ms) => [...ms, temp]);
    const res = await sendMessage({ toId: active.id, toName: active.name, body });
    setSending(false);
    if (!res.ok) {
      setMessages((ms) => ms.filter((m) => m.id !== temp.id));
      alert(res.error || "Gagal mengirim.");
      return;
    }
    setMessages((ms) => ms.map((m) => (m.id === temp.id ? { ...m, id: res.id ?? m.id, created_at: res.createdAt ?? m.created_at } : m)));
    setLastByPeer((s) => ({ ...s, [active.id]: body }));
  }

  return (
    <Card className="grid h-[calc(100vh-13rem)] min-h-[26rem] grid-cols-1 overflow-hidden md:grid-cols-[19rem_1fr]">
      {/* Daftar anggota */}
      <div className={`flex flex-col border-r border-border ${active ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="input pl-9" placeholder="Cari anggota…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Tidak ada anggota.</p>}
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m)}
              className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted ${
                active?.id === m.id ? "bg-primary/10" : ""
              }`}
            >
              <Avatar name={m.name} tone="navy" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {lastByPeer[m.id] ?? roleLabel[m.role] ?? m.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className={`flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare size={40} className="opacity-40" />
            <p className="text-sm">Pilih anggota untuk mulai mengobrol</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button className="rounded-lg p-1 text-muted-foreground hover:bg-muted md:hidden" onClick={() => setActive(null)}>
                <ArrowLeft size={18} />
              </button>
              <Avatar name={active.name} tone="navy" />
              <div>
                <p className="text-sm font-semibold text-foreground">{active.name}</p>
                <p className="text-xs text-muted-foreground">{roleLabel[active.role] ?? active.role}</p>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
              {loading && <p className="text-center text-xs text-muted-foreground">Memuat…</p>}
              {!loading && messages.length === 0 && (
                <p className="mt-8 text-center text-sm text-muted-foreground">Belum ada pesan. Sapa {active.name} 👋</p>
              )}
              {messages.map((m) => {
                const mine = m.from_id === me.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{fmt(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
              <input
                className="input flex-1"
                placeholder={`Pesan ke ${active.name}…`}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={sending || !text.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </Card>
  );
}
