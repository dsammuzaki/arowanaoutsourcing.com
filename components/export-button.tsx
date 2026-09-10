"use client";

import { Download } from "lucide-react";

type Col = { key: string; label: string };
type Row = Record<string, string | number | null | undefined>;

export function ExportButton({
  filename,
  columns,
  rows,
  className = "btn-outline",
  label = "Ekspor",
}: {
  filename: string;
  columns: Col[];
  rows: Row[];
  className?: string;
  label?: string;
}) {
  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = columns.map((c) => esc(c.label)).join(",");
    const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\n");
    const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button className={className} onClick={exportCsv} type="button">
      <Download size={16} /> {label}
    </button>
  );
}
