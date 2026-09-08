// Deterministic formatters — no Intl/locale APIs, so server & client render
// identical output (avoids React hydration mismatch, error #418).

const group = (n: number) => {
  const neg = n < 0;
  const s = Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (neg ? "-" : "") + s;
};

export const rupiah = (n: number, opts?: { compact?: boolean }) => {
  if (opts?.compact) {
    if (Math.abs(n) >= 1_000_000_000)
      return "Rp " + (n / 1_000_000_000).toFixed(1).replace(".0", "") + " M";
    if (Math.abs(n) >= 1_000_000)
      return "Rp " + (n / 1_000_000).toFixed(1).replace(".0", "") + " jt";
    if (Math.abs(n) >= 1_000)
      return "Rp " + Math.round(n / 1_000) + " rb";
  }
  return "Rp " + group(n);
};

export const angka = (n: number) => group(n);

export const persen = (n: number) =>
  (n >= 0 ? "+" : "") + n.toFixed(1).replace(".0", "") + "%";

const bulanID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const tanggal = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${bulanID[m - 1]} ${y}`;
};

export const tglParts = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return { d: d || 1, mon: bulanID[(m || 1) - 1] };
};

export const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
