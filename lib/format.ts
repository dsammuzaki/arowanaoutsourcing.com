export const rupiah = (n: number, opts?: { compact?: boolean }) => {
  if (opts?.compact) {
    if (Math.abs(n) >= 1_000_000_000)
      return "Rp " + (n / 1_000_000_000).toFixed(1).replace(".0", "") + " M";
    if (Math.abs(n) >= 1_000_000)
      return "Rp " + (n / 1_000_000).toFixed(1).replace(".0", "") + " jt";
    if (Math.abs(n) >= 1_000)
      return "Rp " + Math.round(n / 1_000) + " rb";
  }
  return "Rp " + n.toLocaleString("id-ID");
};

export const angka = (n: number) => n.toLocaleString("id-ID");

export const persen = (n: number) =>
  (n >= 0 ? "+" : "") + n.toFixed(1).replace(".0", "") + "%";

export const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
