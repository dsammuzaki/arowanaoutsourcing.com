// Cetak / simpan-PDF hanya satu elemen berdasarkan id.
// Memakai kelas `print-one` + atribut `data-print-target` (lihat globals.css).
export function printElementById(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) {
    window.print();
    return;
  }
  el.setAttribute("data-print-target", "");
  document.body.classList.add("print-one");

  const cleanup = () => {
    document.body.classList.remove("print-one");
    el.removeAttribute("data-print-target");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  // fallback bila afterprint tidak terpicu
  setTimeout(() => {
    window.print();
    setTimeout(cleanup, 800);
  }, 60);
}
