"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, KeyRound, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/logo";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!configured) {
      setChecking(false);
      return;
    }
    const supabase = createClient();
    const finish = (ok: boolean, mail?: string) => {
      if (ok) {
        setReady(true);
        if (mail) setEmail(mail);
      }
      setChecking(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) finish(true, session.user.email ?? undefined);
    });
    // beri waktu klien menukar token dari URL, lalu cek sesi
    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => finish(!!data.session, data.session?.user.email ?? undefined));
    }, 700);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pw.length < 8) return setErr("Password minimal 8 karakter.");
    if (pw !== pw2) return setErr("Konfirmasi password tidak sama.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Logo size={40} />
          <div className="leading-tight">
            <p className="font-bold text-foreground">Barata Sakti Utama</p>
            <p className="text-xs text-primary">Outsourcing System</p>
          </div>
        </div>

        <div className="card p-6">
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /> Memeriksa tautan…
            </div>
          ) : done ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Password berhasil diubah</h1>
                <p className="mt-1 text-sm text-muted-foreground">Silakan masuk dengan password baru Anda.</p>
              </div>
              <button className="btn-primary w-full" onClick={() => router.push("/")}>
                Ke halaman masuk
              </button>
            </div>
          ) : !ready ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                <KeyRound size={24} />
              </div>
              <h1 className="text-lg font-bold text-foreground">Tautan tidak valid / kedaluwarsa</h1>
              <p className="text-sm text-muted-foreground">
                Buka tautan reset dari email terbaru Anda, atau minta tautan baru dari halaman masuk.
              </p>
              <Link href="/" className="btn-outline w-full justify-center">
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-foreground">Setel Password Baru</h1>
                <p className="mt-1 text-sm text-muted-foreground">{email ? `Untuk ${email}` : "Masukkan password baru Anda."}</p>
              </div>
              <div>
                <label className="label">Password Baru</label>
                <div className="relative">
                  <input
                    className="input pr-9"
                    type={show ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Min. 8 karakter"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShow((s) => !s)}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Ulangi Password</label>
                <input
                  className="input"
                  type={show ? "text" : "password"}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="Ketik ulang"
                />
              </div>
              {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red dark:bg-red-950/40">{err}</p>}
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? "Menyimpan…" : "Simpan Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
