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
  const [mode, setMode] = useState<"login" | "forgot" | "signup">("login");
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [signupSent, setSignupSent] = useState(false);

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
      options: { data: { full_name: name.trim() }, emailRedirectTo: `${window.location.origin}/` },
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
      redirectTo: `${window.location.origin}/reset-password`,
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
          <form className="mt-8 space-y-4" onSubmit={onSignup}>
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
