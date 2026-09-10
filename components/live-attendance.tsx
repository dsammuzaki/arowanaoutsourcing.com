"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { LogIn, LogOut, Clock3, MapPin, CheckCircle2 } from "lucide-react";

const WIB = "Asia/Jakarta";
const STORE_KEY = "abp_absensi_today";

type Today = { date: string; checkIn?: string; checkOut?: string };

function todayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WIB }).format(d); // YYYY-MM-DD
}
function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function load(dateStr: string): Today {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Today;
      if (parsed.date === dateStr) return parsed;
    }
  } catch {}
  return { date: dateStr };
}

export function LiveAttendance() {
  const [now, setNow] = useState<Date | null>(null);
  const [rec, setRec] = useState<Today>({ date: "" });

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!now) return;
    const key = todayKey(now);
    setRec((r) => (r.date === key ? r : load(key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now ? todayKey(now) : ""]);

  function persist(next: Today) {
    setRec(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {}
  }

  function checkIn() {
    if (!now) return;
    persist({ ...rec, date: todayKey(now), checkIn: fmtTime(now) });
  }
  function checkOut() {
    if (!now) return;
    persist({ ...rec, date: todayKey(now), checkOut: fmtTime(now) });
  }

  const timeStr = now ? fmtTime(now) : "--:--:--";
  const dateStr = now ? fmtDate(now) : "";

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {/* Jam realtime */}
        <div className="relative flex flex-col justify-center gap-1 bg-navy p-6 text-white">
          <span className="hero-anim pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2 text-teal-soft">
              <Clock3 size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">Waktu Sekarang · WIB</span>
              <span className="pulse-dot ml-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <p className="font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{timeStr}</p>
            <p className="mt-1 text-sm text-white/70">{dateStr || "Memuat…"}</p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-white/60">
              <MapPin size={12} /> Kantor Pusat ABP · Tambun Selatan, Bekasi
            </p>
          </div>
        </div>

        {/* Absen masuk / pulang */}
        <div className="flex flex-col justify-center gap-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Jam Masuk</p>
              <p className={`mt-0.5 text-xl font-bold ${rec.checkIn ? "text-emerald-600" : "text-muted-foreground"}`}>
                {rec.checkIn ?? "--:--"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Jam Pulang</p>
              <p className={`mt-0.5 text-xl font-bold ${rec.checkOut ? "text-primary" : "text-muted-foreground"}`}>
                {rec.checkOut ?? "--:--"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={checkIn}
              disabled={!!rec.checkIn}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              <LogIn size={16} /> Absen Masuk
            </button>
            <button
              onClick={checkOut}
              disabled={!rec.checkIn || !!rec.checkOut}
              className="btn-outline flex-1 justify-center disabled:opacity-50"
            >
              <LogOut size={16} /> Absen Pulang
            </button>
          </div>

          {rec.checkIn && rec.checkOut && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 size={14} /> Kehadiran hari ini tercatat lengkap.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
