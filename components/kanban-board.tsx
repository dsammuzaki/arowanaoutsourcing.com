"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTask, moveTask as moveTaskAction, setApproval } from "@/app/(app)/proyek/actions";
import {
  Plus,
  SquareKanban,
  ListTodo,
  Flag,
  MessageSquare,
  CheckSquare,
  Calendar,
  Check,
  X as XIcon,
  Send,
  Table2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Modal } from "./modal";
import type {
  KanbanColumn,
  ProjectGroup,
  ProjectTask,
  KanbanColKey,
  Priority,
  ApprovalStatus,
} from "@/lib/data";
import { priorityMeta, approvalMeta } from "@/lib/data";
import { tanggal, initials } from "@/lib/format";
import { FilterBar, type Filter, type FilterFieldDef } from "@/components/ui/filter-token-bar";

const APPROVERS = ["Zaenudin ZAI", "Agus Hidayatulloh", "Rifal Riyadi"];
const ASSIGNEES = ["Agus Hidayatulloh", "Rifal Riyadi", "Masturoh HS, S.Pd.I", "Zaenudin ZAI"];

export function KanbanBoard({
  columns,
  groups,
  tasks: initialTasks,
  persist = false,
}: {
  columns: KanbanColumn[];
  groups: ProjectGroup[];
  tasks: ProjectTask[];
  persist?: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ProjectTask[]>(initialTasks);
  const [view, setView] = useState<"tabel" | "papan" | "harian">("tabel");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<KanbanColKey | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const groupById = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g])), [groups]);

  const dot = (color: string) => (
    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
  );
  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))) as string[],
    [tasks]
  );
  const OPS = [
    { value: "is", label: "adalah" },
    { value: "is_not", label: "bukan" },
    { value: "is_any", label: "salah satu dari", multi: true },
  ];
  const filterFields: FilterFieldDef[] = useMemo(
    () => [
      { id: "status", label: "Status", icon: dot("#64748b"), operators: OPS, options: columns.map((c) => ({ value: c.key, label: c.label, glyph: dot(c.color) })) },
      {
        id: "priority",
        label: "Prioritas",
        icon: dot("#c69a34"),
        operators: OPS,
        options: (Object.keys(priorityMeta) as Priority[]).map((p) => ({ value: p, label: priorityMeta[p].label })),
      },
      { id: "proyek", label: "Proyek", icon: dot("#1a7d9c"), operators: OPS, options: groups.map((g) => ({ value: g.id, label: g.name, glyph: dot(g.color) })) },
      { id: "assignee", label: "Penanggung jawab", icon: dot("#8e7cc3"), operators: OPS, options: assignees.map((a) => ({ value: a, label: a })) },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, groups, assignees]
  );

  const visible = useMemo(
    () =>
      tasks.filter((t) =>
        filters.every((f) => {
          if (!f.values.length) return true;
          const v =
            f.field === "status" ? t.column : f.field === "priority" ? t.priority : f.field === "proyek" ? t.projectId : f.field === "assignee" ? t.assignee : undefined;
          switch (f.operator) {
            case "is":
              return v === f.values[0];
            case "is_not":
              return v !== f.values[0];
            case "is_any":
              return f.values.includes(v as string);
            case "is_none":
              return !f.values.includes(v as string);
            default:
              return true;
          }
        })
      ),
    [tasks, filters]
  );
  const detail = tasks.find((t) => t.id === detailId) || null;

  function updateTask(id: string, patch: Partial<ProjectTask>) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function moveTask(id: string, column: KanbanColKey) {
    const prev = tasks.find((t) => t.id === id)?.column;
    updateTask(id, { column }); // optimistic
    if (persist) {
      const res = await moveTaskAction(id, column);
      if (!res.ok && prev) updateTask(id, { column: prev });
    }
  }

  async function changeApproval(id: string, status: ApprovalStatus) {
    const prev = tasks.find((t) => t.id === id)?.approvalStatus;
    updateTask(id, { approvalStatus: status }); // optimistic
    if (persist) {
      const res = await setApproval(id, status);
      if (!res.ok) {
        if (prev) updateTask(id, { approvalStatus: prev });
        alert(res.error || "Gagal memperbarui approval.");
      }
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          <button
            onClick={() => setView("tabel")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              view === "tabel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Table2 size={16} /> Tabel
          </button>
          <button
            onClick={() => setView("papan")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              view === "papan" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <SquareKanban size={16} /> Papan
          </button>
          <button
            onClick={() => setView("harian")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              view === "harian" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ListTodo size={16} /> Monitoring Harian
          </button>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Tugas
        </button>
      </div>

      {/* Filter token bar ala Linear */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card px-3 py-2">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">Filter</span>
        <FilterBar fields={filterFields} value={filters} onChange={setFilters} aria-label="Filter tugas proyek" />
      </div>

      {view === "tabel" ? (
        <TableView
          columns={columns}
          tasks={visible}
          groups={groups}
          onOpen={setDetailId}
          onStatus={(id, col) => moveTask(id, col)}
        />
      ) : view === "papan" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = visible.filter((t) => t.column === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.key);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => {
                  if (dragId) moveTask(dragId, col.key);
                  setDragId(null);
                  setOverCol(null);
                }}
                className={`flex w-72 shrink-0 flex-col rounded-xl border p-2 transition-colors ${
                  overCol === col.key ? "border-primary bg-primary/5" : "border-border bg-muted/40"
                }`}
              >
                <div className="mb-2 flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                    <span className="rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                      {colTasks.length}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {colTasks.map((t) => {
                    const g = groupById[t.projectId];
                    return (
                      <button
                        key={t.id}
                        draggable
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setDetailId(t.id)}
                        className={`cursor-pointer rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md ${
                          dragId === t.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: g?.color }} />
                          <span className="truncate text-[11px] text-muted-foreground">{g?.name}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{t.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`badge ${priorityMeta[t.priority].cls}`}>
                            <Flag size={11} /> {priorityMeta[t.priority].label}
                          </span>
                          {t.approvalStatus !== "draft" && (
                            <span className={`badge ${approvalMeta[t.approvalStatus].cls}`}>
                              {approvalMeta[t.approvalStatus].label}
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CheckSquare size={12} /> {t.checklistDone}/{t.checklistTotal}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare size={12} /> {t.comments}
                            </span>
                          </div>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white" title={t.assignee}>
                            {initials(t.assignee)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                      Tarik tugas ke sini
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DailyView tasks={visible} groupById={groupById} onOpen={setDetailId} />
      )}

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title={detail?.title ?? ""}
        subtitle={detail ? groupById[detail.projectId]?.name : ""}
        size="lg"
        footer={
          detail ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Pindah ke:</span>
                <select
                  value={detail.column}
                  onChange={(e) => moveTask(detail.id, e.target.value as KanbanColKey)}
                  className="input w-auto py-1.5 text-sm"
                >
                  {columns.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {detail.approvalStatus === "draft" && (
                <button className="btn-outline" onClick={() => changeApproval(detail.id, "menunggu")}>
                  <Send size={15} /> Kirim untuk Approval
                </button>
              )}
              {detail.approvalStatus === "menunggu" && (
                <div className="flex gap-2">
                  <button
                    className="btn bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => changeApproval(detail.id, "disetujui")}
                  >
                    <Check size={15} /> Setujui
                  </button>
                  <button
                    className="btn bg-brand-red text-white hover:bg-brand-reddark"
                    onClick={() => changeApproval(detail.id, "ditolak")}
                  >
                    <XIcon size={15} /> Tolak
                  </button>
                </div>
              )}
            </div>
          ) : null
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${priorityMeta[detail.priority].cls}`}>
                <Flag size={11} /> {priorityMeta[detail.priority].label}
              </span>
              <span className={`badge ${approvalMeta[detail.approvalStatus].cls}`}>
                {approvalMeta[detail.approvalStatus].label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{detail.desc}</p>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Penanggung jawab</p>
                <p className="mt-0.5 flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
                    {initials(detail.assignee)}
                  </span>
                  {detail.assignee}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approver</p>
                <select
                  value={detail.approver}
                  onChange={(e) => updateTask(detail.id, { approver: e.target.value })}
                  className="input mt-0.5 py-1.5 text-sm"
                >
                  {APPROVERS.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenggat</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-foreground">
                  <Calendar size={14} className="text-primary" /> {tanggal(detail.due)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Checklist</p>
                <p className="mt-0.5 font-semibold text-foreground">
                  {detail.checklistDone}/{detail.checklistTotal} selesai
                </p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progres checklist</span>
                <span className="font-semibold text-foreground">
                  {Math.round((detail.checklistDone / Math.max(detail.checklistTotal, 1)) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-teal"
                  style={{ width: `${(detail.checklistDone / Math.max(detail.checklistTotal, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <CreateTaskModal
        open={creating}
        onClose={() => setCreating(false)}
        columns={columns}
        groups={groups}
        onCreate={async (t) => {
          if (persist) {
            const res = await createTask({
              projectId: t.projectId,
              title: t.title,
              desc: t.desc,
              column: t.column,
              priority: t.priority,
              assignee: t.assignee,
              due: t.due,
              approver: t.approver,
            });
            if (res.ok) {
              setCreating(false);
              router.refresh();
            } else {
              alert(res.error || "Gagal menyimpan tugas.");
            }
          } else {
            setTasks((ts) => [{ ...t, id: `t-${Date.now()}` }, ...ts]);
            setCreating(false);
          }
        }}
      />
    </>
  );
}

// ---- Tampilan Tabel ala monday.com: dikelompokkan per proyek ----
function TableView({
  columns,
  tasks,
  groups,
  onOpen,
  onStatus,
}: {
  columns: KanbanColumn[];
  tasks: ProjectTask[];
  groups: ProjectGroup[];
  onOpen: (id: string) => void;
  onStatus: (id: string, col: KanbanColKey) => void;
}) {
  const colMap = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groupsWithTasks = groups
    .map((g) => ({ group: g, items: tasks.filter((t) => t.projectId === g.id) }))
    .filter((x) => x.items.length > 0);

  if (groupsWithTasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Belum ada tugas. Klik <span className="font-semibold text-foreground">+ Tugas</span> untuk menambah.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupsWithTasks.map(({ group, items }) => {
        const isCollapsed = collapsed[group.id];
        // distribusi status untuk bar ringkasan
        const dist = columns
          .map((c) => ({ c, n: items.filter((t) => t.column === c.key).length }))
          .filter((x) => x.n > 0);
        const dues = items.map((t) => t.due).filter(Boolean).sort();
        const dueRange =
          dues.length > 0
            ? dues[0] === dues[dues.length - 1]
              ? tanggal(dues[0])
              : `${tanggal(dues[0])} – ${tanggal(dues[dues.length - 1])}`
            : "—";

        return (
          <div key={group.id} className="overflow-hidden">
            {/* Header grup */}
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !c[group.id] }))}
              className="mb-1 flex items-center gap-2 text-left"
              style={{ color: group.color }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              <span className="text-base font-bold">{group.name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {items.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="bg-muted/60">
                      <th className="w-1 p-0" style={{ background: group.color }} />
                      <th className="th">Tugas</th>
                      <th className="th w-24 text-center">Owner</th>
                      <th className="th w-44 text-center">Status</th>
                      <th className="th w-36 text-center">Tenggat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((t) => {
                      const col = colMap[t.column];
                      return (
                        <tr
                          key={t.id}
                          onClick={() => onOpen(t.id)}
                          className="group cursor-pointer bg-card hover:bg-muted/40"
                        >
                          <td className="w-1 p-0" style={{ background: group.color }} />
                          <td className="td">
                            <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                              {t.title}
                            </span>
                            <span className={`ml-2 badge ${priorityMeta[t.priority].cls}`}>
                              <Flag size={10} /> {priorityMeta[t.priority].label}
                            </span>
                          </td>
                          <td className="td text-center">
                            <span
                              className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white"
                              title={t.assignee}
                            >
                              {initials(t.assignee)}
                            </span>
                          </td>
                          <td className="p-1 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <select
                                value={t.column}
                                onChange={(e) => onStatus(t.id, e.target.value as KanbanColKey)}
                                className="w-full cursor-pointer appearance-none rounded-md border-0 px-2 py-2 text-center text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                                style={{ background: col?.color ?? "#64748b" }}
                                title="Ubah status"
                              >
                                {columns.map((c) => (
                                  <option key={c.key} value={c.key} className="bg-card text-foreground">
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="td text-center text-muted-foreground">
                            {t.due ? tanggal(t.due) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Baris ringkasan (battery ala monday.com) */}
                  <tfoot>
                    <tr className="bg-muted/40">
                      <td className="w-1 p-0" style={{ background: group.color }} />
                      <td className="td text-xs text-muted-foreground">Ringkasan {items.length} tugas</td>
                      <td className="td" />
                      <td className="p-2">
                        <div className="flex h-5 w-full overflow-hidden rounded-full">
                          {dist.map(({ c, n }) => (
                            <span
                              key={c.key}
                              title={`${c.label}: ${n}`}
                              style={{ background: c.color, width: `${(n / items.length) * 100}%` }}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
                          {dueRange}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DailyView({
  tasks,
  groupById,
  onOpen,
}: {
  tasks: ProjectTask[];
  groupById: Record<string, ProjectGroup>;
  onOpen: (id: string) => void;
}) {
  const people = Array.from(new Set(tasks.map((t) => t.assignee)));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Standup harian — apa yang dikerjakan tiap orang hari ini.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {people.map((p) => {
          const mine = tasks.filter((t) => t.assignee === p && t.column !== "done" && t.column !== "backlog");
          return (
            <div key={p} className="card p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">
                  {initials(p)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{p}</p>
                  <p className="text-xs text-muted-foreground">{mine.length} tugas aktif</p>
                </div>
              </div>
              <div className="space-y-2">
                {mine.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpen(t.id)}
                    className="flex w-full items-center gap-2 rounded-lg border border-border p-2.5 text-left hover:bg-muted/60"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: groupById[t.projectId]?.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t.title}</span>
                    <span className={`badge ${priorityMeta[t.priority].cls}`}>{priorityMeta[t.priority].label}</span>
                  </button>
                ))}
                {mine.length === 0 && <p className="text-xs text-muted-foreground">Tidak ada tugas aktif.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateTaskModal({
  open,
  onClose,
  columns,
  groups,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  columns: KanbanColumn[];
  groups: ProjectGroup[];
  onCreate: (t: Omit<ProjectTask, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(groups[0]?.id ?? "");
  const [assignee, setAssignee] = useState(ASSIGNEES[0]);
  const [priority, setPriority] = useState<Priority>("sedang");
  const [column, setColumn] = useState<KanbanColKey>("todo");
  const [due, setDue] = useState("2026-09-30");

  function submit() {
    if (!title.trim()) return;
    onCreate({
      projectId,
      title: title.trim(),
      desc: "",
      column,
      priority,
      assignee,
      due,
      checklistDone: 0,
      checklistTotal: 0,
      comments: 0,
      approvalStatus: "draft" as ApprovalStatus,
      approver: APPROVERS[0],
    });
    setTitle("");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tugas Baru"
      subtitle="Tambahkan tugas ke papan proyek"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button className="btn-primary" onClick={submit}>
            Simpan
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Judul Tugas</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Skrining pelamar…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Proyek</label>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Penanggung Jawab</label>
            <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {ASSIGNEES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prioritas</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="rendah">Rendah</option>
              <option value="sedang">Sedang</option>
              <option value="tinggi">Tinggi</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label">Kolom</label>
            <select className="input" value={column} onChange={(e) => setColumn(e.target.value as KanbanColKey)}>
              {columns.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Tenggat</label>
          <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
