"use client";

import { useState } from "react";
import { IconCheck } from "@/components/icons";

export function ProsesPencairanButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`btn-primary ${done ? "opacity-70" : ""}`}
      onClick={() => {
        if (done) return;
        if (confirm("Proses pencairan gaji periode ini? Batch transfer & tunai akan ditandai diproses.")) {
          setDone(true);
        }
      }}
    >
      <IconCheck width={16} height={16} /> {done ? "Pencairan Diproses" : "Proses Pencairan"}
    </button>
  );
}
