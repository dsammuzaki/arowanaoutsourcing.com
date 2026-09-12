import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        {/* Lapisan gradien bergerak */}
        <span className="hero-anim pointer-events-none absolute inset-0 opacity-40" />
        {/* Blob mengambang */}
        <span className="float-a pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
        <span className="float-b pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
        {/* Grid halus */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="relative">
            <span className="absolute -inset-2 rounded-full bg-teal/25 blur-lg" />
            <Logo size={44} className="relative" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold">Barata Sakti Utama</p>
            <p className="text-xs text-teal-soft">Sistem Manajemen Outsourcing</p>
          </div>
        </div>

        <div className="relative">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-teal-soft backdrop-blur">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> Platform HR &amp; Payroll Terpadu
          </span>
          <h2 className="max-w-md text-4xl font-extrabold leading-[1.15]">
            Satu platform untuk{" "}
            <span className="text-shine">payroll, invoice, dan operasional</span> tenaga kerja.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Kelola gaji, pajak PPh 21 &amp; BPJS, penagihan klien, absensi GPS, hingga pencairan
            gaji lintas badan usaha — akurat, terpusat, dan bebas Excel manual.
          </p>

          {/* Chip fitur mengambang */}
          <div className="mt-6 flex max-w-md flex-wrap gap-2">
            {["Payroll & PPh 21", "Invoice Klien", "Absensi GPS", "BPJS", "Manajemen Proyek", "Slip Gaji"].map((f, i) => (
              <span
                key={f}
                className="floaty rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-white/85 backdrop-blur"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                {f}
              </span>
            ))}
          </div>

          <div className="mt-8 flex gap-6 text-sm">
            {[
              { v: "4", l: "Klien aktif" },
              { v: "99", l: "Tenaga kerja" },
              { v: "2", l: "Badan usaha" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-bold text-gold-light">{s.v}</p>
                <p className="text-white/60">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          © 2026 PT. Barata Sakti Utama · Berdiri sejak 2018
        </p>
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center bg-muted px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={40} />
            <div className="leading-tight">
              <p className="font-bold text-foreground">Barata Sakti Utama</p>
              <p className="text-xs text-primary">Outsourcing System</p>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
