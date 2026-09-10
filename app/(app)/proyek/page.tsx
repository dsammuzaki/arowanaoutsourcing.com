import { cookies } from "next/headers";
import { PageHeader, Card } from "@/components/ui";
import { SquareKanban, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { KanbanBoard } from "@/components/kanban-board";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import {
  kanbanColumns,
  projectGroups as mockGroups,
  projectTasks as mockTasks,
  type ProjectGroup,
  type ProjectTask,
  type KanbanColKey,
  type Priority,
  type ApprovalStatus,
} from "@/lib/data";

async function getData(): Promise<{ groups: ProjectGroup[]; tasks: ProjectTask[]; persist: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const [{ data: pg }, { data: tk }] = await Promise.all([
        sb.from("projects").select("id,name,color,owner,due_date").order("created_at"),
        sb.from("tasks").select("*").order("created_at"),
      ]);
      if (pg && tk) {
        const groups: ProjectGroup[] = pg.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color ?? "#1a7d9c",
          owner: g.owner ?? "",
          due: g.due_date ?? "",
        }));
        const tasks: ProjectTask[] = tk.map((t) => ({
          id: String(t.id),
          projectId: t.project_id,
          title: t.title,
          desc: t.description ?? "",
          column: (t.column_key ?? "todo") as KanbanColKey,
          priority: (t.priority ?? "sedang") as Priority,
          assignee: t.assignee ?? "",
          due: t.due_date ?? "",
          checklistDone: t.checklist_done ?? 0,
          checklistTotal: t.checklist_total ?? 0,
          comments: t.comments ?? 0,
          approvalStatus: (t.approval_status ?? "draft") as ApprovalStatus,
          approver: t.approver ?? "",
        }));
        return { groups, tasks, persist: true };
      }
    } catch {
      /* fallback */
    }
  }
  return { groups: mockGroups, tasks: mockTasks, persist: false };
}

export default async function ProyekPage() {
  const { groups, tasks, persist } = await getData();
  const stats = [
    { label: "Proyek Aktif", value: groups.length, Icon: SquareKanban },
    { label: "Total Tugas", value: tasks.length, Icon: ListChecks },
    { label: "Selesai", value: tasks.filter((t) => t.column === "done").length, Icon: CheckCircle2 },
    { label: "Menunggu Approval", value: tasks.filter((t) => t.approvalStatus === "menunggu").length, Icon: Clock },
  ];
  return (
    <>
      <PageHeader
        title="Manajemen Proyek"
        subtitle={
          persist
            ? "Papan Kanban tersimpan di database — buat tugas, tarik antar kolom, approval"
            : "Papan Kanban (mode demo) — aktifkan Supabase untuk simpan permanen"
        }
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

      <KanbanBoard columns={kanbanColumns} groups={groups} tasks={tasks} persist={persist} />
    </>
  );
}
