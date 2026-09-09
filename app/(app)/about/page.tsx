import { Card, Badge } from "@/components/ui";
import { Logo } from "@/components/logo";
import {
  Target,
  Eye,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Briefcase,
} from "lucide-react";
import { aboutCompany } from "@/lib/data";
import { initials } from "@/lib/format";

const c = aboutCompany;

export default function AboutPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <span className="hero-anim pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-24 items-center justify-center rounded-2xl bg-white/95 p-2">
            <Logo size={56} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{c.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-teal-soft">{c.tagline}</p>
            <div className="mt-2">
              <Badge tone="gold">Berdiri sejak {c.since}</Badge>
            </div>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tentang / Visi / Misi */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-2 font-bold text-foreground">Tentang Kami</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{c.about}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <div className="mb-1.5 flex items-center gap-2 text-primary">
                <Eye size={17} />
                <h3 className="text-sm font-bold text-foreground">Visi</h3>
              </div>
              <p className="text-sm text-muted-foreground">{c.visi}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="mb-1.5 flex items-center gap-2 text-primary">
                <Target size={17} />
                <h3 className="text-sm font-bold text-foreground">Misi</h3>
              </div>
              <ul className="space-y-1.5">
                {c.misi.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Kontak */}
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-foreground">Kontak</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <span className="text-muted-foreground">{c.kontak.alamat}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={16} className="shrink-0 text-primary" />
              <span className="text-muted-foreground">{c.kontak.telp}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageCircle size={16} className="shrink-0 text-primary" />
              <span className="text-muted-foreground">WA {c.kontak.whatsapp}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-primary" />
              <span className="text-muted-foreground">{c.kontak.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="shrink-0 text-primary" />
              <span className="text-muted-foreground">{c.kontak.website}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Layanan */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Layanan Kami</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.layanan.map((s) => (
            <Card key={s.title} className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Briefcase size={20} />
              </div>
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Legalitas + Tim */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <ShieldCheck size={18} className="text-primary" />
            <h2 className="font-bold text-foreground">Legalitas Perusahaan</h2>
          </div>
          <div className="divide-y divide-border">
            {c.legalitas.map((l) => (
              <div key={l.label} className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">{l.label}</span>
                <span className="text-sm font-semibold text-foreground sm:text-right">{l.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Tim Manajemen</h2>
          </div>
          <div className="divide-y divide-border">
            {c.team.map((t) => (
              <div key={t.name} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-white">
                  {initials(t.name)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
