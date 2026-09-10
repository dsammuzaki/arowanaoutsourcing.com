import { PageHeader, Card, Badge, Avatar } from "@/components/ui";
import { Briefcase, Users, CalendarClock, UserCheck } from "lucide-react";
import {
  jobPostings,
  candidates,
  candidateStages,
  interviews,
  onboardingChecklist,
  recruitmentStats,
} from "@/lib/data";
import { tglParts } from "@/lib/format";
import { cookies } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { BuatLowonganButton } from "@/components/create-forms";
import { JobTable, type JobRow } from "@/components/job-table";
import { clients as mockClients } from "@/lib/data";

async function getJobs(): Promise<{ jobs: JobRow[]; clientList: { id: string; name: string }[]; clientMap: Record<string, string> }> {
  let clientList = mockClients.map((c) => ({ id: c.id, name: c.name }));
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: jp }, { data: cls }] = await Promise.all([
        sb.from("job_postings").select("id,title,client_id,type,location,applicants,target,status").order("posted", { ascending: false }),
        sb.from("clients").select("id,name"),
      ]);
      if (cls) clientList = cls;
      if (jp) {
        const clientMap = Object.fromEntries(clientList.map((c) => [c.id, c.name]));
        return { jobs: jp as JobRow[], clientList, clientMap };
      }
    } catch {
      /* fallback */
    }
  }
  const jobs: JobRow[] = jobPostings.map((j) => ({ id: j.id, title: j.title, client_id: j.clientId, type: j.type, location: j.location, applicants: j.applicants, target: j.target, status: j.status }));
  const clientMap = Object.fromEntries(clientList.map((c) => [c.id, c.name]));
  return { jobs, clientList, clientMap };
}

const stageTone: Record<string, string> = {
  Pelamar: "slate",
  Skrining: "amber",
  Interview: "teal",
  Penawaran: "gold",
  Diterima: "green",
};

export default async function RekrutmenPage() {
  const { jobs, clientList, clientMap } = await getJobs();
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
        actions={<BuatLowonganButton clients={clientList} />}
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

      {/* Candidate pipeline — horizontal-scroll kanban on small screens, grid on wide */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-foreground">Pipeline Kandidat</h2>
          <span className="text-xs text-muted-foreground xl:hidden">Geser →</span>
        </div>
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0 xl:pb-0">
          {candidateStages.map((stage) => {
            const list = candidates.filter((c) => c.stage === stage);
            return (
              <div
                key={stage}
                className="w-[78%] shrink-0 snap-start rounded-lg bg-muted/60 p-3 sm:w-[300px] xl:w-auto xl:shrink"
              >
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
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-bold text-foreground">Lowongan</h2>
            <span className="text-xs text-muted-foreground">Klik baris untuk detail</span>
          </div>
          <JobTable jobs={jobs} clientMap={clientMap} />
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
