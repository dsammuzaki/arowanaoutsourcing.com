"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Avatar } from "@/components/ui";
import { Modal } from "@/components/modal";
import { tanggal } from "@/lib/format";

export type GoalDTO = {
  id: string;
  title: string;
  employeeName: string;
  due: string;
  progress: number;
};

function scoreTone(v: number) {
  if (v >= 85) return "text-emerald-600";
  if (v >= 70) return "text-amber-600";
  return "text-brand-red";
}
function barColor(v: number) {
  if (v >= 85) return "#1a7d9c";
  if (v >= 60) return "#c69a34";
  return "#c0392b";
}

export function KinerjaGoals({ goals: initial, employees }: { goals: GoalDTO[]; employees: string[] }) {
  const [goals, setGoals] = useState<GoalDTO[]>(initial);
  const [creating, setCreating] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [emp, setEmp] = useState(employees[0] ?? "");
  const [due, setDue] = useState("2026-12-31");
  const [progress, setProgress] = useState(0);

  const detail = goals.find((g) => g.id === detailId) || null;

  function create() {
    if (!title.trim()) return;
    setGoals((gs) => [
      { id: `g-${Date.now()}`, title: title.trim(), employeeName: emp, due, progress },
      ...gs,
    ]);
    setTitle("");
    setProgress(0);
    setCreating(false);
  }

  function setGoalProgress(id: string, val: number) {
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, progress: val } : g)));
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-bold text-foreground">Goal Karyawan</h2>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setCreating(true)}>
          <Plus size={14} /> Buat Goal
        </button>
      </div>
      <div className="divide-y divide-border">
        {goals.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Belum ada goal. Klik “Buat Goal”.</p>
        )}
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => setDetailId(g.id)}
            className="block w-full px-5 py-4 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={g.employeeName || "?"} />
                <div>
                  <p className="font-semibold text-foreground">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.employeeName} · tenggat {tanggal(g.due)}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-bold ${scoreTone(g.progress)}`}>{g.progress}%</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: barColor(g.progress) }} />
            </div>
          </button>
        ))}
      </div>

      {/* Create modal */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Buat Goal Baru"
        subtitle="Tetapkan target kinerja karyawan"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setCreating(false)}>
              Batal
            </button>
            <button className="btn-primary" onClick={create}>
              Simpan Goal
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Judul Goal</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Tingkatkan kehadiran tim ke 98%" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Karyawan</label>
              <select className="input" value={emp} onChange={(e) => setEmp(e.target.value)}>
                {employees.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tenggat</label>
              <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Progress Awal · {progress}%</label>
            <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-teal-600" />
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title={detail?.title ?? ""}
        subtitle={detail ? `${detail.employeeName} · tenggat ${tanggal(detail.due)}` : ""}
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target size={22} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress saat ini</p>
                <p className={`text-2xl font-bold ${scoreTone(detail.progress)}`}>{detail.progress}%</p>
              </div>
            </div>
            <div>
              <label className="label">Perbarui progress · {detail.progress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={detail.progress}
                onChange={(e) => setGoalProgress(detail.id, Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${detail.progress}%`, background: barColor(detail.progress) }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((v) => (
                <button key={v} className="btn-outline px-3 py-1.5 text-xs" onClick={() => setGoalProgress(detail.id, v)}>
                  Set {v}%
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
