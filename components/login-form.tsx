"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";
const siteUrl = (path: string) =>
  `${SITE || (typeof window !== "undefined" ? window.location.origin : "")}${path}`;

function GoogleButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        Lanjut dengan Google
      </button>
      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">atau</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@arowanabintang.co.id");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "forgot" | "signup">("login");
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [signupSent, setSignupSent] = useState(false);

  async function onGoogle() {
    setError("");
    if (!configured) return setError("Login Google belum aktif di mode demo.");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: siteUrl("/auth/callback?next=/dashboard") },
    });
    if (error) setError(error.message);
  }

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Masukkan nama lengkap.");
    if (!email.includes("@")) return setError("Email tidak valid.");
    if (password.length < 8) return setError("Password minimal 8 karakter.");
    if (!configured) return setError("Pendaftaran belum aktif di mode demo.");
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: siteUrl("/") },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (data.session) {
      // email confirmation nonaktif -> langsung masuk
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setSignupSent(true);
  }

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

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Masukkan email akun Anda.");
      return;
    }
    if (!configured) {
      setError("Fitur email belum aktif di mode demo.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl("/reset-password"),
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  }

  if (mode === "signup") {
    return (
      <>
        <h1 className="text-2xl font-bold text-foreground">Buat Akun Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daftar dengan email aktif Anda — kami kirim email verifikasi sebelum akun bisa digunakan.
        </p>
        {signupSent ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Email verifikasi telah dikirim ke <span className="font-semibold">{email}</span>. Buka email
              tersebut dan klik tautan verifikasi, lalu kembali untuk masuk.
            </div>
            <button className="btn-outline w-full justify-center" onClick={() => { setMode("login"); setSignupSent(false); }}>
              Kembali ke Masuk
            </button>
          </div>
        ) : (
          <>
          <div className="mt-8">
            <GoogleButton onClick={onGoogle} />
          </div>
          <form className="space-y-4" onSubmit={onSignup}>
            <div>
              <label className="label">Nama Lengkap</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
            </div>
            <div>
              <label className="label">Kata Sandi</label>
              <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 karakter" />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Mendaftar…" : "Daftar & Kirim Verifikasi"}
            </button>
            <button type="button" className="w-full text-center text-sm font-semibold text-primary hover:underline" onClick={() => { setMode("login"); setError(""); }}>
              Sudah punya akun? Masuk
            </button>
          </form>
          </>
        )}
      </>
    );
  }

  if (mode === "forgot") {
    return (
      <>
        <h1 className="text-2xl font-bold text-foreground">Lupa Kata Sandi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan email akun Anda — kami kirim tautan reset ke email tersebut.
        </p>
        {resetSent ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              Tautan reset telah dikirim ke <span className="font-semibold">{email}</span>. Cek kotak masuk
              (dan folder spam), lalu buka tautannya untuk menyetel password baru.
            </div>
            <button
              className="btn-outline w-full justify-center"
              onClick={() => {
                setMode("login");
                setResetSent(false);
              }}
            >
              Kembali ke Masuk
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onForgot}>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">{error}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Mengirim…" : "Kirim Tautan Reset"}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Kembali ke Masuk
            </button>
          </form>
        )}
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-foreground">Masuk ke akun Anda</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Selamat datang kembali. Silakan masukkan kredensial Anda.
      </p>

      <div className="mt-8">
        <GoogleButton onClick={onGoogle} />
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
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
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
            className="font-semibold text-primary hover:underline"
          >
            Lupa sandi?
          </button>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Memproses…" : "Masuk"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className="font-semibold text-primary hover:underline"
          >
            Daftar sekarang
          </button>
        </p>
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
