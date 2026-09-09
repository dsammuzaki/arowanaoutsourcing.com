import { PageHeader, Card } from "@/components/ui";
import { SquareKanban, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { KanbanBoard } from "@/components/kanban-board";
import { kanbanColumns, projectGroups, projectTasks, projectStats } from "@/lib/data";

export default function ProyekPage() {
  const stats = [
    { label: "Proyek Aktif", value: projectStats.totalProyek, Icon: SquareKanban },
    { label: "Total Tugas", value: projectStats.totalTugas, Icon: ListChecks },
    { label: "Selesai", value: projectStats.selesai, Icon: CheckCircle2 },
    { label: "Menunggu Approval", value: projectStats.menungguApproval, Icon: Clock },
  ];
  return (
    <>
      <PageHeader
        title="Manajemen Proyek"
        subtitle="Papan Kanban proyek & goal — buat tugas, tarik antar kolom, monitoring harian, dan approval"
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <KanbanBoard columns={kanbanColumns} groups={projectGroups} tasks={projectTasks} />
    </>
  );
}
