"use client";

import { printElementById } from "@/lib/print";

export function PrintButton({
  children,
  className = "btn-outline",
  targetId,
}: {
  children: React.ReactNode;
  className?: string;
  targetId?: string;
}) {
  return (
    <button
      type="button"
      className={`${className} no-print`}
      onClick={() => (targetId ? printElementById(targetId) : window.print())}
    >
      {children}
    </button>
  );
}
