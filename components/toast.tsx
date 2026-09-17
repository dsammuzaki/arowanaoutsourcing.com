"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

type Variant = "success" | "error" | "info" | "loading";
type Toast = { id: number; title: string; desc?: string; variant: Variant };
type ToastInput = { title: string; desc?: string; variant?: Variant; duration?: number };

type Ctx = {
  show: (t: ToastInput) => number;
  success: (title: string, desc?: string) => number;
  error: (title: string, desc?: string) => number;
  info: (title: string, desc?: string) => number;
  loading: (title: string, desc?: string) => number;
  dismiss: (id: number) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return c;
}

const STYLES: Record<Variant, { ring: string; icon: React.ReactNode; bar: string }> = {
  success: {
    ring: "ring-emerald-500/30",
    bar: "bg-emerald-500",
    icon: <CheckCircle2 size={18} className="text-emerald-500" />,
  },
  error: {
    ring: "ring-red-500/30",
    bar: "bg-brand-red",
    icon: <AlertCircle size={18} className="text-brand-red" />,
  },
  info: {
    ring: "ring-teal-500/30",
    bar: "bg-teal-500",
    icon: <Info size={18} className="text-teal-600 dark:text-teal-400" />,
  },
  loading: {
    ring: "ring-teal-500/30",
    bar: "bg-teal-500",
    icon: <Loader2 size={18} className="animate-spin text-teal-600 dark:text-teal-400" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    ({ title, desc, variant = "info", duration }: ToastInput) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, title, desc, variant }]);
      // loading toasts tidak auto-hilang kecuali diberi durasi
      const ms = duration ?? (variant === "loading" ? 0 : 3600);
      if (ms > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ms)
        );
      }
      return id;
    },
    [dismiss]
  );

  const api: Ctx = {
    show,
    success: (title, desc) => show({ title, desc, variant: "success" }),
    error: (title, desc) => show({ title, desc, variant: "error" }),
    info: (title, desc) => show({ title, desc, variant: "info" }),
    loading: (title, desc) => show({ title, desc, variant: "loading" }),
    dismiss,
  };

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+var(--safe-top,0px))] z-[100] flex flex-col items-center gap-2 px-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const st = STYLES[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`toast-in pointer-events-auto card relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl px-4 py-3 shadow-xl ring-1 ${st.ring}`}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${st.bar}`} />
              <span className="mt-0.5 shrink-0">{st.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup notifikasi"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
