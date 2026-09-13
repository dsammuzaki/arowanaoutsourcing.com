import { cookies } from "next/headers";
import { PageHeader, Card } from "@/components/ui";
import { SquareKanban, ListChecks, CheckCircle2, Clock } from "lucide-react";
import { KanbanBoard, type Member } from "@/components/kanban-board";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import {
  kanbanColumns,
  projectGroups as mockGroups,
  projectTasks as mockTasks,
  canManageTasks,
  type ProjectGroup,
  type ProjectTask,
  type KanbanColKey,
  type Priority,
  type ApprovalStatus,
} from "@/lib/data";

type Me = { id: string; name: string; role: string };

async function getData(): Promise<{
  groups: ProjectGroup[];
  tasks: ProjectTask[];
  persist: boolean;
  me: Me | null;
  members: Member[];
}> {
  if (isSupabaseConfigured()) {
    try {
      const sb = createClient(await cookies());
      const {
        data: { user },
      } = await sb.auth.getUser();

      const [{ data: pg }, { data: tk }, { data: profs }, meProfile] = await Promise.all([
        sb.from("projects").select("id,name,color,owner,due_date").order("created_at"),
        sb.from("tasks").select("*").order("created_at"),
        sb.from("profiles").select("id,full_name,role").order("full_name"),
        user ? sb.from("profiles").select("id,full_name,role").eq("id", user.id).single() : Promise.resolve({ data: null }),
      ]);

      const me: Me | null =
        user && meProfile.data
          ? { id: user.id, name: meProfile.data.full_name ?? "", role: meProfile.data.role ?? "" }
          : user
          ? { id: user.id, name: "", role: "" }
          : null;

      const members: Member[] = (profs ?? [])
        .filter((p) => p.role !== "customer")
        .map((p) => ({ id: p.id, name: p.full_name ?? "", role: p.role ?? "" }));

      if (pg && tk) {
        const groups: ProjectGroup[] = pg.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color ?? "#1a7d9c",
          owner: g.owner ?? "",
          due: g.due_date ?? "",
        }));
        let tasks: ProjectTask[] = tk.map((t) => ({
          id: String(t.id),
          projectId: t.project_id,
          title: t.title,
          desc: t.description ?? "",
          column: (t.column_key ?? "todo") as KanbanColKey,
          priority: (t.priority ?? "sedang") as Priority,
          assignee: t.assignee ?? "",
          assigneeId: t.assignee_id ?? undefined,
          reviewerId: t.reviewer_id ?? undefined,
          due: t.due_date ?? "",
          checklistDone: t.checklist_done ?? 0,
          checklistTotal: t.checklist_total ?? 0,
          comments: t.comments ?? 0,
          approvalStatus: (t.approval_status ?? "draft") as ApprovalStatus,
          approver: t.approver ?? "",
          resultNote: t.result_note ?? undefined,
          resultUrl: t.result_url ?? undefined,
          submittedAt: t.submitted_at ?? undefined,
          reviewedAt: t.reviewed_at ?? undefined,
          reviewNote: t.review_note ?? undefined,
        }));

        // Staf hanya melihat task yang ditugaskan kepadanya.
        if (me && !canManageTasks(me.role)) {
          tasks = tasks.filter((t) => t.assigneeId === me.id || (!!t.assignee && t.assignee === me.name));
        }
        return { groups, tasks, persist: true, me, members };
      }
      return { groups: mockGroups, tasks: mockTasks, persist: false, me, members };
    } catch {
      /* fallback */
    }
  }
  return { groups: mockGroups, tasks: mockTasks, persist: false, me: null, members: [] };
}

export default async function ProyekPage() {
  const { groups, tasks, persist, me, members } = await getData();
  const isManager = canManageTasks(me?.role);
  const stats = [
    { label: "Proyek Aktif", value: groups.length, Icon: SquareKanban },
    { label: isManager ? "Total Task" : "Task Saya", value: tasks.length, Icon: ListChecks },
    { label: "Selesai", value: tasks.filter((t) => t.column === "done").length, Icon: CheckCircle2 },
    { label: "Menunggu Tinjauan", value: tasks.filter((t) => t.approvalStatus === "menunggu").length, Icon: Clock },
  ];
  return (
    <>
      <PageHeader
        title="Task"
        subtitle={
          isManager
            ? "Buat task, tugaskan ke staf, dan tinjau hasilnya (ala monday.com / Jira)"
            : "Tugas yang diberikan kepada Anda — kerjakan lalu unggah hasilnya untuk ditinjau"
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

      <KanbanBoard
        columns={kanbanColumns}
        groups={groups}
        tasks={tasks}
        persist={persist}
        me={me}
        members={members}
      />
    </>
  );
}
