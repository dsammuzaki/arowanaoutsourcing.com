"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Badge, Avatar } from "@/components/ui";
import { Modal } from "@/components/modal";

export type Cand = {
  id: string;
  name: string;
  position: string;
  source: string;
  score: number;
  stage: string;
};

const stageTone: Record<string, string> = {
  Pelamar: "slate",
  Skrining: "amber",
  Interview: "teal",
  Penawaran: "gold",
  Diterima: "green",
};

export function CandidatePipeline({
  stages,
  candidates: initial,
  positions,
}: {
  stages: string[];
  candidates: Cand[];
  positions: string[];
}) {
  const [cands, setCands] = useState<Cand[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Cand | null>(null);

  const [form, setForm] = useState({ name: "", position: positions[0] ?? "", source: "Referral", stage: stages[0] });

  function move(id: string, stage: string) {
    setCands((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));
  }
  function shift(c: Cand, dir: -1 | 1) {
    const idx = stages.indexOf(c.stage);
    const next = stages[Math.min(stages.length - 1, Math.max(0, idx + dir))];
    if (next) move(c.id, next);
  }
  function addCand() {
    if (!form.name.trim()) return;
    setCands((cs) => [
      { id: `cand-${Date.now()}`, name: form.name.trim(), position: form.position, source: form.source, score: 70, stage: form.stage },
      ...cs,
    ]);
    setForm({ ...form, name: "" });
    setCreating(false);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground">Pipeline Kandidat</h2>
          <p className="text-xs text-muted-foreground">Tarik kartu antar tahap, atau pakai panah. Klik untuk detail.</p>
        </div>
        <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setCreating(true)}>
          <Plus size={14} /> Kandidat
        </button>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 xl:mx-0 xl:grid xl:grid-cols-5 xl:overflow-visible xl:px-0 xl:pb-0">
        {stages.map((stage) => {
          const list = cands.filter((c) => c.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => {
                if (dragId) move(dragId, stage);
                setDragId(null);
                setOverStage(null);
              }}
              className={`w-[78%] shrink-0 snap-start rounded-lg border p-3 transition-colors sm:w-[300px] xl:w-auto ${
                overStage === stage ? "border-primary bg-primary/5" : "border-transparent bg-muted/60"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{stage}</span>
                <Badge tone={stageTone[stage] ?? "slate"}>{list.length}</Badge>
              </div>
              <div className="space-y-2">
                {list.map((c) => {
                  const idx = stages.indexOf(c.stage);
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setDetail(c)}
                      className={`cursor-pointer rounded-lg border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md ${
                        dragId === c.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.position}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.source}</span>
                        <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                          <Star size={11} /> {c.score}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => shift(c, -1)}
                          disabled={idx === 0}
                          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          title="Tahap sebelumnya"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <button
                          onClick={() => shift(c, 1)}
                          disabled={idx === stages.length - 1}
                          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          title="Tahap berikutnya"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {list.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">—</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add candidate */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Tambah Kandidat"
        subtitle="Masukkan kandidat baru ke pipeline"
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setCreating(false)}>
              Batal
            </button>
            <button className="btn-primary" onClick={addCand}>
              Tambah
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Nama Kandidat</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Posisi</label>
              <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {positions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tahap</label>
              <select className="input" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                {stages.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Sumber</label>
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {["Referral", "JobStreet", "Walk-in", "LinkedIn", "Instagram"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""} subtitle={detail?.position}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={stageTone[detail.stage] ?? "slate"}>{detail.stage}</Badge>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Star size={14} className="text-primary" /> Skor {detail.score}
              </span>
              <span className="text-sm text-muted-foreground">· {detail.source}</span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Pindahkan ke tahap</p>
              <div className="flex flex-wrap gap-2">
                {stages.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      move(detail.id, s);
                      setDetail({ ...detail, stage: s });
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      s === detail.stage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
