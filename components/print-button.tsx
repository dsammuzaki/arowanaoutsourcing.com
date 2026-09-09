"use client";

export function PrintButton({
  children,
  className = "btn-outline",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button type="button" className={`${className} no-print`} onClick={() => window.print()}>
      {children}
    </button>
  );
}
