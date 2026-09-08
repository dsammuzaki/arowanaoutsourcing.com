import { PageHeader, Card, Badge, StatusPill, Avatar } from "@/components/ui";
import { Briefcase, Users, CalendarClock, UserCheck, Plus, MapPin } from "lucide-react";
import {
  jobPostings,
  candidates,
  candidateStages,
  interviews,
  onboardingChecklist,
  recruitmentStats,
  clientById,
  contractTypeLabel,
} from "@/lib/data";
import { tglParts } from "@/lib/format";

const stageTone: Record<string, string> = {
  Pelamar: "slate",
  Skrining: "amber",
  Interview: "teal",
  Penawaran: "gold",
  Diterima: "green",
};

export default function RekrutmenPage() {
  const stats = [
    { label: "Lowongan Aktif", value: recruitmentStats.lowonganAktif, Icon: Briefcase },
    { label: "Total Pelamar", value: recruitmentStats.totalPelamar, Icon: Users },
    { label: "Interview Terjadwal", value: recruitmentStats.interviewTerjadwal, Icon: CalendarClock },
    { label: "Diterima", value: recruitmentStats.diterima, Icon: UserCheck },
  ];
  const doneCount = onboardingChecklist.filter((o) => o.done).length;

  return (
    <>
      <PageHeader
        title="Rekrutmen & Onboarding"
        subtitle="Kelola lowongan, pipeline kandidat, interview, dan onboarding tenaga kerja"
        actions={
          <button className="btn-primary">
            <Plus size={16} /> Buat Lowongan
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Candidate pipeline */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 font-bold text-foreground">Pipeline Kandidat</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {candidateStages.map((stage) => {
            const list = candidates.filter((c) => c.stage === stage);
            return (
              <div key={stage} className="rounded-lg bg-muted/60 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{stage}</span>
                  <Badge tone={stageTone[stage]}>{list.length}</Badge>
                </div>
                <div className="space-y-2">
                  {list.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border bg-card p-2.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.position}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.source}</span>
                        <span className="font-semibold text-primary">Skor {c.score}</span>
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Job postings */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Lowongan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="th">Posisi</th>
                  <th className="th">Klien</th>
                  <th className="th">Lokasi</th>
                  <th className="th text-right">Pelamar</th>
                  <th className="th text-right">Target</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jobPostings.map((j) => (
                  <tr key={j.id} className="hover:bg-muted">
                    <td className="td">
                      <p className="font-semibold text-foreground">{j.title}</p>
                      <Badge tone="teal">{contractTypeLabel[j.type]}</Badge>
                    </td>
                    <td className="td text-muted-foreground">{clientById(j.clientId)?.name}</td>
                    <td className="td">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MapPin size={13} /> {j.location}
                      </span>
                    </td>
                    <td className="td text-right font-semibold">{j.applicants}</td>
                    <td className="td text-right text-muted-foreground">{j.target}</td>
                    <td className="td">
                      <StatusPill status={j.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side: interviews + onboarding */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-bold text-foreground">Interview Mendatang</h3>
            <div className="space-y-3">
              {interviews.map((iv) => (
                <div key={iv.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-semibold uppercase">
                      {tglParts(iv.date).mon}
                    </span>
                    <span className="text-sm font-bold leading-none">
                      {tglParts(iv.date).d}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{iv.candidate}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {iv.time} · {iv.type} · {iv.interviewer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-foreground">Checklist Onboarding</h3>
              <Badge tone="teal">
                {doneCount}/{onboardingChecklist.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {onboardingChecklist.map((o) => (
                <label key={o.item} className="flex items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    defaultChecked={o.done}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className={o.done ? "text-muted-foreground line-through" : "text-foreground"}>
                    {o.item}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
