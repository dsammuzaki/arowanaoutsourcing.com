import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(600px circle at 20% 20%, #1a7d9c, transparent 55%), radial-gradient(500px circle at 80% 70%, #c69a34, transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <Logo size={40} chip />
          <div className="leading-tight">
            <p className="text-lg font-bold">Barata Sakti Utama</p>
            <p className="text-xs text-teal-soft">Sistem Manajemen Outsourcing</p>
          </div>
        </div>
        <div className="relative">
          <h2 className="max-w-md text-3xl font-bold leading-snug">
            Satu platform untuk payroll, invoice, dan operasional tenaga kerja.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Kelola gaji, pajak PPh 21 &amp; BPJS, penagihan klien, hingga pencairan
            gaji lintas badan usaha — akurat, terpusat, dan bebas Excel manual.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-gold-light">4</p>
              <p className="text-white/60">Klien aktif</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-light">99</p>
              <p className="text-white/60">Tenaga kerja</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-light">2</p>
              <p className="text-white/60">Badan usaha</p>
            </div>
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
