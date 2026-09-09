"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@arowanabintang.co.id");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!configured) {
      // Mode demo (env Supabase belum diisi) — langsung masuk
      router.push("/dashboard");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError("Email atau kata sandi salah.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground">Masuk ke akun Anda</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Selamat datang kembali. Silakan masukkan kredensial Anda.
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="nama@arowanabintang.co.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Kata Sandi</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="rounded border-input text-teal focus:ring-teal" />
            Ingat saya
          </label>
          <a href="#" className="font-semibold text-primary hover:underline">
            Lupa sandi?
          </a>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-border bg-card p-3 text-center text-xs text-muted-foreground">
        {configured ? (
          <>
            Gunakan akun dari admin. Contoh Super Admin:{" "}
            <span className="font-semibold text-foreground">superadmin@arowanabintang.co.id</span>
          </>
        ) : (
          <>
            Mode demo — klik <span className="font-semibold text-foreground">Masuk</span> untuk
            menjelajahi prototipe.
          </>
        )}
      </div>
    </>
  );
}
