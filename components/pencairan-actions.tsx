"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { IconCheck } from "@/components/icons";
import { useToast } from "@/components/toast";

export function ProsesPencairanButton() {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function proses() {
    if (done || busy) return;
    if (!confirm("Proses pencairan gaji periode ini? Batch transfer & tunai akan ditandai diproses.")) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone(true);
      toast.success("Pencairan gaji berhasil diproses");
    }, 700);
  }

  return (
    <button className={`btn-primary ${done ? "opacity-70" : ""}`} onClick={proses} disabled={busy || done}>
      {busy ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Memproses…
        </>
      ) : (
        <>
          <IconCheck width={16} height={16} /> {done ? "Pencairan Diproses" : "Proses Pencairan"}
        </>
      )}
    </button>
  );
}
