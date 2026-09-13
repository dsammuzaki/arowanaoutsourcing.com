import { Logo } from "@/components/logo";

export function LoadingScreen({
  fullscreen = false,
  label = "Memuat…",
}: {
  fullscreen?: boolean;
  label?: string;
}) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-[#0b1f2e]"
          : "flex min-h-[60vh] w-full flex-col items-center justify-center gap-5"
      }
    >
      <div className="relative">
        <span className="absolute -inset-3 rounded-full bg-teal/25 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span
            className={`absolute inset-0 animate-spin rounded-full border-[3px] border-t-teal ${
              fullscreen ? "border-white/15" : "border-border"
            }`}
          />
          <Logo size={30} />
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium ${fullscreen ? "text-white/80" : "text-foreground"}`}>{label}</p>
        <p className={`mt-0.5 text-xs ${fullscreen ? "text-teal-soft/70" : "text-muted-foreground"}`}>
          Barata Sakti Utama
        </p>
      </div>
    </div>
  );
}
